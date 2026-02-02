export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | 'agency_user'
  | 'agency_approver'
  | 'dnpm_reviewer'
  | 'dnpm_approver'
  | 'system_admin';

export type ProjectStatus =
  | 'draft'
  | 'submitted'
  | 'returned'
  | 'approved_by_agency'
  | 'under_dnpm_review'
  | 'approved_by_dnpm'
  | 'locked';

export type FinancialYearStatus = 'open' | 'closed';
export type AgencyStatus = 'active' | 'inactive';
export type WorkflowActionType =
  | 'submit'
  | 'return'
  | 'approve_agency'
  | 'approve_dnpm'
  | 'lock'
  | 'reopen';

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string;
          agency_name: string;
          agency_code: string | null;
          sector: string | null;
          contact_person: string;
          email: string;
          phone: string | null;
          status: AgencyStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_name: string;
          agency_code?: string | null;
          sector?: string | null;
          contact_person: string;
          email: string;
          phone?: string | null;
          status?: AgencyStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_name?: string;
          agency_code?: string | null;
          sector?: string | null;
          contact_person?: string;
          email?: string;
          phone?: string | null;
          status?: AgencyStatus;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          auth_id: string | null;
          email: string;
          name: string;
          role: UserRole;
          agency_id: string | null;
          phone: string | null;
          active: boolean;
          created_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          auth_id?: string | null;
          email: string;
          name: string;
          role: UserRole;
          agency_id?: string | null;
          phone?: string | null;
          active?: boolean;
          created_at?: string;
          last_login?: string | null;
        };
        Update: {
          auth_id?: string | null;
          email?: string;
          name?: string;
          role?: UserRole;
          agency_id?: string | null;
          phone?: string | null;
          active?: boolean;
          last_login?: string | null;
        };
      };
      financial_years: {
        Row: {
          id: string;
          year: number;
          status: FinancialYearStatus;
          submission_deadline: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          year: number;
          status?: FinancialYearStatus;
          submission_deadline: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          year?: number;
          status?: FinancialYearStatus;
          submission_deadline?: string;
          notes?: string | null;
        };
      };
      donor_codes: {
        Row: {
          id: string;
          code: number;
          donor_name: string;
          active: boolean;
        };
        Insert: {
          id?: string;
          code: number;
          donor_name: string;
          active?: boolean;
        };
        Update: {
          code?: number;
          donor_name?: string;
          active?: boolean;
        };
      };
      projects: {
        Row: {
          id: string;
          financial_year_id: string;
          agency_id: string;
          project_title: string;
          project_code: string | null;
          expenditure_vote_no: string | null;
          division: string | null;
          main_program: string | null;
          program: string | null;
          manager_name: string | null;
          objective: string | null;
          created_by: string;
          status: ProjectStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          financial_year_id: string;
          agency_id: string;
          project_title: string;
          project_code?: string | null;
          expenditure_vote_no?: string | null;
          division?: string | null;
          main_program?: string | null;
          program?: string | null;
          manager_name?: string | null;
          objective?: string | null;
          created_by: string;
          status?: ProjectStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          financial_year_id?: string;
          agency_id?: string;
          project_title?: string;
          project_code?: string | null;
          expenditure_vote_no?: string | null;
          division?: string | null;
          main_program?: string | null;
          program?: string | null;
          manager_name?: string | null;
          objective?: string | null;
          status?: ProjectStatus;
          updated_at?: string;
        };
      };
      budget_lines: {
        Row: {
          id: string;
          project_id: string;
          item_no: string;
          description_of_item: string;
          donor_code_id: string;
          original_budget: number;
          revised_budget: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          item_no: string;
          description_of_item: string;
          donor_code_id: string;
          original_budget?: number;
          revised_budget?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          item_no?: string;
          description_of_item?: string;
          donor_code_id?: string;
          original_budget?: number;
          revised_budget?: number;
          notes?: string | null;
          updated_at?: string;
        };
      };
      cashflow_monthly: {
        Row: {
          id: string;
          budget_line_id: string;
          jan: number;
          feb: number;
          mar: number;
          apr: number;
          may: number;
          jun: number;
          jul: number;
          aug: number;
          sep: number;
          oct: number;
          nov: number;
          dec: number;
        };
        Insert: {
          id?: string;
          budget_line_id: string;
          jan?: number;
          feb?: number;
          mar?: number;
          apr?: number;
          may?: number;
          jun?: number;
          jul?: number;
          aug?: number;
          sep?: number;
          oct?: number;
          nov?: number;
          dec?: number;
        };
        Update: {
          budget_line_id?: string;
          jan?: number;
          feb?: number;
          mar?: number;
          apr?: number;
          may?: number;
          jun?: number;
          jul?: number;
          aug?: number;
          sep?: number;
          oct?: number;
          nov?: number;
          dec?: number;
        };
      };
      workflow_actions: {
        Row: {
          id: string;
          project_id: string;
          action_type: WorkflowActionType;
          action_by_user: string;
          action_date: string;
          comments: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          action_type: WorkflowActionType;
          action_by_user: string;
          action_date?: string;
          comments?: string | null;
        };
        Update: {
          project_id?: string;
          action_type?: WorkflowActionType;
          action_by_user?: string;
          action_date?: string;
          comments?: string | null;
        };
      };
      attachments: {
        Row: {
          id: string;
          project_id: string;
          file_name: string;
          file_url: string;
          uploaded_by: string;
          uploaded_at: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          file_name: string;
          file_url: string;
          uploaded_by: string;
          uploaded_at?: string;
          description?: string | null;
        };
        Update: {
          project_id?: string;
          file_name?: string;
          file_url?: string;
          uploaded_by?: string;
          description?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          user_id: string;
          timestamp: string;
          old_value: Json | null;
          new_value: Json | null;
          field_name: string | null;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          action: string;
          user_id: string;
          timestamp?: string;
          old_value?: Json | null;
          new_value?: Json | null;
          field_name?: string | null;
        };
        Update: {
          entity_type?: string;
          entity_id?: string;
          action?: string;
          user_id?: string;
          timestamp?: string;
          old_value?: Json | null;
          new_value?: Json | null;
          field_name?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      project_status: ProjectStatus;
      financial_year_status: FinancialYearStatus;
      agency_status: AgencyStatus;
      workflow_action_type: WorkflowActionType;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
