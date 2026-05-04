export type DocumentType = "invoice" | "budget";

export type InvoiceStatus = "draft" | "pending" | "paid" | "cancelled";

export const invoiceStatuses: Array<{ value: InvoiceStatus; label: string }> = [
  { value: "draft", label: "Borrador" },
  { value: "pending", label: "Pendiente" },
  { value: "paid", label: "Pagada" },
  { value: "cancelled", label: "Cancelada" },
];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          role: ProfileRole;
          plan: ProfilePlan;
          is_super_admin: boolean;
          has_lifetime_access: boolean;
          onboarding_completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          role?: ProfileRole;
          plan?: ProfilePlan;
          is_super_admin?: boolean;
          has_lifetime_access?: boolean;
          onboarding_completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string | null;
          role?: ProfileRole;
          plan?: ProfilePlan;
          is_super_admin?: boolean;
          has_lifetime_access?: boolean;
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
    };
    Views: Record<string, never>;
    Functions: {
      is_super_admin: {
        Args: Record<string, never>;
        Returns: boolean;
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
  invoice_footer: string | null;
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

export type InvoiceWithCommunity = Invoice & {
  communities: Pick<Community, "id" | "name" | "tax_id" | "city"> | null;
};
