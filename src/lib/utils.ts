export const VAT_RATE = 0.075; // 7.5%

export const formatCurrency = (amount: number, currency: string = 'NGN') => {
    const locales: Record<string, string> = {
        NGN: 'en-NG',
        USD: 'en-US',
        EUR: 'de-DE',
        GBP: 'en-GB',
    };

    return new Intl.NumberFormat(locales[currency] || 'en-NG', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

export const formatStock = (total: number, packagingUnit?: string, unitsPerPackage?: number, baseUnit: string = 'Piece') => {
    if (!packagingUnit || !unitsPerPackage || unitsPerPackage <= 1) {
        return `${total} ${baseUnit}${total !== 1 ? 's' : ''}`;
    }

    const packages = Math.floor(total / unitsPerPackage);
    const remnants = total % unitsPerPackage;

    if (packages === 0) {
        return `${total} ${baseUnit}${total !== 1 ? 's' : ''}`;
    }

    return `${total} ${baseUnit}${total !== 1 ? 's' : ''} (${packages} ${packagingUnit}${packages !== 1 ? 's' : ''}${remnants > 0 ? ` + ${remnants} ${baseUnit}${remnants !== 1 ? 's' : ''}` : ''})`;
};

export function daysUntilDue(dueDate: string | Date): number {
    const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(dueDate: string | Date): boolean {
    return daysUntilDue(dueDate) < 0;
}

export function generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INV-${year}${month}-${random}`;
}

export function hashClientId(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}
export function downloadCSV(data: any[], filename: string) {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const val = row[header] ?? '';
            return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
