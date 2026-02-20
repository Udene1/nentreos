import { createClient } from './supabase-server';
import { VAT_RATE } from './utils';
import { calculateDepreciation, type PLStatement } from './tax-utils';

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
