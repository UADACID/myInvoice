import { rgb } from 'pdf-lib';
import type { PdfRenderContext } from './types';

const MARGIN = 50;

export async function renderProfessional(ctx: PdfRenderContext): Promise<void> {
  const { page, invoice, client, settings, fonts, dimensions } = ctx;
  const font = fonts.regular;
  const boldFont = fonts.bold;
  const { width: A4_WIDTH_DIM, height: A4_HEIGHT_DIM } = dimensions;

  const black = rgb(0, 0, 0);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const mediumGray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.65, 0.65, 0.65);

  let y = A4_HEIGHT_DIM - MARGIN;

  // TOP LEFT: Sender Information
  page.drawText(settings.freelancerName, {
    x: MARGIN,
    y,
    size: 11,
    font: boldFont,
    color: darkGray,
  });

  y -= 16;
  if (settings.address) {
    const addressLines = settings.address.split('\n').filter((line) => line.trim());
    for (const line of addressLines) {
      page.drawText(line, {
        x: MARGIN,
        y,
        size: 9,
        font,
        color: darkGray,
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
      color: rgb(0.1, 0.2, 0.5),
    });
  }

  // TOP RIGHT: Invoice Title - dark header bar style
  let rightY = A4_HEIGHT_DIM - MARGIN;
  const invoiceTitle = 'INVOICE';
  const titleWidth = boldFont.widthOfTextAtSize(invoiceTitle, 24);
  page.drawText(invoiceTitle, {
    x: A4_WIDTH_DIM - MARGIN - titleWidth,
    y: rightY,
    size: 24,
    font: boldFont,
    color: black,
  });

  rightY -= 28;
  page.drawText(ctx.invoiceNumText, {
    x: A4_WIDTH_DIM - MARGIN - font.widthOfTextAtSize(ctx.invoiceNumText, 9),
    y: rightY,
    size: 9,
    font,
    color: darkGray,
  });

  rightY -= 14;
  const invoiceDateText = `INVOICE DATE: ${invoice.issueDate}`;
  page.drawText(invoiceDateText, {
    x: A4_WIDTH_DIM - MARGIN - font.widthOfTextAtSize(invoiceDateText, 9),
    y: rightY,
    size: 9,
    font,
    color: darkGray,
  });

  rightY -= 14;
  const dueDateText = `DUE DATE: ${invoice.dueDate}`;
  page.drawText(dueDateText, {
    x: A4_WIDTH_DIM - MARGIN - font.widthOfTextAtSize(dueDateText, 9),
    y: rightY,
    size: 9,
    font,
    color: darkGray,
  });

  // MID-LEFT: Bill To Section
  y = A4_HEIGHT_DIM - 140;
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
    color: darkGray,
  });

  y -= 12;
  if (client.address) {
    const clientAddressLines = client.address.split('\n').filter((line) => line.trim());
    for (const line of clientAddressLines) {
      page.drawText(line, {
        x: MARGIN,
        y,
        size: 9,
        font,
        color: darkGray,
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
      color: rgb(0.1, 0.2, 0.5),
    });
  }

  // TABLE - formal, solid borders
  const tableTop = A4_HEIGHT_DIM - 280;
  const tableLeft = MARGIN;
  const tableRight = A4_WIDTH_DIM - MARGIN;
  const tableWidth = tableRight - tableLeft;
  const rowHeight = 22;
  const headerRowHeight = 26;
  const numDataRows = 7;
  const tableHeight = headerRowHeight + numDataRows * rowHeight;
  const tableBottom = tableTop - tableHeight;

  const col1Width = 80;
  const col4Width = 70;
  const col3Width = 80;
  const col2Width = tableWidth - col1Width - col3Width - col4Width;

  const col1X = tableLeft;
  const col2X = col1X + col1Width;
  const col3X = col2X + col2Width;
  const col4X = col3X + col3Width;

  // Header row background (darker bar)
  page.drawRectangle({
    x: tableLeft,
    y: tableBottom + tableHeight - headerRowHeight,
    width: tableWidth,
    height: headerRowHeight,
    color: rgb(0.95, 0.95, 0.95),
  });

  page.drawRectangle({
    x: tableLeft,
    y: tableBottom,
    width: tableWidth,
    height: tableHeight,
    borderColor: darkGray,
    borderWidth: 0.75,
  });

  [col2X, col3X, col4X].forEach((x) => {
    page.drawLine({
      start: { x, y: tableTop },
      end: { x, y: tableBottom },
      thickness: 0.5,
      color: mediumGray,
    });
  });

  const headerBottom = tableTop - headerRowHeight;
  page.drawLine({
    start: { x: tableLeft, y: headerBottom },
    end: { x: tableRight, y: headerBottom },
    thickness: 0.75,
    color: darkGray,
  });

  for (let i = 1; i < numDataRows; i++) {
    const rowY = headerBottom - i * rowHeight;
    page.drawLine({
      start: { x: tableLeft, y: rowY },
      end: { x: tableRight, y: rowY },
      thickness: 0.5,
      color: lightGray,
    });
  }

  const headerY = tableTop - 18;
  page.drawText('QUANTITY', { x: col1X + 10, y: headerY, size: 9, font: boldFont, color: black });
  page.drawText('DESCRIPTION', { x: col2X + 10, y: headerY, size: 9, font: boldFont, color: black });
  page.drawText('UNIT PRICE', { x: col3X + 5, y: headerY, size: 9, font: boldFont, color: black });
  page.drawText('TOTAL', { x: col4X + 15, y: headerY, size: 9, font: boldFont, color: black });

  const { contract, currency, itemsToRender, hasCustomItems } = ctx;

  if (hasCustomItems && itemsToRender.length > 0) {
    itemsToRender.forEach((item, index) => {
      if (index >= numDataRows) return;
      const dataRowY = headerBottom - 15 - index * rowHeight;

      const qtyText = String(item.quantity);
      const qtyWidth = font.widthOfTextAtSize(qtyText, 10);
      page.drawText(qtyText, {
        x: col1X + (col1Width - qtyWidth) / 2,
        y: dataRowY,
        size: 10,
        font,
        color: darkGray,
      });

      const maxDescWidth = col2Width - 20;
      let description = item.description;
      let descWidth = font.widthOfTextAtSize(description, 10);
      if (descWidth > maxDescWidth) {
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
        color: darkGray,
      });

      const itemTotal = item.quantity * item.unitPrice;
      const unitPriceText = `${item.unitPrice.toLocaleString()} ${currency}`;
      const unitPriceWidth = font.widthOfTextAtSize(unitPriceText, 10);
      page.drawText(unitPriceText, {
        x: col4X - unitPriceWidth - 5,
        y: dataRowY,
        size: 10,
        font,
        color: darkGray,
      });

      const totalText = `${itemTotal.toLocaleString()} ${currency}`;
      const totalWidth = font.widthOfTextAtSize(totalText, 10);
      page.drawText(totalText, {
        x: tableRight - totalWidth - 5,
        y: dataRowY,
        size: 10,
        font,
        color: darkGray,
      });
    });
  } else if (contract) {
    const dataRowY = headerBottom - 15;
    const invoiceDate = new Date(invoice.issueDate);
    const monthName = invoiceDate.toLocaleString('default', { month: 'long' });
    const year = invoiceDate.getFullYear();
    const description = contract.descriptionTemplate
      .replace(/\{\{month\}\}/g, monthName)
      .replace(/\{\{year\}\}/g, String(year));

    const qtyText = String(contract.quantity);
    const qtyWidth = font.widthOfTextAtSize(qtyText, 10);
    page.drawText(qtyText, {
      x: col1X + (col1Width - qtyWidth) / 2,
      y: dataRowY,
      size: 10,
      font,
      color: darkGray,
    });

    page.drawText(description, {
      x: col2X + 10,
      y: dataRowY,
      size: 10,
      font,
      color: darkGray,
    });

    const unitPriceText = `${contract.unitPrice.toLocaleString()} ${currency}`;
    const unitPriceWidth = font.widthOfTextAtSize(unitPriceText, 10);
    page.drawText(unitPriceText, {
      x: col4X - unitPriceWidth - 5,
      y: dataRowY,
      size: 10,
      font,
      color: darkGray,
    });

    const totalText = `${invoice.total.toLocaleString()} ${currency}`;
    const totalWidth = font.widthOfTextAtSize(totalText, 10);
    page.drawText(totalText, {
      x: tableRight - totalWidth - 5,
      y: dataRowY,
      size: 10,
      font,
      color: darkGray,
    });
  }

  // AMOUNT DUE BOX
  const amountDueY = tableBottom - 25;
  const amountBoxWidth = col3Width + col4Width;
  const amountBoxX = col3X;

  page.drawRectangle({
    x: amountBoxX,
    y: amountDueY - 5,
    width: amountBoxWidth,
    height: 22,
    borderColor: darkGray,
    borderWidth: 0.75,
  });

  page.drawLine({
    start: { x: col4X, y: amountDueY + 17 },
    end: { x: col4X, y: amountDueY - 5 },
    thickness: 0.5,
    color: darkGray,
  });

  page.drawText('AMOUNT DUE', {
    x: amountBoxX + 10,
    y: amountDueY + 2,
    size: 9,
    font: boldFont,
    color: black,
  });

  const amountDueValueText = `${invoice.total.toLocaleString()} ${currency}`;
  const amountDueValueWidth = boldFont.widthOfTextAtSize(amountDueValueText, 9);
  page.drawText(amountDueValueText, {
    x: tableRight - amountDueValueWidth - 5,
    y: amountDueY + 2,
    size: 9,
    font: boldFont,
    color: black,
  });

  // CURRENCY NOTE
  y = amountDueY - 30;
  const currencyFullName = currency === 'JPY' ? 'Japanese Yen (JPY)' : currency;
  page.drawText(`All amounts in ${currencyFullName}`, {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: darkGray,
  });

  // REMITTANCE ADVICE
  y -= 35;
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
    color: darkGray,
  });

  y -= 20;
  page.drawText('Direct Deposit', {
    x: MARGIN,
    y,
    size: 9,
    font: boldFont,
    color: black,
  });

  const labelX = MARGIN;
  const valueX = MARGIN + 90;
  const lineSpacing = 16;

  y -= lineSpacing;
  if (settings.bankName) {
    page.drawText('Bank Name', { x: labelX, y, size: 9, font, color: darkGray });
    page.drawText(`: ${settings.bankName}`, { x: valueX, y, size: 9, font, color: darkGray });
  }
  y -= lineSpacing;
  if (settings.accountHolder) {
    page.drawText('Account Holder', { x: labelX, y, size: 9, font, color: darkGray });
    page.drawText(`: ${settings.accountHolder}`, { x: valueX, y, size: 9, font, color: darkGray });
  }
  y -= lineSpacing;
  if (settings.accountNumber) {
    page.drawText('Account Number', { x: labelX, y, size: 9, font, color: darkGray });
    page.drawText(`: ${settings.accountNumber}`, { x: valueX, y, size: 9, font, color: darkGray });
  }
  y -= lineSpacing;
  if (settings.swift) {
    page.drawText('SWIFT', { x: labelX, y, size: 9, font, color: darkGray });
    page.drawText(`: ${settings.swift}`, { x: valueX, y, size: 9, font, color: darkGray });
  }
  y -= lineSpacing;
  if (settings.bankCountry) {
    page.drawText('Bank Country', { x: labelX, y, size: 9, font, color: darkGray });
    page.drawText(`: ${settings.bankCountry}`, { x: valueX, y, size: 9, font, color: darkGray });
  }
  y -= lineSpacing;
  const bankCurrency = settings.bankCurrency || currency;
  page.drawText('Bank Currency', { x: labelX, y, size: 9, font, color: darkGray });
  page.drawText(`: ${bankCurrency}`, { x: valueX, y, size: 9, font, color: darkGray });

  // PAYMENT TERMS
  y -= 25;
  page.drawText(ctx.paymentTerms, {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: darkGray,
  });

  y -= 16;
  if (settings.email) {
    page.drawText(`If you have any questions concerning this invoice, contact ${settings.email}`, {
      x: MARGIN,
      y,
      size: 9,
      font,
      color: darkGray,
    });
  }

  // FOOTER
  const footerY = 60;
  page.drawLine({
    start: { x: MARGIN, y: footerY + 20 },
    end: { x: A4_WIDTH_DIM - MARGIN, y: footerY + 20 },
    thickness: 0.5,
    color: lightGray,
  });

  const thankYouText = 'THANK YOU FOR YOUR BUSINESS!';
  const thankYouWidth = boldFont.widthOfTextAtSize(thankYouText, 10);
  page.drawText(thankYouText, {
    x: (A4_WIDTH_DIM - thankYouWidth) / 2,
    y: footerY,
    size: 10,
    font: boldFont,
    color: darkGray,
  });
}
