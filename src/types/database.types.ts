export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            items: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    quantity: number
                    price: number
                    category: string | null
                    user_id: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    quantity?: number
                    price?: number
                    category?: string | null
                    user_id: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    quantity?: number
                    price?: number
                    category?: string | null
                    user_id?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            purchases: {
                Row: {
                    id: string
                    item_id: string
                    quantity_purchased: number
                    cost: number
                    purchase_date: string
                    supplier_name: string | null
                    user_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    item_id: string
                    quantity_purchased: number
                    cost: number
                    purchase_date?: string
                    supplier_name?: string | null
                    user_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    item_id?: string
                    quantity_purchased?: number
                    cost?: number
                    purchase_date?: string
                    supplier_name?: string | null
                    user_id?: string
                    created_at?: string
                }
            }
            sales: {
                Row: {
                    id: string
                    item_id: string
                    quantity_sold: number
                    total_amount: number
                    sale_date: string
                    customer_name: string | null
                    invoice_id: string
                    user_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    item_id: string
                    quantity_sold: number
                    total_amount: number
                    sale_date?: string
                    customer_name?: string | null
                    invoice_id?: string
                    user_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    item_id?: string
                    quantity_sold?: number
                    total_amount?: number
                    sale_date?: string
                    customer_name?: string | null
                    invoice_id?: string
                    user_id?: string
                    created_at?: string
                }
            }
            audit_logs: {
                Row: {
                    id: string
                    action: string
                    table_name: string
                    record_id: string
                    changed_by: string | null
                    changes: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    action: string
                    table_name: string
                    record_id: string
                    changed_by?: string | null
                    changes?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    action?: string
                    table_name?: string
                    record_id?: string
                    changed_by?: string | null
                    changes?: Json | null
                    created_at?: string
                }
            }
            users: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    subscription_type: string
                    subscription_status: string
                    stripe_customer_id: string | null
                    paystack_customer_code: string | null
                    paystack_subscription_code: string | null
                    default_currency: string
                    settings: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    subscription_type?: string
                    subscription_status?: string
                    stripe_customer_id?: string | null
                    paystack_customer_code?: string | null
                    paystack_subscription_code?: string | null
                    default_currency?: string
                    settings?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    subscription_type?: string
                    subscription_status?: string
                    stripe_customer_id?: string | null
                    paystack_customer_code?: string | null
                    paystack_subscription_code?: string | null
                    default_currency?: string
                    settings?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            clients: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    email: string
                    phone: string | null
                    whatsapp_enabled: boolean
                    history_notes: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    email: string
                    phone?: string | null
                    whatsapp_enabled?: boolean
                    history_notes?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    email?: string
                    phone?: string | null
                    whatsapp_enabled?: boolean
                    history_notes?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            invoices: {
                Row: {
                    id: string
                    user_id: string
                    client_id: string | null
                    invoice_number: string
                    amount: number
                    currency: string
                    due_date: string
                    description: string | null
                    status: string
                    pdf_url: string | null
                    stripe_payment_intent_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    client_id?: string | null
                    invoice_number: string
                    amount: number
                    currency?: string
                    due_date: string
                    description?: string | null
                    status?: string
                    pdf_url?: string | null
                    stripe_payment_intent_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    client_id?: string | null
                    invoice_number?: string
                    amount?: number
                    currency?: string
                    due_date?: string
                    description?: string | null
                    status?: string
                    pdf_url?: string | null
                    stripe_payment_intent_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            reminders: {
                Row: {
                    id: string
                    invoice_id: string
                    type: string | null
                    escalation_level: number
                    scheduled_date: string | null
                    sent_date: string | null
                    status: string
                    ai_message: string | null
                    error_message: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    invoice_id: string
                    type?: string | null
                    escalation_level?: number
                    scheduled_date?: string | null
                    sent_date?: string | null
                    status?: string
                    ai_message?: string | null
                    error_message?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    invoice_id?: string
                    type?: string | null
                    escalation_level?: number
                    scheduled_date?: string | null
                    sent_date?: string | null
                    status?: string
                    ai_message?: string | null
                    error_message?: string | null
                    created_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    message: string
                    type: string
                    is_read: boolean
                    link: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    message: string
                    type?: string
                    is_read?: boolean
                    link?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    message?: string
                    type?: string
                    is_read?: boolean
                    link?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            app_settings: {
                Row: {
                    user_id: string
                    valuation_method: string
                    tax_rate: number
                    company_name: string | null
                    company_address: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    valuation_method?: string
                    tax_rate?: number
                    company_name?: string | null
                    company_address?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    user_id?: string
                    valuation_method?: string
                    tax_rate?: number
                    company_name?: string | null
                    company_address?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
