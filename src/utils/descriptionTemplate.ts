const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function previewDescriptionTemplate(
  template: string,
  referenceDate: Date = new Date(),
): string {
  const monthName = referenceDate.toLocaleString('default', { month: 'long' });
  const year = referenceDate.getFullYear();

  return template
    .replace(/\{\{month\}\}/g, monthName)
    .replace(/\{\{year\}\}/g, String(year));
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getDueDateMethodHint(
  method: 'days' | 'endOfNextMonth',
  dueDays = 30,
  referenceDate: Date = new Date(),
): string {
  if (method === 'endOfNextMonth') {
    const issueDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 15);
    const dueDate = new Date(issueDate.getFullYear(), issueDate.getMonth() + 2, 0);
    const issueMonth = MONTH_NAMES[issueDate.getMonth()];

    return `Due on the last day of the month after the invoice issue month. Example: ${issueMonth} invoice → due ${formatShortDate(dueDate)}.`;
  }

  const issueDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 15);
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + dueDays);

  return `Due ${dueDays} day${dueDays === 1 ? '' : 's'} after the invoice issue date. Example: issued ${formatShortDate(issueDate)} → due ${formatShortDate(dueDate)}.`;
}

export function normalizeQuantity(quantity: number): number {
  return quantity > 0 ? quantity : 1;
}

export function getQuantityHint(unitPrice: number, quantity: number, currency: string): string {
  const effectiveQuantity = normalizeQuantity(quantity);

  if (unitPrice > 0) {
    const total = unitPrice * effectiveQuantity;
    return `Optional — defaults to 1 if empty. Example: ${unitPrice.toLocaleString()} ${currency} × ${effectiveQuantity} = ${total.toLocaleString()} ${currency} per invoice.`;
  }

  return 'Optional — defaults to 1 if empty. Invoice total = unit price × quantity.';
}
