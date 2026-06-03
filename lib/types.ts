export type DocumentType = "invoice" | "budget";

export type InvoiceStatus = "draft" | "issued" | "cancelled" | "corrective";
export type FiscalStatus = "not_generated" | "generated_internal" | "pending_aeat" | "accepted" | "rejected" | "error";
export type FiscalRecordType = "alta" | "anulacion";
export type FiscalRecordMode = "internal_pending_verifactu" | "verifactu" | "no_verifactu";
export type AeatStatus = "not_submitted" | "pending" | "accepted" | "rejected" | "error";
export type ExpenseDocumentStatus = "pending" | "paid" | "archived";

export const invoiceStatuses: Array<{ value: InvoiceStatus; label: string }> = [
  { value: "draft", label: "Borrador" },
  { value: "issued", label: "Emitida" },
  { value: "cancelled", label: "Anulada" },
  { value: "corrective", label: "Rectificativa" },
];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: ProfileRole;
          plan: ProfilePlan;
          is_super_admin: boolean;
          has_lifetime_access: boolean;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string | null;
          subscription_current_period_end: string | null;
          onboarding_completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: ProfileRole;
          plan?: ProfilePlan;
          is_super_admin?: boolean;
          has_lifetime_access?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
          subscription_current_period_end?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          role?: ProfileRole;
          plan?: ProfilePlan;
          is_super_admin?: boolean;
          has_lifetime_access?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
          subscription_current_period_end?: string | null;
          onboarding_completed_at?: string | null;
        };
        Relationships: [];
      };
      company_settings: {
        Row: CompanySettings;
        Insert: Partial<CompanySettings> & { owner_id: string };
        Update: Partial<Omit<CompanySettings, "id" | "owner_id" | "created_at">>;
        Relationships: [];
      };
      communities: {
        Row: Community;
        Insert: Partial<Community> & { owner_id: string; name: string };
        Update: Partial<Omit<Community, "id" | "owner_id" | "created_at">>;
        Relationships: [];
      };
      invoices: {
        Row: Invoice;
        Insert: Partial<Invoice> & {
          owner_id: string;
          community_id: string;
          document_type?: DocumentType;
          invoice_number: string;
          invoice_date: string;
          month: number;
          year: number;
          subject: string;
        };
        Update: Partial<Omit<Invoice, "id" | "owner_id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "invoices_community_id_fkey";
            columns: ["community_id"];
            isOneToOne: false;
            referencedRelation: "communities";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_plans: {
        Row: RecurringPlan;
        Insert: Partial<RecurringPlan> & {
          owner_id: string;
          community_id: string;
          name: string;
          concept: string;
          base_amount: number;
        };
        Update: Partial<Omit<RecurringPlan, "id" | "owner_id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "recurring_plans_community_id_fkey";
            columns: ["community_id"];
            isOneToOne: false;
            referencedRelation: "communities";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_documents: {
        Row: ExpenseDocument;
        Insert: Partial<ExpenseDocument> & {
          owner_id: string;
          supplier_name: string;
          issue_date: string;
          total_amount: number;
          file_url: string;
        };
        Update: Partial<Omit<ExpenseDocument, "id" | "owner_id" | "created_at">>;
        Relationships: [];
      };
      invoice_items: {
        Row: InvoiceItem;
        Insert: Partial<InvoiceItem> & {
          owner_id: string;
          invoice_id: string;
          description: string;
        };
        Update: Partial<Omit<InvoiceItem, "id" | "owner_id" | "invoice_id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: Subscription;
        Insert: Partial<Subscription> & {
          owner_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          status: string;
        };
        Update: Partial<Omit<Subscription, "id" | "owner_id" | "created_at">>;
        Relationships: [];
      };
      fiscal_records: {
        Row: FiscalRecord;
        Insert: Partial<FiscalRecord> & {
          owner_id: string;
          invoice_id: string;
          record_type: FiscalRecordType;
          record_payload: unknown;
          chain_sequence: number;
        };
        Update: Partial<Omit<FiscalRecord, "id" | "owner_id" | "invoice_id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "fiscal_records_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog> & {
          owner_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
        };
        Update: Partial<Omit<AuditLog, "id" | "owner_id" | "created_at">>;
        Relationships: [];
      };
      billing_events: {
        Row: BillingEvent;
        Insert: Partial<BillingEvent> & {
          event_id: string;
          type: string;
          payload: unknown;
        };
        Update: Partial<Omit<BillingEvent, "id" | "event_id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_super_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      issue_invoice: {
        Args: { p_invoice_id: string };
        Returns: Invoice;
      };
      cancel_invoice: {
        Args: { p_invoice_id: string; p_reason: string };
        Returns: Invoice;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ProfileRole = "user" | "admin" | "super_admin";

export type ProfilePlan = "starter" | "pro" | "premium" | "enterprise";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type CompanySettings = {
  id: string;
  owner_id: string;
  fiscal_name: string | null;
  tax_id: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  province: string | null;
  email: string | null;
  phone: string | null;
  iban: string | null;
  logo_url: string | null;
  invoice_footer: string | null;
  default_invoice_series: string;
  next_invoice_number: number;
  created_at: string;
  updated_at: string;
};

export type Community = {
  id: string;
  owner_id: string;
  name: string;
  tax_id: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  province: string | null;
  email: string | null;
  phone: string | null;
  default_subject: string | null;
  default_vat: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  owner_id: string;
  community_id: string;
  recurring_plan_id: string | null;
  document_type: DocumentType;
  community_name: string | null;
  community_tax_id: string | null;
  community_address: string | null;
  community_postal_code: string | null;
  community_city: string | null;
  community_province: string | null;
  community_email: string | null;
  community_phone: string | null;
  invoice_number: string;
  invoice_date: string;
  month: number;
  year: number;
  subject: string;
  amount: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  status: InvoiceStatus;
  issued_at: string | null;
  cancelled_at: string | null;
  corrected_invoice_id: string | null;
  invoice_series: string | null;
  sequential_number: number | null;
  fiscal_record_id: string | null;
  fiscal_status: FiscalStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceItem = {
  id: string;
  owner_id: string;
  invoice_id: string;
  description: string;
  amount: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  sort_order: number;
  created_at: string;
};

export type RecurringPlan = {
  id: string;
  owner_id: string;
  community_id: string;
  name: string;
  concept: string;
  base_amount: number;
  tax_rate: number;
  frequency: "monthly";
  billing_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ExpenseDocument = {
  id: string;
  owner_id: string;
  supplier_name: string;
  invoice_number: string | null;
  issue_date: string;
  total_amount: number;
  tax_amount: number | null;
  category: string | null;
  file_url: string;
  status: ExpenseDocumentStatus;
  created_at: string;
};

export type Subscription = {
  id: string;
  owner_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string | null;
  plan: Exclude<ProfilePlan, "starter">;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

export type FiscalRecord = {
  id: string;
  owner_id: string;
  invoice_id: string;
  record_type: FiscalRecordType;
  mode: FiscalRecordMode;
  record_version: string;
  record_payload: unknown;
  record_xml: string | null;
  hash: string | null;
  previous_record_id: string | null;
  previous_hash: string | null;
  chain_sequence: number;
  generated_at: string;
  submitted_at: string | null;
  aeat_status: AeatStatus;
  aeat_response: unknown | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  owner_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  metadata: unknown | null;
  created_at: string;
};

export type BillingEvent = {
  id: string;
  event_id: string;
  type: string;
  payload: unknown;
  processed_at: string | null;
  processing_error: string | null;
  created_at: string;
};

export type InvoiceWithCommunity = Invoice & {
  communities: Pick<Community, "id" | "name" | "tax_id" | "city"> | null;
};
