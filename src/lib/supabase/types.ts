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
      document_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          document_id: string
          from_status: Database["public"]["Enums"]["document_status"] | null
          id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["document_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          document_id: string
          from_status?: Database["public"]["Enums"]["document_status"] | null
          id?: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["document_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          document_id?: string
          from_status?: Database["public"]["Enums"]["document_status"] | null
          id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["document_status"]
        }
        Relationships: [
          {
            foreignKeyName: "document_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_status_history_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          code: string
          description: string | null
          id: string
          name: string
          organisation_id: string
          sort_order: number
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          name: string
          organisation_id: string
          sort_order?: number
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          name?: string
          organisation_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_types_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          document_id: string
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          notes: string | null
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
          version_no: number
        }
        Insert: {
          document_id: string
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
          version_no: number
        }
        Update: {
          document_id?: string
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          classification: Database["public"]["Enums"]["classification_level"]
          created_at: string
          created_by: string | null
          current_version_id: string | null
          document_type_id: string
          event_id: string
          id: string
          issued_at: string | null
          issued_by: string | null
          organisation_id: string
          reference: string
          status: Database["public"]["Enums"]["document_status"]
          title: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          classification?: Database["public"]["Enums"]["classification_level"]
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          document_type_id: string
          event_id: string
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          organisation_id: string
          reference: string
          status?: Database["public"]["Enums"]["document_status"]
          title: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          classification?: Database["public"]["Enums"]["classification_level"]
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          document_type_id?: string
          event_id?: string
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          organisation_id?: string
          reference?: string
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_current_version_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
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
      event_control_roles: {
        Row: {
          code: string
          id: string
          name: string
          organisation_id: string
          sort_order: number
        }
        Insert: {
          code: string
          id?: string
          name: string
          organisation_id: string
          sort_order?: number
        }
        Update: {
          code?: string
          id?: string
          name?: string
          organisation_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_control_roles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_control_sessions: {
        Row: {
          ended_at: string | null
          ended_by: string | null
          event_id: string
          id: string
          profile_id: string
          role_id: string
          started_at: string
          started_by: string | null
        }
        Insert: {
          ended_at?: string | null
          ended_by?: string | null
          event_id: string
          id?: string
          profile_id: string
          role_id: string
          started_at?: string
          started_by?: string | null
        }
        Update: {
          ended_at?: string | null
          ended_by?: string | null
          event_id?: string
          id?: string
          profile_id?: string
          role_id?: string
          started_at?: string
          started_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_control_sessions_ended_by_fkey"
            columns: ["ended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_control_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_control_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_control_sessions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "event_control_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_control_sessions_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_id_counters: {
        Row: {
          entity_type: string
          event_id: string
          seq: number
        }
        Insert: {
          entity_type: string
          event_id: string
          seq?: number
        }
        Update: {
          entity_type?: string
          event_id?: string
          seq?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_id_counters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_readiness_checks: {
        Row: {
          checklist_item_id: string
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          event_id: string
          id: string
          notes: string | null
        }
        Insert: {
          checklist_item_id: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          event_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          checklist_item_id?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          event_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_readiness_checks_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "readiness_checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_readiness_checks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_readiness_checks_event_id_fkey"
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
      evidence_custody_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          evidence_item_id: string
          id: string
          notes: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          evidence_item_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          evidence_item_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_custody_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_custody_log_evidence_item_id_fkey"
            columns: ["evidence_item_id"]
            isOneToOne: false
            referencedRelation: "evidence_items"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_items: {
        Row: {
          classification: Database["public"]["Enums"]["classification_level"]
          collected_at: string
          collected_by_name: string | null
          created_at: string
          description: string
          file_name: string | null
          file_size: number | null
          id: string
          incident_id: string
          item_type: string
          logged_by: string | null
          mime_type: string | null
          organisation_id: string
          reference: string
          sha256_hash: string | null
          status: Database["public"]["Enums"]["evidence_status"]
          storage_path: string | null
        }
        Insert: {
          classification?: Database["public"]["Enums"]["classification_level"]
          collected_at?: string
          collected_by_name?: string | null
          created_at?: string
          description: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          incident_id: string
          item_type: string
          logged_by?: string | null
          mime_type?: string | null
          organisation_id: string
          reference: string
          sha256_hash?: string | null
          status?: Database["public"]["Enums"]["evidence_status"]
          storage_path?: string | null
        }
        Update: {
          classification?: Database["public"]["Enums"]["classification_level"]
          collected_at?: string
          collected_by_name?: string | null
          created_at?: string
          description?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          incident_id?: string
          item_type?: string
          logged_by?: string | null
          mime_type?: string | null
          organisation_id?: string
          reference?: string
          sha256_hash?: string | null
          status?: Database["public"]["Enums"]["evidence_status"]
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_items_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_items_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_items_organisation_id_fkey"
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
      incident_actions: {
        Row: {
          assigned_to: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          description: string
          due_at: string | null
          id: string
          incident_id: string
          reference: string
          status: Database["public"]["Enums"]["incident_action_status"]
        }
        Insert: {
          assigned_to?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          due_at?: string | null
          id?: string
          incident_id: string
          reference: string
          status?: Database["public"]["Enums"]["incident_action_status"]
        }
        Update: {
          assigned_to?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_at?: string | null
          id?: string
          incident_id?: string
          reference?: string
          status?: Database["public"]["Enums"]["incident_action_status"]
        }
        Relationships: [
          {
            foreignKeyName: "incident_actions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_actions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_actions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_actions_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_agencies: {
        Row: {
          agency_name: string
          agency_type: string
          arrived_at: string | null
          attending_at: string | null
          contact_name: string | null
          contact_number: string | null
          created_at: string
          id: string
          incident_id: string
          notified_at: string
          notified_by: string | null
          reference: string
          status: Database["public"]["Enums"]["incident_agency_status"]
          stood_down_at: string | null
        }
        Insert: {
          agency_name: string
          agency_type: string
          arrived_at?: string | null
          attending_at?: string | null
          contact_name?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          incident_id: string
          notified_at?: string
          notified_by?: string | null
          reference: string
          status?: Database["public"]["Enums"]["incident_agency_status"]
          stood_down_at?: string | null
        }
        Update: {
          agency_name?: string
          agency_type?: string
          arrived_at?: string | null
          attending_at?: string | null
          contact_name?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          incident_id?: string
          notified_at?: string
          notified_by?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["incident_agency_status"]
          stood_down_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_agencies_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_agencies_notified_by_fkey"
            columns: ["notified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_categories: {
        Row: {
          code: string
          is_system: boolean
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          is_system?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          is_system?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      incident_decisions: {
        Row: {
          created_at: string
          decided_at: string
          decided_by: string | null
          decision: string
          id: string
          incident_id: string
          rationale: string | null
          reference: string
        }
        Insert: {
          created_at?: string
          decided_at?: string
          decided_by?: string | null
          decision: string
          id?: string
          incident_id: string
          rationale?: string | null
          reference: string
        }
        Update: {
          created_at?: string
          decided_at?: string
          decided_by?: string | null
          decision?: string
          id?: string
          incident_id?: string
          rationale?: string | null
          reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_decisions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_decisions_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_log_entries: {
        Row: {
          author_id: string | null
          body: string
          corrects_entry_id: string | null
          created_at: string
          entry_type: Database["public"]["Enums"]["incident_log_entry_type"]
          id: string
          incident_id: string
          linked_record_id: string | null
          linked_record_type: string | null
          occurred_at: string
          reported_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          corrects_entry_id?: string | null
          created_at?: string
          entry_type: Database["public"]["Enums"]["incident_log_entry_type"]
          id?: string
          incident_id: string
          linked_record_id?: string | null
          linked_record_type?: string | null
          occurred_at?: string
          reported_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          corrects_entry_id?: string | null
          created_at?: string
          entry_type?: Database["public"]["Enums"]["incident_log_entry_type"]
          id?: string
          incident_id?: string
          linked_record_id?: string | null
          linked_record_type?: string | null
          occurred_at?: string
          reported_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_log_entries_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_log_entries_corrects_entry_id_fkey"
            columns: ["corrects_entry_id"]
            isOneToOne: false
            referencedRelation: "incident_log_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_log_entries_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_people: {
        Row: {
          id: string
          incident_id: string
          linked_at: string
          linked_by: string | null
          notes: string | null
          person_id: string
          role_code: string
        }
        Insert: {
          id?: string
          incident_id: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          person_id: string
          role_code: string
        }
        Update: {
          id?: string
          incident_id?: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          person_id?: string
          role_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_people_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_people_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_priorities: {
        Row: {
          code: string
          color_token: string
          description: string
          name: string
          organisation_id: string
          rank: number
          target_ack_minutes: number | null
          target_resolve_minutes: number | null
        }
        Insert: {
          code: string
          color_token?: string
          description: string
          name: string
          organisation_id: string
          rank: number
          target_ack_minutes?: number | null
          target_resolve_minutes?: number | null
        }
        Update: {
          code?: string
          color_token?: string
          description?: string
          name?: string
          organisation_id?: string
          rank?: number
          target_ack_minutes?: number | null
          target_resolve_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_priorities_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_resources: {
        Row: {
          arrived_at: string | null
          created_at: string
          description: string | null
          dispatched_at: string | null
          id: string
          incident_id: string
          reference: string
          requested_at: string
          requested_by: string | null
          resource_type: string
          status: Database["public"]["Enums"]["incident_resource_status"]
          stood_down_at: string | null
        }
        Insert: {
          arrived_at?: string | null
          created_at?: string
          description?: string | null
          dispatched_at?: string | null
          id?: string
          incident_id: string
          reference: string
          requested_at?: string
          requested_by?: string | null
          resource_type: string
          status?: Database["public"]["Enums"]["incident_resource_status"]
          stood_down_at?: string | null
        }
        Update: {
          arrived_at?: string | null
          created_at?: string
          description?: string | null
          dispatched_at?: string | null
          id?: string
          incident_id?: string
          reference?: string
          requested_at?: string
          requested_by?: string | null
          resource_type?: string
          status?: Database["public"]["Enums"]["incident_resource_status"]
          stood_down_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_resources_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_resources_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_vehicles: {
        Row: {
          id: string
          incident_id: string
          linked_at: string
          linked_by: string | null
          notes: string | null
          role_code: string
          vehicle_id: string
        }
        Insert: {
          id?: string
          incident_id: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          role_code: string
          vehicle_id: string
        }
        Update: {
          id?: string
          incident_id?: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          role_code?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_vehicles_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_vehicles_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_vehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          acknowledged_at: string | null
          category_code: string
          classification: Database["public"]["Enums"]["classification_level"]
          closed_at: string | null
          closed_by: string | null
          closure_summary: string | null
          controller_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_id: string
          event_phase: Database["public"]["Enums"]["event_phase"] | null
          id: string
          location_id: string | null
          merged_into_incident_id: string | null
          occurred_at: string
          organisation_id: string
          owner_id: string | null
          priority_code: string | null
          reference: string
          report_source: Database["public"]["Enums"]["report_source"]
          reported_at: string
          reported_by_name: string | null
          reported_by_profile_id: string | null
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["incident_status"]
          subtype: string | null
          summary: string
        }
        Insert: {
          acknowledged_at?: string | null
          category_code: string
          classification?: Database["public"]["Enums"]["classification_level"]
          closed_at?: string | null
          closed_by?: string | null
          closure_summary?: string | null
          controller_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id: string
          event_phase?: Database["public"]["Enums"]["event_phase"] | null
          id?: string
          location_id?: string | null
          merged_into_incident_id?: string | null
          occurred_at?: string
          organisation_id: string
          owner_id?: string | null
          priority_code?: string | null
          reference: string
          report_source?: Database["public"]["Enums"]["report_source"]
          reported_at?: string
          reported_by_name?: string | null
          reported_by_profile_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          subtype?: string | null
          summary: string
        }
        Update: {
          acknowledged_at?: string | null
          category_code?: string
          classification?: Database["public"]["Enums"]["classification_level"]
          closed_at?: string | null
          closed_by?: string | null
          closure_summary?: string | null
          controller_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id?: string
          event_phase?: Database["public"]["Enums"]["event_phase"] | null
          id?: string
          location_id?: string | null
          merged_into_incident_id?: string | null
          occurred_at?: string
          organisation_id?: string
          owner_id?: string | null
          priority_code?: string | null
          reference?: string
          report_source?: Database["public"]["Enums"]["report_source"]
          reported_at?: string
          reported_by_name?: string | null
          reported_by_profile_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          subtype?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "incident_categories"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "incidents_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_controller_id_fkey"
            columns: ["controller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "operational_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_merged_into_incident_id_fkey"
            columns: ["merged_into_incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_organisation_id_priority_code_fkey"
            columns: ["organisation_id", "priority_code"]
            isOneToOne: false
            referencedRelation: "incident_priorities"
            referencedColumns: ["organisation_id", "code"]
          },
          {
            foreignKeyName: "incidents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_reported_by_profile_id_fkey"
            columns: ["reported_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_evidence: {
        Row: {
          evidence_item_id: string
          id: string
          investigation_id: string
          linked_at: string
          linked_by: string | null
        }
        Insert: {
          evidence_item_id: string
          id?: string
          investigation_id: string
          linked_at?: string
          linked_by?: string | null
        }
        Update: {
          evidence_item_id?: string
          id?: string
          investigation_id?: string
          linked_at?: string
          linked_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investigation_evidence_evidence_item_id_fkey"
            columns: ["evidence_item_id"]
            isOneToOne: false
            referencedRelation: "evidence_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_evidence_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_evidence_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_incidents: {
        Row: {
          id: string
          incident_id: string
          investigation_id: string
          linked_at: string
          linked_by: string | null
        }
        Insert: {
          id?: string
          incident_id: string
          investigation_id: string
          linked_at?: string
          linked_by?: string | null
        }
        Update: {
          id?: string
          incident_id?: string
          investigation_id?: string
          linked_at?: string
          linked_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investigation_incidents_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_incidents_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_incidents_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          investigation_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          investigation_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          investigation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigation_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_notes_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_people: {
        Row: {
          id: string
          investigation_id: string
          linked_at: string
          linked_by: string | null
          notes: string | null
          person_id: string
          role_code: string
        }
        Insert: {
          id?: string
          investigation_id: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          person_id: string
          role_code: string
        }
        Update: {
          id?: string
          investigation_id?: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          person_id?: string
          role_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigation_people_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_people_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_vehicles: {
        Row: {
          id: string
          investigation_id: string
          linked_at: string
          linked_by: string | null
          notes: string | null
          role_code: string
          vehicle_id: string
        }
        Insert: {
          id?: string
          investigation_id: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          role_code: string
          vehicle_id: string
        }
        Update: {
          id?: string
          investigation_id?: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          role_code?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigation_vehicles_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_vehicles_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_vehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      investigations: {
        Row: {
          classification: Database["public"]["Enums"]["classification_level"]
          closed_at: string | null
          closed_reason: string | null
          created_at: string
          id: string
          lead_investigator_id: string | null
          opened_at: string
          opened_by: string | null
          organisation_id: string
          reference: string
          status: Database["public"]["Enums"]["investigation_status"]
          summary: string | null
          title: string
        }
        Insert: {
          classification?: Database["public"]["Enums"]["classification_level"]
          closed_at?: string | null
          closed_reason?: string | null
          created_at?: string
          id?: string
          lead_investigator_id?: string | null
          opened_at?: string
          opened_by?: string | null
          organisation_id: string
          reference: string
          status?: Database["public"]["Enums"]["investigation_status"]
          summary?: string | null
          title: string
        }
        Update: {
          classification?: Database["public"]["Enums"]["classification_level"]
          closed_at?: string | null
          closed_reason?: string | null
          created_at?: string
          id?: string
          lead_investigator_id?: string | null
          opened_at?: string
          opened_by?: string | null
          organisation_id?: string
          reference?: string
          status?: Database["public"]["Enums"]["investigation_status"]
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigations_lead_investigator_id_fkey"
            columns: ["lead_investigator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigations_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      major_incident_activations: {
        Row: {
          activated_at: string
          activated_by: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          id: string
          incident_id: string
          reason: string
        }
        Insert: {
          activated_at?: string
          activated_by?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: string
          incident_id: string
          reason: string
        }
        Update: {
          activated_at?: string
          activated_by?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: string
          incident_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "major_incident_activations_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "major_incident_activations_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "major_incident_activations_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      methane_message_versions: {
        Row: {
          access_and_egress: string | null
          casualties: string | null
          emergency_services: string | null
          exact_location: string
          hazards: string | null
          id: string
          incident_type: string
          major_incident_declared: boolean
          methane_message_id: string
          submitted_at: string
          submitted_by: string | null
          version_no: number
        }
        Insert: {
          access_and_egress?: string | null
          casualties?: string | null
          emergency_services?: string | null
          exact_location: string
          hazards?: string | null
          id?: string
          incident_type: string
          major_incident_declared?: boolean
          methane_message_id: string
          submitted_at?: string
          submitted_by?: string | null
          version_no: number
        }
        Update: {
          access_and_egress?: string | null
          casualties?: string | null
          emergency_services?: string | null
          exact_location?: string
          hazards?: string | null
          id?: string
          incident_type?: string
          major_incident_declared?: boolean
          methane_message_id?: string
          submitted_at?: string
          submitted_by?: string | null
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "methane_message_versions_methane_message_id_fkey"
            columns: ["methane_message_id"]
            isOneToOne: false
            referencedRelation: "methane_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "methane_message_versions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      methane_messages: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          incident_id: string
          reference: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          incident_id: string
          reference: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          incident_id?: string
          reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "methane_messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "methane_messages_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          category: string
          classification: Database["public"]["Enums"]["classification_level"]
          created_at: string
          created_by: string | null
          description: string | null
          dismissed_reason: string | null
          event_id: string
          event_phase: Database["public"]["Enums"]["event_phase"] | null
          id: string
          location_id: string | null
          occurred_at: string
          organisation_id: string
          promoted_incident_id: string | null
          reference: string
          reported_at: string
          reported_by_name: string | null
          reported_by_profile_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["observation_status"]
          summary: string
        }
        Insert: {
          category: string
          classification?: Database["public"]["Enums"]["classification_level"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          dismissed_reason?: string | null
          event_id: string
          event_phase?: Database["public"]["Enums"]["event_phase"] | null
          id?: string
          location_id?: string | null
          occurred_at?: string
          organisation_id: string
          promoted_incident_id?: string | null
          reference: string
          reported_at?: string
          reported_by_name?: string | null
          reported_by_profile_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["observation_status"]
          summary: string
        }
        Update: {
          category?: string
          classification?: Database["public"]["Enums"]["classification_level"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          dismissed_reason?: string | null
          event_id?: string
          event_phase?: Database["public"]["Enums"]["event_phase"] | null
          id?: string
          location_id?: string | null
          occurred_at?: string
          organisation_id?: string
          promoted_incident_id?: string | null
          reference?: string
          reported_at?: string
          reported_by_name?: string | null
          reported_by_profile_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["observation_status"]
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "observations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "operational_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_promoted_incident_id_fkey"
            columns: ["promoted_incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_reported_by_profile_id_fkey"
            columns: ["reported_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      organisation_id_counters: {
        Row: {
          entity_type: string
          organisation_id: string
          seq: number
        }
        Insert: {
          entity_type: string
          organisation_id: string
          seq?: number
        }
        Update: {
          entity_type?: string
          organisation_id?: string
          seq?: number
        }
        Relationships: [
          {
            foreignKeyName: "organisation_id_counters_organisation_id_fkey"
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
      people: {
        Row: {
          classification: Database["public"]["Enums"]["classification_level"]
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          description: string | null
          first_name: string | null
          id: string
          organisation_id: string
          purpose: string
          reference: string
          status: Database["public"]["Enums"]["intelligence_record_status"]
          surname: string | null
        }
        Insert: {
          classification?: Database["public"]["Enums"]["classification_level"]
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          description?: string | null
          first_name?: string | null
          id?: string
          organisation_id: string
          purpose: string
          reference: string
          status?: Database["public"]["Enums"]["intelligence_record_status"]
          surname?: string | null
        }
        Update: {
          classification?: Database["public"]["Enums"]["classification_level"]
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          description?: string | null
          first_name?: string | null
          id?: string
          organisation_id?: string
          purpose?: string
          reference?: string
          status?: Database["public"]["Enums"]["intelligence_record_status"]
          surname?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
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
      radio_log_entries: {
        Row: {
          channel: string | null
          created_at: string
          event_id: string
          from_callsign: string | null
          id: string
          linked_incident_id: string | null
          logged_by: string | null
          message: string
          occurred_at: string
          organisation_id: string
          reference: string
          significant: boolean
          to_callsign: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          event_id: string
          from_callsign?: string | null
          id?: string
          linked_incident_id?: string | null
          logged_by?: string | null
          message: string
          occurred_at?: string
          organisation_id: string
          reference: string
          significant?: boolean
          to_callsign?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          event_id?: string
          from_callsign?: string | null
          id?: string
          linked_incident_id?: string | null
          logged_by?: string | null
          message?: string
          occurred_at?: string
          organisation_id?: string
          reference?: string
          significant?: boolean
          to_callsign?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "radio_log_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radio_log_entries_linked_incident_id_fkey"
            columns: ["linked_incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radio_log_entries_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radio_log_entries_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      readiness_checklist_items: {
        Row: {
          code: string
          description: string | null
          id: string
          name: string
          organisation_id: string
          sort_order: number
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          name: string
          organisation_id: string
          sort_order?: number
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          name?: string
          organisation_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "readiness_checklist_items_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          category: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_id: string
          id: string
          impact: number
          likelihood: number
          mitigation: string | null
          organisation_id: string
          owner_id: string | null
          reference: string
          risk_score: number | null
          status: Database["public"]["Enums"]["risk_status"]
          title: string
        }
        Insert: {
          category?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id: string
          id?: string
          impact: number
          likelihood: number
          mitigation?: string | null
          organisation_id: string
          owner_id?: string | null
          reference: string
          risk_score?: number | null
          status?: Database["public"]["Enums"]["risk_status"]
          title: string
        }
        Update: {
          category?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id?: string
          id?: string
          impact?: number
          likelihood?: number
          mitigation?: string | null
          organisation_id?: string
          owner_id?: string | null
          reference?: string
          risk_score?: number | null
          status?: Database["public"]["Enums"]["risk_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "risks_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      vehicles: {
        Row: {
          classification: Database["public"]["Enums"]["classification_level"]
          colour: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          make: string | null
          model: string | null
          organisation_id: string
          purpose: string
          reference: string
          registration: string | null
          status: Database["public"]["Enums"]["intelligence_record_status"]
        }
        Insert: {
          classification?: Database["public"]["Enums"]["classification_level"]
          colour?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          make?: string | null
          model?: string | null
          organisation_id: string
          purpose: string
          reference: string
          registration?: string | null
          status?: Database["public"]["Enums"]["intelligence_record_status"]
        }
        Update: {
          classification?: Database["public"]["Enums"]["classification_level"]
          colour?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          make?: string | null
          model?: string | null
          organisation_id?: string
          purpose?: string
          reference?: string
          registration?: string | null
          status?: Database["public"]["Enums"]["intelligence_record_status"]
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acknowledge_incident: {
        Args: { p_incident_id: string }
        Returns: undefined
      }
      activate_event: {
        Args: {
          p_acknowledged_warnings?: string[]
          p_comments?: string
          p_event_id: string
        }
        Returns: undefined
      }
      activate_major_incident: {
        Args: { p_incident_id: string; p_reason: string }
        Returns: string
      }
      add_incident_correction: {
        Args: {
          p_body: string
          p_corrects_entry_id: string
          p_incident_id: string
        }
        Returns: string
      }
      add_investigation_note: {
        Args: { p_body: string; p_investigation_id: string }
        Returns: string
      }
      append_incident_log_entry: {
        Args: {
          p_body: string
          p_entry_type: Database["public"]["Enums"]["incident_log_entry_type"]
          p_incident_id: string
          p_linked_record_id?: string
          p_linked_record_type?: string
          p_occurred_at?: string
        }
        Returns: string
      }
      approve_document: {
        Args: { p_comments?: string; p_document_id: string }
        Returns: undefined
      }
      archive_document: {
        Args: { p_document_id: string; p_reason: string }
        Returns: undefined
      }
      assign_incident_controller: {
        Args: { p_controller_id?: string; p_incident_id: string }
        Returns: undefined
      }
      assign_incident_owner: {
        Args: { p_incident_id: string; p_owner_id: string }
        Returns: undefined
      }
      cancel_incident_action: {
        Args: { p_action_id: string; p_reason: string }
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
      change_incident_priority: {
        Args: {
          p_incident_id: string
          p_new_priority_code: string
          p_reason?: string
        }
        Returns: undefined
      }
      close_incident: {
        Args: { p_closure_summary: string; p_incident_id: string }
        Returns: undefined
      }
      complete_incident_action: {
        Args: { p_action_id: string; p_note?: string }
        Returns: undefined
      }
      complete_readiness_check: {
        Args: {
          p_checklist_item_id: string
          p_event_id: string
          p_notes?: string
        }
        Returns: undefined
      }
      create_document: {
        Args: {
          p_classification?: Database["public"]["Enums"]["classification_level"]
          p_document_type_id: string
          p_event_id: string
          p_title: string
        }
        Returns: string
      }
      create_incident: {
        Args: {
          p_category_code: string
          p_description?: string
          p_event_id: string
          p_location_id?: string
          p_occurred_at?: string
          p_priority_code?: string
          p_report_source?: Database["public"]["Enums"]["report_source"]
          p_reported_by_name?: string
          p_summary: string
        }
        Returns: string
      }
      create_incident_action: {
        Args: {
          p_assigned_to?: string
          p_description: string
          p_due_at?: string
          p_incident_id: string
        }
        Returns: string
      }
      create_investigation: {
        Args: {
          p_classification?: Database["public"]["Enums"]["classification_level"]
          p_lead_investigator_id?: string
          p_organisation_id: string
          p_summary?: string
          p_title: string
        }
        Returns: string
      }
      create_methane_message: {
        Args: {
          p_access_and_egress?: string
          p_casualties?: string
          p_emergency_services?: string
          p_exact_location: string
          p_hazards?: string
          p_incident_id: string
          p_incident_type: string
          p_major_incident_declared: boolean
        }
        Returns: string
      }
      create_observation: {
        Args: {
          p_category: string
          p_classification?: Database["public"]["Enums"]["classification_level"]
          p_description?: string
          p_event_id: string
          p_location_id?: string
          p_occurred_at?: string
          p_reported_by_name?: string
          p_summary: string
        }
        Returns: string
      }
      create_person: {
        Args: {
          p_classification?: Database["public"]["Enums"]["classification_level"]
          p_date_of_birth?: string
          p_description?: string
          p_first_name?: string
          p_incident_id: string
          p_notes?: string
          p_purpose: string
          p_role_code: string
          p_surname?: string
        }
        Returns: string
      }
      create_risk: {
        Args: {
          p_category?: string
          p_description?: string
          p_event_id: string
          p_impact: number
          p_likelihood: number
          p_mitigation?: string
          p_owner_id?: string
          p_title: string
        }
        Returns: string
      }
      create_vehicle: {
        Args: {
          p_classification?: Database["public"]["Enums"]["classification_level"]
          p_colour?: string
          p_description?: string
          p_incident_id: string
          p_make?: string
          p_model?: string
          p_notes?: string
          p_purpose: string
          p_registration?: string
          p_role_code: string
        }
        Returns: string
      }
      current_organisation_id: { Args: never; Returns: string }
      current_profile_id: { Args: never; Returns: string }
      deactivate_major_incident: {
        Args: { p_incident_id: string; p_reason?: string }
        Returns: undefined
      }
      end_control_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      get_portal_incident_summary: {
        Args: { p_event_id: string }
        Returns: {
          closed_incidents: number
          open_incidents: number
          resolved_incidents: number
          total_incidents: number
        }[]
      }
      grant_event_portal_access: {
        Args: { p_email: string; p_event_id: string; p_role_id: string }
        Returns: string
      }
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
      issue_document: { Args: { p_document_id: string }; Returns: undefined }
      link_evidence_to_investigation: {
        Args: { p_evidence_item_id: string; p_investigation_id: string }
        Returns: string
      }
      link_existing_person_to_incident: {
        Args: {
          p_incident_id: string
          p_notes?: string
          p_person_id: string
          p_role_code: string
        }
        Returns: string
      }
      link_existing_vehicle_to_incident: {
        Args: {
          p_incident_id: string
          p_notes?: string
          p_role_code: string
          p_vehicle_id: string
        }
        Returns: string
      }
      link_incident_to_investigation: {
        Args: { p_incident_id: string; p_investigation_id: string }
        Returns: string
      }
      link_person_to_investigation: {
        Args: {
          p_investigation_id: string
          p_notes?: string
          p_person_id: string
          p_role_code: string
        }
        Returns: string
      }
      link_vehicle_to_investigation: {
        Args: {
          p_investigation_id: string
          p_notes?: string
          p_role_code: string
          p_vehicle_id: string
        }
        Returns: string
      }
      log_evidence_item: {
        Args: {
          p_classification?: Database["public"]["Enums"]["classification_level"]
          p_collected_at?: string
          p_collected_by_name?: string
          p_description: string
          p_file_name?: string
          p_file_size?: number
          p_incident_id: string
          p_item_type: string
          p_mime_type?: string
          p_sha256_hash?: string
          p_storage_path?: string
        }
        Returns: string
      }
      log_radio_entry: {
        Args: {
          p_channel?: string
          p_event_id: string
          p_from_callsign?: string
          p_linked_incident_id?: string
          p_message: string
          p_occurred_at?: string
          p_significant?: boolean
          p_to_callsign?: string
        }
        Returns: string
      }
      next_event_reference: {
        Args: {
          p_entity_type: string
          p_event_id: string
          p_suffix_width?: number
        }
        Returns: string
      }
      next_organisation_reference: {
        Args: {
          p_entity_type: string
          p_organisation_id: string
          p_suffix_width?: number
        }
        Returns: string
      }
      next_reference: {
        Args: {
          p_entity_type: string
          p_organisation_id: string
          p_suffix_width?: number
          p_use_year?: boolean
        }
        Returns: string
      }
      notify_incident_agency: {
        Args: {
          p_agency_name: string
          p_agency_type: string
          p_contact_name?: string
          p_contact_number?: string
          p_incident_id: string
        }
        Returns: string
      }
      promote_observation_to_incident: {
        Args: {
          p_category_code: string
          p_observation_id: string
          p_priority_code?: string
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
      record_evidence_access: {
        Args: { p_action?: string; p_evidence_item_id: string }
        Returns: undefined
      }
      record_incident_decision: {
        Args: {
          p_decision: string
          p_incident_id: string
          p_rationale?: string
        }
        Returns: string
      }
      register_document_version: {
        Args: {
          p_document_id: string
          p_file_name: string
          p_file_size?: number
          p_mime_type?: string
          p_notes?: string
          p_storage_path: string
        }
        Returns: string
      }
      reopen_incident: {
        Args: { p_incident_id: string; p_reason: string }
        Returns: undefined
      }
      request_incident_resource: {
        Args: {
          p_description?: string
          p_incident_id: string
          p_resource_type: string
        }
        Returns: string
      }
      resolve_incident: {
        Args: { p_incident_id: string; p_resolution: string }
        Returns: undefined
      }
      set_event_portal_enabled: {
        Args: { p_enabled: boolean; p_event_id: string }
        Returns: undefined
      }
      start_control_session: {
        Args: { p_event_id: string; p_profile_id?: string; p_role_id: string }
        Returns: string
      }
      submit_document_for_review: {
        Args: { p_document_id: string }
        Returns: undefined
      }
      uncomplete_readiness_check: {
        Args: { p_checklist_item_id: string; p_event_id: string }
        Returns: undefined
      }
      update_evidence_status: {
        Args: {
          p_evidence_item_id: string
          p_notes?: string
          p_status: Database["public"]["Enums"]["evidence_status"]
        }
        Returns: undefined
      }
      update_incident_agency_status: {
        Args: {
          p_agency_id: string
          p_status: Database["public"]["Enums"]["incident_agency_status"]
        }
        Returns: undefined
      }
      update_incident_resource_status: {
        Args: {
          p_resource_id: string
          p_status: Database["public"]["Enums"]["incident_resource_status"]
        }
        Returns: undefined
      }
      update_investigation_status: {
        Args: {
          p_investigation_id: string
          p_reason?: string
          p_status: Database["public"]["Enums"]["investigation_status"]
        }
        Returns: undefined
      }
      update_observation_status: {
        Args: {
          p_dismissed_reason?: string
          p_observation_id: string
          p_status: Database["public"]["Enums"]["observation_status"]
        }
        Returns: undefined
      }
      update_risk_assessment: {
        Args: {
          p_impact: number
          p_likelihood: number
          p_mitigation?: string
          p_risk_id: string
        }
        Returns: undefined
      }
      update_risk_status: {
        Args: {
          p_note?: string
          p_risk_id: string
          p_status: Database["public"]["Enums"]["risk_status"]
        }
        Returns: undefined
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
      document_status:
        | "draft"
        | "in_review"
        | "approved"
        | "issued"
        | "superseded"
        | "archived"
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
      evidence_status: "logged" | "reviewed" | "released" | "disposed"
      incident_action_status: "open" | "in_progress" | "complete" | "cancelled"
      incident_agency_status:
        | "notified"
        | "attending"
        | "on_scene"
        | "stood_down"
      incident_log_entry_type:
        | "report"
        | "update"
        | "status"
        | "communication"
        | "dispatch"
        | "arrival"
        | "action"
        | "decision"
        | "agency"
        | "attachment"
        | "escalation"
        | "system"
        | "correction"
        | "intelligence"
      incident_resource_status:
        | "requested"
        | "dispatched"
        | "on_scene"
        | "stood_down"
      incident_status:
        | "reported"
        | "acknowledged"
        | "active"
        | "monitoring"
        | "awaiting_information"
        | "external_agency_lead"
        | "suspended"
        | "resolved"
        | "closed"
      intelligence_record_status: "active" | "archived"
      investigation_status: "open" | "active" | "closed" | "archived"
      observation_status: "open" | "reviewed" | "promoted" | "dismissed"
      operational_location_status:
        | "normal"
        | "monitoring"
        | "congested"
        | "restricted"
        | "unavailable"
        | "closed"
      operational_location_type: "site" | "zone" | "area" | "location"
      profile_status: "active" | "disabled"
      report_source:
        | "radio"
        | "telephone"
        | "in_person"
        | "field_app"
        | "event_control_observation"
        | "client"
        | "contractor"
        | "emergency_service"
        | "public"
        | "system_integration"
        | "other"
      risk_status: "open" | "mitigated" | "accepted" | "closed"
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
      document_status: [
        "draft",
        "in_review",
        "approved",
        "issued",
        "superseded",
        "archived",
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
      evidence_status: ["logged", "reviewed", "released", "disposed"],
      incident_action_status: ["open", "in_progress", "complete", "cancelled"],
      incident_agency_status: [
        "notified",
        "attending",
        "on_scene",
        "stood_down",
      ],
      incident_log_entry_type: [
        "report",
        "update",
        "status",
        "communication",
        "dispatch",
        "arrival",
        "action",
        "decision",
        "agency",
        "attachment",
        "escalation",
        "system",
        "correction",
        "intelligence",
      ],
      incident_resource_status: [
        "requested",
        "dispatched",
        "on_scene",
        "stood_down",
      ],
      incident_status: [
        "reported",
        "acknowledged",
        "active",
        "monitoring",
        "awaiting_information",
        "external_agency_lead",
        "suspended",
        "resolved",
        "closed",
      ],
      intelligence_record_status: ["active", "archived"],
      investigation_status: ["open", "active", "closed", "archived"],
      observation_status: ["open", "reviewed", "promoted", "dismissed"],
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
      report_source: [
        "radio",
        "telephone",
        "in_person",
        "field_app",
        "event_control_observation",
        "client",
        "contractor",
        "emergency_service",
        "public",
        "system_integration",
        "other",
      ],
      risk_status: ["open", "mitigated", "accepted", "closed"],
    },
  },
} as const
