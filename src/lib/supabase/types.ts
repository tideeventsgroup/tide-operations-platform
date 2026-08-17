export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          event_id: string | null
          id: string
          organisation_id: string | null
          reason: string | null
          session_meta: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_id?: string | null
          id?: string
          organisation_id?: string | null
          reason?: string | null
          session_meta?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_id?: string | null
          id?: string
          organisation_id?: string | null
          reason?: string | null
          session_meta?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      characteristic_types: {
        Row: {
          code: string
          name: string
        }
        Insert: {
          code: string
          name: string
        }
        Update: {
          code?: string
          name?: string
        }
        Relationships: []
      }
      client_contact_roles: {
        Row: {
          contact_id: string
          role_code: string
        }
        Insert: {
          contact_id: string
          role_code: string
        }
        Update: {
          contact_id?: string
          role_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_contact_roles_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contact_roles_role_code_fkey"
            columns: ["role_code"]
            isOneToOne: false
            referencedRelation: "contact_role_types"
            referencedColumns: ["code"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          notes: string | null
          phone: string | null
          surname: string
          title: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          surname: string
          title?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          surname?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          account_owner_id: string | null
          address_line1: string | null
          address_line2: string | null
          archived_at: string | null
          billing_email: string | null
          billing_notes: string | null
          charity_number: string | null
          city: string | null
          company_number: string | null
          country: string | null
          created_at: string
          created_by: string | null
          id: string
          legal_name: string
          notes: string | null
          organisation_id: string
          postcode: string | null
          reference: string
          status: string
          trading_name: string | null
          website: string | null
        }
        Insert: {
          account_owner_id?: string | null
          address_line1?: string | null
          address_line2?: string | null
          archived_at?: string | null
          billing_email?: string | null
          billing_notes?: string | null
          charity_number?: string | null
          city?: string | null
          company_number?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name: string
          notes?: string | null
          organisation_id: string
          postcode?: string | null
          reference: string
          status?: string
          trading_name?: string | null
          website?: string | null
        }
        Update: {
          account_owner_id?: string | null
          address_line1?: string | null
          address_line2?: string | null
          archived_at?: string | null
          billing_email?: string | null
          billing_notes?: string | null
          charity_number?: string | null
          city?: string | null
          company_number?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string
          notes?: string | null
          organisation_id?: string
          postcode?: string | null
          reference?: string
          status?: string
          trading_name?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_account_owner_id_fkey"
            columns: ["account_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_role_types: {
        Row: {
          code: string
          name: string
        }
        Insert: {
          code: string
          name: string
        }
        Update: {
          code?: string
          name?: string
        }
        Relationships: []
      }
      event_characteristics: {
        Row: {
          characteristic_code: string
          event_id: string
        }
        Insert: {
          characteristic_code: string
          event_id: string
        }
        Update: {
          characteristic_code?: string
          event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_characteristics_characteristic_code_fkey"
            columns: ["characteristic_code"]
            isOneToOne: false
            referencedRelation: "characteristic_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "event_characteristics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_stage_history: {
        Row: {
          changed_by: string | null
          created_at: string
          event_id: string
          from_stage:
            | Database["public"]["Enums"]["event_lifecycle_stage"]
            | null
          id: string
          reason: string | null
          to_stage: Database["public"]["Enums"]["event_lifecycle_stage"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          event_id: string
          from_stage?:
            | Database["public"]["Enums"]["event_lifecycle_stage"]
            | null
          id?: string
          reason?: string | null
          to_stage: Database["public"]["Enums"]["event_lifecycle_stage"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          event_id?: string
          from_stage?:
            | Database["public"]["Enums"]["event_lifecycle_stage"]
            | null
          id?: string
          reason?: string | null
          to_stage?: Database["public"]["Enums"]["event_lifecycle_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "event_stage_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_stage_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actual_peak: number | null
          breakdown_at: string | null
          build_start_at: string | null
          category: string | null
          client_id: string
          closes_at: string | null
          contractor_count: number | null
          created_at: string
          created_by: string | null
          current_phase: Database["public"]["Enums"]["event_phase"] | null
          description: string | null
          doors_at: string | null
          end_date: string | null
          expected_attendance: number | null
          expected_peak: number | null
          id: string
          jurisdiction: string
          licensed_capacity: number | null
          lifecycle_stage: Database["public"]["Enums"]["event_lifecycle_stage"]
          load_in_at: string | null
          load_out_at: string | null
          local_authority: string | null
          name: string
          opens_at: string | null
          organisation_id: string
          performer_count: number | null
          planned_public_capacity: number | null
          planning_start_date: string | null
          portal_enabled: boolean
          reference: string
          staff_call_at: string | null
          staff_count: number | null
          stand_down_at: string | null
          start_date: string | null
          timezone: string
          year: number
        }
        Insert: {
          actual_peak?: number | null
          breakdown_at?: string | null
          build_start_at?: string | null
          category?: string | null
          client_id: string
          closes_at?: string | null
          contractor_count?: number | null
          created_at?: string
          created_by?: string | null
          current_phase?: Database["public"]["Enums"]["event_phase"] | null
          description?: string | null
          doors_at?: string | null
          end_date?: string | null
          expected_attendance?: number | null
          expected_peak?: number | null
          id?: string
          jurisdiction?: string
          licensed_capacity?: number | null
          lifecycle_stage?: Database["public"]["Enums"]["event_lifecycle_stage"]
          load_in_at?: string | null
          load_out_at?: string | null
          local_authority?: string | null
          name: string
          opens_at?: string | null
          organisation_id: string
          performer_count?: number | null
          planned_public_capacity?: number | null
          planning_start_date?: string | null
          portal_enabled?: boolean
          reference: string
          staff_call_at?: string | null
          staff_count?: number | null
          stand_down_at?: string | null
          start_date?: string | null
          timezone?: string
          year: number
        }
        Update: {
          actual_peak?: number | null
          breakdown_at?: string | null
          build_start_at?: string | null
          category?: string | null
          client_id?: string
          closes_at?: string | null
          contractor_count?: number | null
          created_at?: string
          created_by?: string | null
          current_phase?: Database["public"]["Enums"]["event_phase"] | null
          description?: string | null
          doors_at?: string | null
          end_date?: string | null
          expected_attendance?: number | null
          expected_peak?: number | null
          id?: string
          jurisdiction?: string
          licensed_capacity?: number | null
          lifecycle_stage?: Database["public"]["Enums"]["event_lifecycle_stage"]
          load_in_at?: string | null
          load_out_at?: string | null
          local_authority?: string | null
          name?: string
          opens_at?: string | null
          organisation_id?: string
          performer_count?: number | null
          planned_public_capacity?: number | null
          planning_start_date?: string | null
          portal_enabled?: boolean
          reference?: string
          staff_call_at?: string | null
          staff_count?: number | null
          stand_down_at?: string | null
          start_date?: string | null
          timezone?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      id_counters: {
        Row: {
          entity_type: string
          organisation_id: string
          seq: number
          year: number
        }
        Insert: {
          entity_type: string
          organisation_id: string
          seq?: number
          year: number
        }
        Update: {
          entity_type?: string
          organisation_id?: string
          seq?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "id_counters_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_locations: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          event_id: string
          id: string
          name: string
          parent_id: string | null
          status: Database["public"]["Enums"]["operational_location_status"]
          status_changed_at: string | null
          status_changed_by: string | null
          type: Database["public"]["Enums"]["operational_location_type"]
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          name: string
          parent_id?: string | null
          status?: Database["public"]["Enums"]["operational_location_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          type: Database["public"]["Enums"]["operational_location_type"]
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          parent_id?: string | null
          status?: Database["public"]["Enums"]["operational_location_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          type?: Database["public"]["Enums"]["operational_location_type"]
        }
        Relationships: [
          {
            foreignKeyName: "operational_locations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "operational_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_locations_status_changed_by_fkey"
            columns: ["status_changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          code: string
          created_at: string
          id: string
          legal_name: string | null
          name: string
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          legal_name?: string | null
          name: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          legal_name?: string | null
          name?: string
          status?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          code: string
          description: string | null
          id: string
          module: string
        }
        Insert: {
          action: string
          code: string
          description?: string | null
          id?: string
          module: string
        }
        Update: {
          action?: string
          code?: string
          description?: string | null
          id?: string
          module?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          disabled_at: string | null
          email: string
          first_name: string | null
          id: string
          last_login_at: string | null
          mfa_enabled: boolean
          organisation_id: string | null
          phone: string | null
          preferred_name: string | null
          profile_image_url: string | null
          status: Database["public"]["Enums"]["profile_status"]
          surname: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          disabled_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_login_at?: string | null
          mfa_enabled?: boolean
          organisation_id?: string | null
          phone?: string | null
          preferred_name?: string | null
          profile_image_url?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          surname?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          disabled_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_login_at?: string | null
          mfa_enabled?: boolean
          organisation_id?: string | null
          phone?: string | null
          preferred_name?: string | null
          profile_image_url?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          surname?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_external: boolean
          is_system: boolean
          name: string
          organisation_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_external?: boolean
          is_system?: boolean
          name: string
          organisation_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_external?: boolean
          is_system?: boolean
          name?: string
          organisation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          client_id: string | null
          event_id: string | null
          granted_at: string
          granted_by: string | null
          id: string
          organisation_id: string
          revoked_at: string | null
          revoked_by: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          event_id?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          organisation_id: string
          revoked_at?: string | null
          revoked_by?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          event_id?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          organisation_id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_event: {
        Args: {
          p_acknowledged_warnings?: string[]
          p_comments?: string
          p_event_id: string
        }
        Returns: undefined
      }
      change_event_phase: {
        Args: {
          p_event_id: string
          p_phase: Database["public"]["Enums"]["event_phase"]
        }
        Returns: undefined
      }
      change_event_stage: {
        Args: {
          p_event_id: string
          p_reason?: string
          p_to_stage: Database["public"]["Enums"]["event_lifecycle_stage"]
        }
        Returns: undefined
      }
      current_organisation_id: { Args: never; Returns: string }
      current_profile_id: { Args: never; Returns: string }
      has_permission: {
        Args: {
          p_client_id?: string
          p_event_id?: string
          p_organisation_id?: string
          p_permission_code: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      next_reference: {
        Args: {
          p_entity_type: string
          p_organisation_id: string
          p_suffix_width?: number
          p_use_year?: boolean
        }
        Returns: string
      }
      record_audit_event: {
        Args: {
          p_action: string
          p_after_state?: Json
          p_before_state?: Json
          p_entity_id: string
          p_entity_type: string
          p_event_id?: string
          p_organisation_id?: string
          p_reason?: string
        }
        Returns: string
      }
    }
    Enums: {
      account_type: "pending" | "staff" | "client" | "contractor"
      classification_level:
        | "public"
        | "client"
        | "internal"
        | "confidential"
        | "restricted"
      event_lifecycle_stage:
        | "enquiry"
        | "proposal"
        | "confirmed"
        | "planning"
        | "documentation"
        | "client_review"
        | "readiness_review"
        | "operational_ready"
        | "live"
        | "stand_down"
        | "post_event_review"
        | "closed"
        | "archived"
      event_phase:
        | "build"
        | "pre_open"
        | "ingress"
        | "live"
        | "peak"
        | "egress"
        | "closed_to_public"
        | "breakdown"
        | "stand_down"
      operational_location_status:
        | "normal"
        | "monitoring"
        | "congested"
        | "restricted"
        | "unavailable"
        | "closed"
      operational_location_type: "site" | "zone" | "area" | "location"
      profile_status: "active" | "disabled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["pending", "staff", "client", "contractor"],
      classification_level: [
        "public",
        "client",
        "internal",
        "confidential",
        "restricted",
      ],
      event_lifecycle_stage: [
        "enquiry",
        "proposal",
        "confirmed",
        "planning",
        "documentation",
        "client_review",
        "readiness_review",
        "operational_ready",
        "live",
        "stand_down",
        "post_event_review",
        "closed",
        "archived",
      ],
      event_phase: [
        "build",
        "pre_open",
        "ingress",
        "live",
        "peak",
        "egress",
        "closed_to_public",
        "breakdown",
        "stand_down",
      ],
      operational_location_status: [
        "normal",
        "monitoring",
        "congested",
        "restricted",
        "unavailable",
        "closed",
      ],
      operational_location_type: ["site", "zone", "area", "location"],
      profile_status: ["active", "disabled"],
    },
  },
} as const
