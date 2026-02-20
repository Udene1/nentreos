import { VAT_RATE } from './utils';
import { createClient } from './supabase-server';

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

/**
 * Aggregates all financial data for a P&L statement
 */
export const generatePLStatement = async (userId: string, startDate: string, endDate: string): Promise<PLStatement> => {
    const supabase = await createClient();

    // 1. Fetch Sales (Revenue & COGS)
    const { data: sales } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', userId)
        .gte('sale_date', startDate)
        .lte('sale_date', endDate);

    const revenue = (sales || []).reduce((sum, s) => sum + Number(s.total_amount), 0);
    const cogs = (sales || []).reduce((sum, s) => sum + (Number(s.cost_at_sale || 0) * Number(s.quantity_sold)), 0);

    // 2. Fetch Business Expenses
    const { data: expenses } = await supabase
        .from('business_expenses')
        .select('*')
        .eq('user_id', userId)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

    const generalExpenses = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);

    // 3. Fetch Payroll
    const { data: payroll } = await supabase
        .from('payroll')
        .select('*')
        .eq('user_id', userId)
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

    const payrollTotal = (payroll || []).reduce((sum, p) => sum + Number(p.gross_salary), 0);
    const payeTotal = (payroll || []).reduce((sum, p) => sum + Number(p.paye_tax || 0), 0);

    // 4. Fetch Assets
    const { data: assets } = await supabase
        .from('fixed_assets')
        .select('*')
        .eq('user_id', userId);

    const depreciationTotal = (assets || []).reduce((sum, a) => {
        return sum + calculateDepreciation(a.cost, a.depreciation_rate, a.acquisition_date);
    }, 0);

    const grossProfit = revenue - cogs;
    const totalExpenses = payrollTotal + generalExpenses + depreciationTotal;
    const netProfit = grossProfit - totalExpenses;

    const vatRateDecimal = (VAT_RATE / 100);

    return {
        revenue,
        cogs,
        grossProfit,
        operatingExpenses: {
            payroll: payrollTotal,
            general: generalExpenses,
            depreciation: depreciationTotal,
        },
        totalExpenses,
        netProfit,
        taxLiability: {
            vat: (revenue * vatRateDecimal) / (1 + vatRateDecimal),
            paye: payeTotal,
            estimatedCIT: Math.max(netProfit * 0.3, 0),
        },
    };
};
