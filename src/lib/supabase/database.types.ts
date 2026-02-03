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

export type WorkplanStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'delayed';

export type ActivityStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'delayed'
  | 'cancelled';

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
      workplans: {
        Row: {
          id: string;
          financial_year_id: string;
          agency_id: string;
          title: string;
          description: string | null;
          total_budget: number;
          status: WorkplanStatus;
          submitted_by: string | null;
          submitted_at: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          financial_year_id: string;
          agency_id: string;
          title: string;
          description?: string | null;
          total_budget?: number;
          status?: WorkplanStatus;
          submitted_by?: string | null;
          submitted_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          financial_year_id?: string;
          agency_id?: string;
          title?: string;
          description?: string | null;
          total_budget?: number;
          status?: WorkplanStatus;
          submitted_by?: string | null;
          submitted_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          updated_at?: string;
        };
      };
      workplan_activities: {
        Row: {
          id: string;
          workplan_id: string;
          project_id: string | null;
          activity_code: string;
          activity_name: string;
          description: string | null;
          responsible_unit: string;
          responsible_officer: string | null;
          start_date: string;
          end_date: string;
          q1_target: number;
          q2_target: number;
          q3_target: number;
          q4_target: number;
          q1_actual: number;
          q2_actual: number;
          q3_actual: number;
          q4_actual: number;
          q1_budget: number;
          q2_budget: number;
          q3_budget: number;
          q4_budget: number;
          total_budget: number;
          key_performance_indicator: string;
          expected_output: string;
          status: ActivityStatus;
          progress_percent: number;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workplan_id: string;
          project_id?: string | null;
          activity_code: string;
          activity_name: string;
          description?: string | null;
          responsible_unit: string;
          responsible_officer?: string | null;
          start_date: string;
          end_date: string;
          q1_target?: number;
          q2_target?: number;
          q3_target?: number;
          q4_target?: number;
          q1_actual?: number;
          q2_actual?: number;
          q3_actual?: number;
          q4_actual?: number;
          q1_budget?: number;
          q2_budget?: number;
          q3_budget?: number;
          q4_budget?: number;
          total_budget?: number;
          key_performance_indicator: string;
          expected_output: string;
          status?: ActivityStatus;
          progress_percent?: number;
          remarks?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workplan_id?: string;
          project_id?: string | null;
          activity_code?: string;
          activity_name?: string;
          description?: string | null;
          responsible_unit?: string;
          responsible_officer?: string | null;
          start_date?: string;
          end_date?: string;
          q1_target?: number;
          q2_target?: number;
          q3_target?: number;
          q4_target?: number;
          q1_actual?: number;
          q2_actual?: number;
          q3_actual?: number;
          q4_actual?: number;
          q1_budget?: number;
          q2_budget?: number;
          q3_budget?: number;
          q4_budget?: number;
          total_budget?: number;
          key_performance_indicator?: string;
          expected_output?: string;
          status?: ActivityStatus;
          progress_percent?: number;
          remarks?: string | null;
          updated_at?: string;
        };
      };
      workplan_workflow_actions: {
        Row: {
          id: string;
          workplan_id: string;
          action_type: string;
          from_status: WorkplanStatus | null;
          to_status: WorkplanStatus;
          action_by: string;
          action_date: string;
          comments: string | null;
        };
        Insert: {
          id?: string;
          workplan_id: string;
          action_type: string;
          from_status?: WorkplanStatus | null;
          to_status: WorkplanStatus;
          action_by: string;
          action_date?: string;
          comments?: string | null;
        };
        Update: {
          workplan_id?: string;
          action_type?: string;
          from_status?: WorkplanStatus | null;
          to_status?: WorkplanStatus;
          action_by?: string;
          action_date?: string;
          comments?: string | null;
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
      workplan_status: WorkplanStatus;
      activity_status: ActivityStatus;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
