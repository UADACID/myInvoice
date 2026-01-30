import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Client, Invoice, Settings } from '@/domain/types';
import { formatFilename } from './filenameFormatter';
import { contractService } from '@/storage/services';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 50;

/**
 * Generate PDF for an invoice matching the reference design
 */
export async function generateInvoicePdf(
  invoice: Invoice,
  client: Client,
  settings: Settings
): Promise<{ pdfBytes: Uint8Array; filename: string }> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0, 0, 0);
  const gray = rgb(0.5, 0.5, 0.5);
  const lightGray = rgb(0.7, 0.7, 0.7);

  let y = A4_HEIGHT - MARGIN;

  // ============================================
  // TOP LEFT: Sender Information
  // ============================================
  page.drawText(settings.freelancerName, {
    x: MARGIN,
    y,
    size: 11,
    font: boldFont,
    color: black,
  });

  y -= 16;
  if (settings.address) {
    const addressLines = settings.address.split('\n').filter(line => line.trim());
    for (const line of addressLines) {
      page.drawText(line, {
        x: MARGIN,
        y,
        size: 9,
        font,
        color: black,
      });
      y -= 12;
    }
  }

  if (settings.email) {
    page.drawText(settings.email, {
      x: MARGIN,
      y,
      size: 9,
      font,
      color: rgb(0, 0, 0.8), // Blue-ish for email link appearance
    });
  }

  // ============================================
  // TOP RIGHT: Invoice Title and Details
  // ============================================
  let rightY = A4_HEIGHT - MARGIN;
  const invoiceTitle = 'INVOICE';
  const titleWidth = boldFont.widthOfTextAtSize(invoiceTitle, 28);
  page.drawText(invoiceTitle, {
    x: A4_WIDTH - MARGIN - titleWidth,
    y: rightY,
    size: 28,
    font: boldFont,
    color: gray,
  });

  rightY -= 30;
  // Format invoice number as [MM-YYYY-ms] from invoice number format: INV-YYYY-MM-{timestamp}
  const invoiceDate = new Date(invoice.issueDate);
  const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
  const year = invoiceDate.getFullYear();
  
  // Extract milliseconds from invoice number (last part after last dash)
  const parts = invoice.invoiceNumber.split('-');
  const timestamp = parts.at(-1) || '';
  // Get last 4 digits of timestamp as milliseconds identifier
  const ms = timestamp.slice(-4);
  
  const invoiceNumText = `INVOICE [${month}-${year}-${ms}]`;
  const numWidth = font.widthOfTextAtSize(invoiceNumText, 9);
  page.drawText(invoiceNumText, {
    x: A4_WIDTH - MARGIN - numWidth,
    y: rightY,
    size: 9,
    font,
    color: black,
  });

  rightY -= 14;
  const invoiceDateText = `INVOICE DATE: ${invoice.issueDate}`;
  const dateWidth = font.widthOfTextAtSize(invoiceDateText, 9);
  page.drawText(invoiceDateText, {
    x: A4_WIDTH - MARGIN - dateWidth,
    y: rightY,
    size: 9,
    font,
    color: black,
  });

  rightY -= 14;
  const dueDateText = `DUE DATE: ${invoice.dueDate}`;
  const dueWidth = font.widthOfTextAtSize(dueDateText, 9);
  page.drawText(dueDateText, {
    x: A4_WIDTH - MARGIN - dueWidth,
    y: rightY,
    size: 9,
    font,
    color: black,
  });

  // ============================================
  // MID-LEFT: Bill To Section
  // ============================================
  y = A4_HEIGHT - 140;
  page.drawText('BILL TO:', {
    x: MARGIN,
    y,
    size: 9,
    font: boldFont,
    color: black,
  });

  y -= 14;
  page.drawText(client.companyName, {
    x: MARGIN,
    y,
    size: 10,
    font,
    color: black,
  });

  y -= 12;
  if (client.address) {
    const clientAddressLines = client.address.split('\n').filter(line => line.trim());
    for (const line of clientAddressLines) {
      page.drawText(line, {
        x: MARGIN,
        y,
        size: 9,
        font,
        color: black,
      });
      y -= 12;
    }
  }

  if (client.email) {
    page.drawText(`Email: ${client.email}`, {
      x: MARGIN,
      y,
      size: 9,
      font,
      color: rgb(0, 0, 0.8),
    });
  }

  // ============================================
  // TABLE WITH FULL GRID
  // ============================================
  const tableTop = A4_HEIGHT - 280;
  const tableLeft = MARGIN;
  const tableRight = A4_WIDTH - MARGIN;
  const tableWidth = tableRight - tableLeft;
  const rowHeight = 22;
  const headerRowHeight = 24;
  const numDataRows = 7; // Number of data rows including empty ones
  const tableHeight = headerRowHeight + (numDataRows * rowHeight);
  const tableBottom = tableTop - tableHeight;

  // Column widths
  const col1Width = 80;  // QUANTITY
  const col4Width = 70;  // TOTAL
  const col3Width = 80;  // UNIT PRICE
  const col2Width = tableWidth - col1Width - col3Width - col4Width; // DESCRIPTION

  const col1X = tableLeft;
  const col2X = col1X + col1Width;
  const col3X = col2X + col2Width;
  const col4X = col3X + col3Width;

  // Draw outer border
  page.drawRectangle({
    x: tableLeft,
    y: tableBottom,
    width: tableWidth,
    height: tableHeight,
    borderColor: black,
    borderWidth: 0.5,
  });

  // Draw column dividers (vertical lines)
  [col2X, col3X, col4X].forEach(x => {
    page.drawLine({
      start: { x, y: tableTop },
      end: { x, y: tableBottom },
      thickness: 0.5,
      color: black,
    });
  });

  // Draw header row bottom line
  const headerBottom = tableTop - headerRowHeight;
  page.drawLine({
    start: { x: tableLeft, y: headerBottom },
    end: { x: tableRight, y: headerBottom },
    thickness: 0.5,
    color: black,
  });

  // Draw row dividers (horizontal lines)
  for (let i = 1; i < numDataRows; i++) {
    const rowY = headerBottom - (i * rowHeight);
    page.drawLine({
      start: { x: tableLeft, y: rowY },
      end: { x: tableRight, y: rowY },
      thickness: 0.5,
      color: lightGray,
    });
  }

  // Header text
  const headerY = tableTop - 16;
  page.drawText('QUANTITY', {
    x: col1X + 10,
    y: headerY,
    size: 9,
    font: boldFont,
    color: black,
  });
  page.drawText('DESCRIPTION', {
    x: col2X + 10,
    y: headerY,
    size: 9,
    font: boldFont,
    color: black,
  });
  page.drawText('UNIT PRICE', {
    x: col3X + 5,
    y: headerY,
    size: 9,
    font: boldFont,
    color: black,
  });
  page.drawText('TOTAL', {
    x: col4X + 15,
    y: headerY,
    size: 9,
    font: boldFont,
    color: black,
  });

  // Determine currency and items source
  const contracts = await contractService.getByClientId(invoice.clientId);
  const contract = contracts[0];
  
  // Check if invoice has custom items
  const hasCustomItems = invoice.items && invoice.items.length > 0;
  const currency = invoice.currency || contract?.currency || 'JPY';
  const itemsToRender = hasCustomItems ? invoice.items! : [];

  // Render invoice items
  if (hasCustomItems && itemsToRender.length > 0) {
    // Render custom invoice items
    itemsToRender.forEach((item, index) => {
      if (index >= numDataRows) return; // Limit to available rows
      
      const dataRowY = headerBottom - 15 - (index * rowHeight);
      
      // Quantity (centered)
      const qtyText = String(item.quantity);
      const qtyWidth = font.widthOfTextAtSize(qtyText, 10);
      page.drawText(qtyText, {
        x: col1X + (col1Width - qtyWidth) / 2,
        y: dataRowY,
        size: 10,
        font,
        color: black,
      });

      // Description (truncate if too long)
      const maxDescWidth = col2Width - 20;
      let description = item.description;
      let descWidth = font.widthOfTextAtSize(description, 10);
      if (descWidth > maxDescWidth) {
        // Truncate description
        while (descWidth > maxDescWidth && description.length > 0) {
          description = description.slice(0, -1);
          descWidth = font.widthOfTextAtSize(description + '...', 10);
        }
        description = description + '...';
      }
      page.drawText(description, {
        x: col2X + 10,
        y: dataRowY,
        size: 10,
        font,
        color: black,
      });

      // Unit Price (right-aligned in UNIT PRICE column - col3X)
      const itemTotal = item.quantity * item.unitPrice;
      const unitPriceText = `${item.unitPrice.toLocaleString()} ${currency}`;
      const unitPriceWidth = font.widthOfTextAtSize(unitPriceText, 10);
      page.drawText(unitPriceText, {
        x: col4X - unitPriceWidth - 5,
        y: dataRowY,
        size: 10,
        font,
        color: black,
      });

      // Total (right-aligned in TOTAL column - col4X)
      const totalText = `${itemTotal.toLocaleString()} ${currency}`;
      const totalWidth = font.widthOfTextAtSize(totalText, 10);
      page.drawText(totalText, {
        x: tableRight - totalWidth - 5,
        y: dataRowY,
        size: 10,
        font,
        color: black,
      });
    });
  } else if (contract) {
    // Fall back to contract-based rendering (backward compatibility)
    const dataRowY = headerBottom - 15;
    const invoiceDate = new Date(invoice.issueDate);
    const monthName = invoiceDate.toLocaleString('default', { month: 'long' });
    const year = invoiceDate.getFullYear();
    
    const description = contract.descriptionTemplate
      .replace(/\{\{month\}\}/g, monthName)
      .replace(/\{\{year\}\}/g, String(year));

    // Quantity (centered)
    const qtyText = String(contract.quantity);
    const qtyWidth = font.widthOfTextAtSize(qtyText, 10);
    page.drawText(qtyText, {
      x: col1X + (col1Width - qtyWidth) / 2,
      y: dataRowY,
      size: 10,
      font,
      color: black,
    });

    // Description
    page.drawText(description, {
      x: col2X + 10,
      y: dataRowY,
      size: 10,
      font,
      color: black,
    });

    // Unit Price (right-aligned)
    const unitPriceText = `${contract.unitPrice.toLocaleString()} ${currency}`;
    const unitPriceWidth = font.widthOfTextAtSize(unitPriceText, 10);
    page.drawText(unitPriceText, {
      x: col4X - unitPriceWidth - 5,
      y: dataRowY,
      size: 10,
      font,
      color: black,
    });

    // Total (right-aligned)
    const totalText = `${invoice.total.toLocaleString()} ${currency}`;
    const totalWidth = font.widthOfTextAtSize(totalText, 10);
    page.drawText(totalText, {
      x: tableRight - totalWidth - 5,
      y: dataRowY,
      size: 10,
      font,
      color: black,
    });
  }

  // ============================================
  // AMOUNT DUE BOX (below table, right side)
  // ============================================
  const amountDueY = tableBottom - 25;
  const amountBoxWidth = col3Width + col4Width;
  const amountBoxX = col3X;
  
  // Draw amount due box
  page.drawRectangle({
    x: amountBoxX,
    y: amountDueY - 5,
    width: amountBoxWidth,
    height: 22,
    borderColor: black,
    borderWidth: 0.5,
  });
  
  // Vertical divider in amount box
  page.drawLine({
    start: { x: col4X, y: amountDueY + 17 },
    end: { x: col4X, y: amountDueY - 5 },
    thickness: 0.5,
    color: black,
  });

  // Amount Due label
  page.drawText('AMOUNT DUE', {
    x: amountBoxX + 10,
    y: amountDueY + 2,
    size: 9,
    font: boldFont,
    color: black,
  });

  // Amount Due value
  const amountDueValueText = `${invoice.total.toLocaleString()} ${currency}`;
  const amountDueValueWidth = boldFont.widthOfTextAtSize(amountDueValueText, 9);
  page.drawText(amountDueValueText, {
    x: tableRight - amountDueValueWidth - 5,
    y: amountDueY + 2,
    size: 9,
    font: boldFont,
    color: black,
  });

  // ============================================
  // CURRENCY NOTE
  // ============================================
  y = amountDueY - 30;
  const currencyFullName = currency === 'JPY' ? 'Japanese Yen (JPY)' : currency;
  page.drawText(`All amounts in ${currencyFullName}`, {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: black,
  });

  // ============================================
  // REMITTANCE ADVICE SECTION
  // ============================================
  y -= 35;
  
  // Underlined header
  page.drawText('REMITTANCE ADVICE:', {
    x: MARGIN,
    y,
    size: 10,
    font: boldFont,
    color: black,
  });
  const remittanceHeaderWidth = boldFont.widthOfTextAtSize('REMITTANCE ADVICE:', 10);
  page.drawLine({
    start: { x: MARGIN, y: y - 2 },
    end: { x: MARGIN + remittanceHeaderWidth, y: y - 2 },
    thickness: 0.5,
    color: black,
  });

  y -= 20;
  page.drawText('Direct Deposit', {
    x: MARGIN,
    y,
    size: 9,
    font: boldFont,
    color: black,
  });

  // Bank details with label:value format
  const labelX = MARGIN;
  const valueX = MARGIN + 90;
  const lineSpacing = 16;

  y -= lineSpacing;
  if (settings.bankName) {
    page.drawText('Bank Name', { x: labelX, y, size: 9, font, color: black });
    page.drawText(`: ${settings.bankName}`, { x: valueX, y, size: 9, font, color: black });
  }

  y -= lineSpacing;
  if (settings.accountHolder) {
    page.drawText('Account Holder', { x: labelX, y, size: 9, font, color: black });
    page.drawText(`: ${settings.accountHolder}`, { x: valueX, y, size: 9, font, color: black });
  }

  y -= lineSpacing;
  if (settings.accountNumber) {
    page.drawText('Account Number', { x: labelX, y, size: 9, font, color: black });
    page.drawText(`: ${settings.accountNumber}`, { x: valueX, y, size: 9, font, color: black });
  }

  y -= lineSpacing;
  if (settings.swift) {
    page.drawText('SWIFT', { x: labelX, y, size: 9, font, color: black });
    page.drawText(`: ${settings.swift}`, { x: valueX, y, size: 9, font, color: black });
  }

  y -= lineSpacing;
  if (settings.bankCountry) {
    page.drawText('Bank Country', { x: labelX, y, size: 9, font, color: black });
    page.drawText(`: ${settings.bankCountry}`, { x: valueX, y, size: 9, font, color: black });
  }

  y -= lineSpacing;
  // Bank Currency (from settings)
  const bankCurrency = settings.bankCurrency || currency; // Fallback to contract currency if not set
  page.drawText('Bank Currency', { x: labelX, y, size: 9, font, color: black });
  page.drawText(`: ${bankCurrency}`, { x: valueX, y, size: 9, font, color: black });

  // ============================================
  // PAYMENT TERMS
  // ============================================
  y -= 25;
  let paymentTerms = '';
  if (contract) {
    const dueDateMethod = contract.dueDateMethod || 'days';
    if (dueDateMethod === 'endOfNextMonth') {
      // Invoice date is last day of previous month, due date is last day of invoice month
      paymentTerms = 'Payment is due by the end of the invoice month.';
    } else {
      const dueDays = contract.dueDays || 30;
      paymentTerms = `Payment is due within ${dueDays} days from the invoice date.`;
    }
  } else {
    paymentTerms = 'Payment is due within 30 days from the invoice date.';
  }
  page.drawText(paymentTerms, {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: black,
  });

  y -= 16;
  if (settings.email) {
    page.drawText(`If you have any questions concerning this invoice, contact ${settings.email}`, {
      x: MARGIN,
      y,
      size: 9,
      font,
      color: black,
    });
  }

  // ============================================
  // FOOTER: Thank You Message
  // ============================================
  const footerY = 60;
  
  // Horizontal line
  page.drawLine({
    start: { x: MARGIN, y: footerY + 20 },
    end: { x: A4_WIDTH - MARGIN, y: footerY + 20 },
    thickness: 0.5,
    color: lightGray,
  });

  // Thank you message (centered)
  const thankYouText = 'THANK YOU FOR YOUR BUSINESS!';
  const thankYouWidth = boldFont.widthOfTextAtSize(thankYouText, 10);
  page.drawText(thankYouText, {
    x: (A4_WIDTH - thankYouWidth) / 2,
    y: footerY,
    size: 10,
    font: boldFont,
    color: black,
  });

  const pdfBytes = await doc.save();
  const filename = formatFilename(settings.filenameTemplate, invoice, client, settings);

  return { pdfBytes, filename };
}
