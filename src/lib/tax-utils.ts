import { VAT_RATE } from './utils';

export interface PLStatement {
    revenue: number;
    cogs: number;
    grossProfit: number;
    operatingExpenses: {
        payroll: number;
        general: number;
        depreciation: number;
    };
    totalExpenses: number;
    netProfit: number;
    taxLiability: {
        vat: number;
        paye: number;
        estimatedCIT: number;
    };
}

/**
 * Calculates Nigerian PAYE tax based on current FIRS rates (simplified)
 * 7% for first ₦300k, 11% for next ₦300k, etc.
 */
export const calculateNigerianPAYE = (grossMonthly: number): number => {
    // Simplified Nigerian PIT calculation for SMEs
    if (grossMonthly <= 30000) return 0; // Minimum wage / basic relief

    let taxable = grossMonthly - 30000;
    let tax = 0;

    // Rates: 7%, 11%, 15%, 19%, 21%, 24%
    const brackets = [
        { limit: 25000, rate: 0.07 },
        { limit: 25000, rate: 0.11 },
        { limit: 41666, rate: 0.15 },
        { limit: 41666, rate: 0.19 },
        { limit: 133333, rate: 0.21 },
        { limit: Infinity, rate: 0.24 },
    ];

    for (const bracket of brackets) {
        const amount = Math.min(taxable, bracket.limit);
        tax += amount * bracket.rate;
        taxable -= amount;
        if (taxable <= 0) break;
    }

    return tax;
};

/**
 * Logic for calculating straight-line depreciation
 */
export const calculateDepreciation = (cost: number, rate: number, acquisitionDate: string): number => {
    const start = new Date(acquisitionDate);
    const now = new Date();
    const monthsOwned = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

    if (monthsOwned <= 0) return 0;

    const annualDepreciation = cost * (rate / 100);
    const monthlyDepreciation = annualDepreciation / 12;

    return monthlyDepreciation * monthsOwned;
};


