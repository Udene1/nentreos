// Merged application types for Naija Startup OS

import { Database } from './database.types';

// Core Row Types
export type User = Database['public']['Tables']['users']['Row'];
export type AppSettings = Database['public']['Tables']['app_settings']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type Sale = Database['public']['Tables']['sales']['Row'];
export type Purchase = Database['public']['Tables']['purchases']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type Reminder = Database['public']['Tables']['reminders']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

// Insert Types
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type ItemInsert = Database['public']['Tables']['items']['Insert'];
export type SaleInsert = Database['public']['Tables']['sales']['Insert'];
export type PurchaseInsert = Database['public']['Tables']['purchases']['Insert'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
export type ReminderInsert = Database['public']['Tables']['reminders']['Insert'];

// Update Types
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type ItemUpdate = Database['public']['Tables']['items']['Update'];
export type SaleUpdate = Database['public']['Tables']['sales']['Update'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];

// Enums & Literals
export type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid' | 'cancelled';
export type ReminderType = 'email' | 'sms' | 'whatsapp';
export type EscalationLevel = 1 | 2 | 3;
export type Currency = 'NGN' | 'USD' | 'EUR' | 'GBP';
export type SubscriptionType = 'free' | 'monthly' | 'early-bird' | 'lifetime';

// Complex Interfaces
export interface ClientHistoryNote {
    date: string;
    type: 'payment' | 'reminder' | 'note';
    message: string;
    invoiceId?: string;
    daysLate?: number;
}

export interface AIReminderResponse {
    subject: string;
    message: string;
    tone: 'polite' | 'firm' | 'urgent';
    suggestedAction?: string;
}

export interface InvoiceWithClient extends Invoice {
    client: Client | null;
    reminders?: Reminder[];
}

export interface DashboardStats {
    totalSales: number;
    totalRevenue: number;
    inventoryValue: number;
    lowStockCount: number;
    outstandingReceivables: number;
    overdueInvoices: number;
    vatLiability: number;
}

export interface SaleFormData {
    itemId: string;
    quantity: number;
    unitType: 'base' | 'package';
    customerName?: string;
    generateInvoice?: boolean;
}

export interface InvoiceFormData {
    clientId?: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    amount: number;
    currency: Currency;
    dueDate: string;
    description?: string;
    createNewClient?: boolean;
}

export interface UserSettings {
    businessName?: string;
    tin?: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
    aiProvider?: string;
    groqApiKey?: string;
    openaiApiKey?: string;
    geminiApiKey?: string;
    xaiApiKey?: string;
    paymentLink?: string;
    replyToEmail?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioPhoneNumber?: string;
}
