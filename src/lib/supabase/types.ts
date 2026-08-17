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
      profile_status: ["active", "disabled"],
    },
  },
} as const
