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
      incident_priorities: {
        Row: {
          code: string
          color_token: string
          description: string
          name: string
          organisation_id: string
          rank: number
        }
        Insert: {
          code: string
          color_token?: string
          description: string
          name: string
          organisation_id: string
          rank: number
        }
        Update: {
          code?: string
          color_token?: string
          description?: string
          name?: string
          organisation_id?: string
          rank?: number
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
      add_incident_correction: {
        Args: {
          p_body: string
          p_corrects_entry_id: string
          p_incident_id: string
        }
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
      next_event_reference: {
        Args: {
          p_entity_type: string
          p_event_id: string
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
      record_incident_decision: {
        Args: {
          p_decision: string
          p_incident_id: string
          p_rationale?: string
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
      update_incident_resource_status: {
        Args: {
          p_resource_id: string
          p_status: Database["public"]["Enums"]["incident_resource_status"]
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
      incident_action_status: "open" | "in_progress" | "complete" | "cancelled"
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
      incident_action_status: ["open", "in_progress", "complete", "cancelled"],
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
    },
  },
} as const
