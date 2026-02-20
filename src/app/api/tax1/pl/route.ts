import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generatePLStatement } from '@/lib/tax-server-utils';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    try {
        const pl = await generatePLStatement(user.id, startDate, endDate);
        return NextResponse.json(pl);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
