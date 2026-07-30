/** Format a number to Indonesian Rupiah */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format date to Indonesian locale */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/** Format time to HH:mm */
export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/** Format full date + time */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Generate a human-readable short ID from UUID */
export function shortId(uuid: string): string {
  return uuid.slice(0, 8).toUpperCase();
}

/** Get initials from a name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Delay utility */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Payment method label */
export function paymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Cash',
    qris: 'QRIS',
    kartu: 'Kartu Debit/Kredit',
  };
  return labels[method] || method;
}

/** Order type label */
export function orderTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    dine_in: 'Dine In',
    take_away: 'Take Away',
  };
  return labels[type] || type;
}
