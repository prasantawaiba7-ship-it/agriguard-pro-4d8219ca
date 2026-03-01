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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ag_offices: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          district: string
          id: string
          name: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          district: string
          id?: string
          name: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          district?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      agricultural_officers: {
        Row: {
          alternate_phone: string | null
          channel_access: string[] | null
          created_at: string
          designation: string
          designation_ne: string | null
          district: string
          email: string | null
          expertise_areas: string[] | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          last_active_at: string | null
          latitude: number | null
          longitude: number | null
          max_open_cases: number | null
          municipality: string | null
          name: string
          name_ne: string | null
          office_address: string | null
          office_address_ne: string | null
          office_name: string | null
          office_name_ne: string | null
          open_cases_count: number | null
          permission_level: string | null
          phone: string | null
          preferred_languages: string[] | null
          priority_types: string[] | null
          profile_image_url: string | null
          province: string
          specializations: string[] | null
          updated_at: string
          ward_no: number | null
          working_hours: string | null
          years_of_experience: number | null
        }
        Insert: {
          alternate_phone?: string | null
          channel_access?: string[] | null
          created_at?: string
          designation?: string
          designation_ne?: string | null
          district: string
          email?: string | null
          expertise_areas?: string[] | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          last_active_at?: string | null
          latitude?: number | null
          longitude?: number | null
          max_open_cases?: number | null
          municipality?: string | null
          name: string
          name_ne?: string | null
          office_address?: string | null
          office_address_ne?: string | null
          office_name?: string | null
          office_name_ne?: string | null
          open_cases_count?: number | null
          permission_level?: string | null
          phone?: string | null
          preferred_languages?: string[] | null
          priority_types?: string[] | null
          profile_image_url?: string | null
          province: string
          specializations?: string[] | null
          updated_at?: string
          ward_no?: number | null
          working_hours?: string | null
          years_of_experience?: number | null
        }
        Update: {
          alternate_phone?: string | null
          channel_access?: string[] | null
          created_at?: string
          designation?: string
          designation_ne?: string | null
          district?: string
          email?: string | null
          expertise_areas?: string[] | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          last_active_at?: string | null
          latitude?: number | null
          longitude?: number | null
          max_open_cases?: number | null
          municipality?: string | null
          name?: string
          name_ne?: string | null
          office_address?: string | null
          office_address_ne?: string | null
          office_name?: string | null
          office_name_ne?: string | null
          open_cases_count?: number | null
          permission_level?: string | null
          phone?: string | null
          preferred_languages?: string[] | null
          priority_types?: string[] | null
          profile_image_url?: string | null
          province?: string
          specializations?: string[] | null
          updated_at?: string
          ward_no?: number | null
          working_hours?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      ai_analysis_results: {
        Row: {
          analyzed_at: string
          confidence_score: number | null
          created_at: string
          damage_severity: number | null
          damage_type: Database["public"]["Enums"]["damage_type"] | null
          detected_crop_type: Database["public"]["Enums"]["crop_type"] | null
          detected_stage: Database["public"]["Enums"]["crop_stage"] | null
          gps_validated: boolean | null
          health_score: number | null
          health_status: Database["public"]["Enums"]["health_status"]
          id: string
          photo_id: string
          quality_issues: string[] | null
          quality_passed: boolean | null
          raw_response: Json | null
          recommendations: string[] | null
        }
        Insert: {
          analyzed_at?: string
          confidence_score?: number | null
          created_at?: string
          damage_severity?: number | null
          damage_type?: Database["public"]["Enums"]["damage_type"] | null
          detected_crop_type?: Database["public"]["Enums"]["crop_type"] | null
          detected_stage?: Database["public"]["Enums"]["crop_stage"] | null
          gps_validated?: boolean | null
          health_score?: number | null
          health_status?: Database["public"]["Enums"]["health_status"]
          id?: string
          photo_id: string
          quality_issues?: string[] | null
          quality_passed?: boolean | null
          raw_response?: Json | null
          recommendations?: string[] | null
        }
        Update: {
          analyzed_at?: string
          confidence_score?: number | null
          created_at?: string
          damage_severity?: number | null
          damage_type?: Database["public"]["Enums"]["damage_type"] | null
          detected_crop_type?: Database["public"]["Enums"]["crop_type"] | null
          detected_stage?: Database["public"]["Enums"]["crop_stage"] | null
          gps_validated?: boolean | null
          health_score?: number | null
          health_status?: Database["public"]["Enums"]["health_status"]
          id?: string
          photo_id?: string
          quality_issues?: string[] | null
          quality_passed?: boolean | null
          raw_response?: Json | null
          recommendations?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_results_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: true
            referencedRelation: "crop_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_history: {
        Row: {
          content: string
          created_at: string
          farmer_id: string
          id: string
          image_url: string | null
          language: string | null
          message_type: string | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          farmer_id: string
          id?: string
          image_url?: string | null
          language?: string | null
          message_type?: string | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          farmer_id?: string
          id?: string
          image_url?: string | null
          language?: string | null
          message_type?: string | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_history_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      card_reports: {
        Row: {
          admin_notes: string | null
          card_id: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          card_id: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          card_id?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_reports_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "user_market_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      case_messages: {
        Row: {
          attachments: Json | null
          case_id: string
          created_at: string
          id: string
          is_internal_note: boolean
          message_text: string
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          attachments?: Json | null
          case_id: string
          created_at?: string
          id?: string
          is_internal_note?: boolean
          message_text: string
          sender_id?: string | null
          sender_type?: string
        }
        Update: {
          attachments?: Json | null
          case_id?: string
          created_at?: string
          id?: string
          is_internal_note?: boolean
          message_text?: string
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "diagnosis_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          ai_summary: Json | null
          assigned_expert_id: string | null
          channel: string | null
          created_at: string | null
          crop: string | null
          district: string | null
          farmer_id: string | null
          farmer_phone: string | null
          id: string
          priority: string | null
          problem_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_summary?: Json | null
          assigned_expert_id?: string | null
          channel?: string | null
          created_at?: string | null
          crop?: string | null
          district?: string | null
          farmer_id?: string | null
          farmer_phone?: string | null
          id?: string
          priority?: string | null
          problem_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_summary?: Json | null
          assigned_expert_id?: string | null
          channel?: string | null
          created_at?: string | null
          crop?: string | null
          district?: string | null
          farmer_id?: string | null
          farmer_phone?: string | null
          id?: string
          priority?: string | null
          problem_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_assigned_expert_id_fkey"
            columns: ["assigned_expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          background_image_url: string | null
          body_text_ne: string | null
          code: string
          created_at: string
          footer_ne: string | null
          id: string
          is_active: boolean | null
          signature_image_url: string | null
          subtitle_ne: string | null
          title_ne: string
          updated_at: string
        }
        Insert: {
          background_image_url?: string | null
          body_text_ne?: string | null
          code?: string
          created_at?: string
          footer_ne?: string | null
          id?: string
          is_active?: boolean | null
          signature_image_url?: string | null
          subtitle_ne?: string | null
          title_ne?: string
          updated_at?: string
        }
        Update: {
          background_image_url?: string | null
          body_text_ne?: string | null
          code?: string
          created_at?: string
          footer_ne?: string | null
          id?: string
          is_active?: boolean | null
          signature_image_url?: string | null
          subtitle_ne?: string | null
          title_ne?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_blocks: {
        Row: {
          active: boolean
          content: string
          content_type: string
          created_at: string
          id: string
          key: string
          language: string
          metadata: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          content: string
          content_type?: string
          created_at?: string
          id?: string
          key: string
          language?: string
          metadata?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          content?: string
          content_type?: string
          created_at?: string
          id?: string
          key?: string
          language?: string
          metadata?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description_ne: string | null
          id: string
          order_index: number | null
          title_ne: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description_ne?: string | null
          id?: string
          order_index?: number | null
          title_ne: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description_ne?: string | null
          id?: string
          order_index?: number | null
          title_ne?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description_ne: string | null
          display_order: number | null
          estimated_duration_min: number | null
          id: string
          is_published: boolean | null
          level_id: string | null
          target_crop_id: number | null
          thumbnail_url: string | null
          title_ne: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ne?: string | null
          display_order?: number | null
          estimated_duration_min?: number | null
          id?: string
          is_published?: boolean | null
          level_id?: string | null
          target_crop_id?: number | null
          thumbnail_url?: string | null
          title_ne: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ne?: string | null
          display_order?: number | null
          estimated_duration_min?: number | null
          id?: string
          is_published?: boolean | null
          level_id?: string | null
          target_crop_id?: number | null
          thumbnail_url?: string | null
          title_ne?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "learning_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_target_crop_id_fkey"
            columns: ["target_crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_activities: {
        Row: {
          activity_date: string
          activity_type: string
          cost_npr: number | null
          created_at: string
          crop_name: string
          crop_season_id: string | null
          id: string
          notes: string | null
          plot_id: string | null
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          cost_npr?: number | null
          created_at?: string
          crop_name: string
          crop_season_id?: string | null
          id?: string
          notes?: string | null
          plot_id?: string | null
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          cost_npr?: number | null
          created_at?: string
          crop_name?: string
          crop_season_id?: string | null
          id?: string
          notes?: string | null
          plot_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_activities_crop_season_id_fkey"
            columns: ["crop_season_id"]
            isOneToOne: false
            referencedRelation: "crop_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_activities_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_guides: {
        Row: {
          content: string
          content_ne: string | null
          created_at: string
          crop_id: number | null
          crop_name: string
          display_order: number | null
          id: string
          is_active: boolean
          is_published: boolean | null
          media_url: string | null
          published_at: string | null
          section: string
          step_number: number | null
          title: string
          title_ne: string | null
          updated_at: string
          version: number | null
        }
        Insert: {
          content: string
          content_ne?: string | null
          created_at?: string
          crop_id?: number | null
          crop_name: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          is_published?: boolean | null
          media_url?: string | null
          published_at?: string | null
          section: string
          step_number?: number | null
          title: string
          title_ne?: string | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          content?: string
          content_ne?: string | null
          created_at?: string
          crop_id?: number | null
          crop_name?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          is_published?: boolean | null
          media_url?: string | null
          published_at?: string | null
          section?: string
          step_number?: number | null
          title?: string
          title_ne?: string | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_guides_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_local_names: {
        Row: {
          created_at: string
          crop_id: number
          id: string
          local_name: string
          region_group: string | null
        }
        Insert: {
          created_at?: string
          crop_id: number
          id?: string
          local_name: string
          region_group?: string | null
        }
        Update: {
          created_at?: string
          crop_id?: number
          id?: string
          local_name?: string
          region_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_local_names_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_photos: {
        Row: {
          capture_stage: Database["public"]["Enums"]["crop_stage"]
          captured_at: string
          created_at: string
          farmer_id: string
          id: string
          image_url: string
          is_synced: boolean | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          plot_id: string
        }
        Insert: {
          capture_stage: Database["public"]["Enums"]["crop_stage"]
          captured_at?: string
          created_at?: string
          farmer_id: string
          id?: string
          image_url: string
          is_synced?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          plot_id: string
        }
        Update: {
          capture_stage?: Database["public"]["Enums"]["crop_stage"]
          captured_at?: string
          created_at?: string
          farmer_id?: string
          id?: string
          image_url?: string
          is_synced?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          plot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_photos_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_photos_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_recommendations: {
        Row: {
          created_at: string
          farmer_id: string
          id: string
          input_recommendations: Json | null
          language: string | null
          plot_id: string
          profit_margins: Json | null
          reasoning: string | null
          recommended_crops: Json
          soil_health_score: number | null
          sustainability_score: number | null
          yield_forecast: Json | null
        }
        Insert: {
          created_at?: string
          farmer_id: string
          id?: string
          input_recommendations?: Json | null
          language?: string | null
          plot_id: string
          profit_margins?: Json | null
          reasoning?: string | null
          recommended_crops: Json
          soil_health_score?: number | null
          sustainability_score?: number | null
          yield_forecast?: Json | null
        }
        Update: {
          created_at?: string
          farmer_id?: string
          id?: string
          input_recommendations?: Json | null
          language?: string | null
          plot_id?: string
          profit_margins?: Json | null
          reasoning?: string | null
          recommended_crops?: Json
          soil_health_score?: number | null
          sustainability_score?: number | null
          yield_forecast?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_recommendations_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_recommendations_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_seasons: {
        Row: {
          actual_yield: number | null
          created_at: string
          crop_name: string
          expected_yield: number | null
          field_id: string
          id: string
          is_active: boolean
          notes: string | null
          season_end_date: string | null
          season_start_date: string
          updated_at: string
          user_id: string
          variety: string | null
        }
        Insert: {
          actual_yield?: number | null
          created_at?: string
          crop_name: string
          expected_yield?: number | null
          field_id: string
          id?: string
          is_active?: boolean
          notes?: string | null
          season_end_date?: string | null
          season_start_date?: string
          updated_at?: string
          user_id: string
          variety?: string | null
        }
        Update: {
          actual_yield?: number | null
          created_at?: string
          crop_name?: string
          expected_yield?: number | null
          field_id?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          season_end_date?: string | null
          season_start_date?: string
          updated_at?: string
          user_id?: string
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_seasons_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_treatments: {
        Row: {
          best_season: string | null
          chemical_treatment: string | null
          chemical_treatment_ne: string | null
          cost_estimate: string | null
          created_at: string
          crop_name: string
          disease_or_pest_name: string
          disease_or_pest_name_ne: string | null
          display_order: number | null
          estimated_recovery_days: number | null
          id: string
          images: Json | null
          is_active: boolean | null
          organic_treatment: string | null
          organic_treatment_ne: string | null
          severity_level: string | null
          treatment_steps: Json
          treatment_steps_ne: Json | null
          treatment_title: string
          treatment_title_ne: string | null
          updated_at: string
          video_thumbnail_url: string | null
          youtube_video_url: string | null
        }
        Insert: {
          best_season?: string | null
          chemical_treatment?: string | null
          chemical_treatment_ne?: string | null
          cost_estimate?: string | null
          created_at?: string
          crop_name: string
          disease_or_pest_name: string
          disease_or_pest_name_ne?: string | null
          display_order?: number | null
          estimated_recovery_days?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          organic_treatment?: string | null
          organic_treatment_ne?: string | null
          severity_level?: string | null
          treatment_steps?: Json
          treatment_steps_ne?: Json | null
          treatment_title: string
          treatment_title_ne?: string | null
          updated_at?: string
          video_thumbnail_url?: string | null
          youtube_video_url?: string | null
        }
        Update: {
          best_season?: string | null
          chemical_treatment?: string | null
          chemical_treatment_ne?: string | null
          cost_estimate?: string | null
          created_at?: string
          crop_name?: string
          disease_or_pest_name?: string
          disease_or_pest_name_ne?: string | null
          display_order?: number | null
          estimated_recovery_days?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          organic_treatment?: string | null
          organic_treatment_ne?: string | null
          severity_level?: string | null
          treatment_steps?: Json
          treatment_steps_ne?: Json | null
          treatment_title?: string
          treatment_title_ne?: string | null
          updated_at?: string
          video_thumbnail_url?: string | null
          youtube_video_url?: string | null
        }
        Relationships: []
      }
      crops: {
        Row: {
          category: string | null
          created_at: string
          display_order: number | null
          id: number
          image_source: Database["public"]["Enums"]["crop_image_source"] | null
          image_url: string | null
          image_url_ai_suggested: string | null
          image_url_uploaded: string | null
          is_active: boolean | null
          name_en: string
          name_hi: string | null
          name_ne: string
          needs_image_review: boolean | null
          region_group: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: number
          image_source?: Database["public"]["Enums"]["crop_image_source"] | null
          image_url?: string | null
          image_url_ai_suggested?: string | null
          image_url_uploaded?: string | null
          is_active?: boolean | null
          name_en: string
          name_hi?: string | null
          name_ne: string
          needs_image_review?: boolean | null
          region_group?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: number
          image_source?: Database["public"]["Enums"]["crop_image_source"] | null
          image_url?: string | null
          image_url_ai_suggested?: string | null
          image_url_uploaded?: string | null
          is_active?: boolean | null
          name_en?: string
          name_hi?: string | null
          name_ne?: string
          needs_image_review?: boolean | null
          region_group?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_mandi_prices: {
        Row: {
          arrival_qty: number | null
          created_at: string
          crop_id: number | null
          date: string
          id: string
          last_synced_at: string | null
          mandi_id: number | null
          price_max: number | null
          price_min: number | null
          price_modal: number | null
          source: string | null
          source_ref: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          arrival_qty?: number | null
          created_at?: string
          crop_id?: number | null
          date?: string
          id?: string
          last_synced_at?: string | null
          mandi_id?: number | null
          price_max?: number | null
          price_min?: number | null
          price_modal?: number | null
          source?: string | null
          source_ref?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          arrival_qty?: number | null
          created_at?: string
          crop_id?: number | null
          date?: string
          id?: string
          last_synced_at?: string | null
          mandi_id?: number | null
          price_max?: number | null
          price_min?: number | null
          price_modal?: number | null
          source?: string | null
          source_ref?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_mandi_prices_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_mandi_prices_mandi_id_fkey"
            columns: ["mandi_id"]
            isOneToOne: false
            referencedRelation: "india_mandis"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_market_products: {
        Row: {
          created_at: string
          crop_id: number | null
          crop_name: string
          crop_name_ne: string | null
          date: string
          district: string | null
          district_id_fk: number | null
          id: string
          image_url: string | null
          last_synced_at: string | null
          local_level_id: number | null
          market_name: string | null
          market_name_ne: string | null
          price_avg: number | null
          price_max: number | null
          price_min: number | null
          province_id: number | null
          source: string | null
          source_ref: string | null
          unit: string
          updated_at: string
          ward_number: number | null
        }
        Insert: {
          created_at?: string
          crop_id?: number | null
          crop_name: string
          crop_name_ne?: string | null
          date?: string
          district?: string | null
          district_id_fk?: number | null
          id?: string
          image_url?: string | null
          last_synced_at?: string | null
          local_level_id?: number | null
          market_name?: string | null
          market_name_ne?: string | null
          price_avg?: number | null
          price_max?: number | null
          price_min?: number | null
          province_id?: number | null
          source?: string | null
          source_ref?: string | null
          unit?: string
          updated_at?: string
          ward_number?: number | null
        }
        Update: {
          created_at?: string
          crop_id?: number | null
          crop_name?: string
          crop_name_ne?: string | null
          date?: string
          district?: string | null
          district_id_fk?: number | null
          id?: string
          image_url?: string | null
          last_synced_at?: string | null
          local_level_id?: number | null
          market_name?: string | null
          market_name_ne?: string | null
          price_avg?: number | null
          price_max?: number | null
          price_min?: number | null
          province_id?: number | null
          source?: string | null
          source_ref?: string | null
          unit?: string
          updated_at?: string
          ward_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_market_products_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_market_products_district_id_fk_fkey"
            columns: ["district_id_fk"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_market_products_local_level_id_fkey"
            columns: ["local_level_id"]
            isOneToOne: false
            referencedRelation: "local_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_market_products_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_requests: {
        Row: {
          buyer_id: string
          buyer_notes: string | null
          card_id: string
          created_at: string
          delivery_address_text: string
          id: string
          requested_price: number | null
          requested_quantity: number
          seller_notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          buyer_notes?: string | null
          card_id: string
          created_at?: string
          delivery_address_text: string
          id?: string
          requested_price?: number | null
          requested_quantity: number
          seller_notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          buyer_notes?: string | null
          card_id?: string
          created_at?: string
          delivery_address_text?: string
          id?: string
          requested_price?: number | null
          requested_quantity?: number
          seller_notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_requests_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "user_market_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_shipments: {
        Row: {
          carrier_code: string | null
          created_at: string
          delivery_request_id: string
          id: string
          last_event_time: string | null
          last_location_text: string | null
          raw_payload: Json | null
          status: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          carrier_code?: string | null
          created_at?: string
          delivery_request_id: string
          id?: string
          last_event_time?: string | null
          last_location_text?: string | null
          raw_payload?: Json | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          carrier_code?: string | null
          created_at?: string
          delivery_request_id?: string
          id?: string
          last_event_time?: string | null
          last_location_text?: string | null
          raw_payload?: Json | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_shipments_delivery_request_id_fkey"
            columns: ["delivery_request_id"]
            isOneToOne: false
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosis_case_images: {
        Row: {
          angle_type: Database["public"]["Enums"]["diagnosis_angle_type"] | null
          case_id: string
          created_at: string
          id: string
          image_url: string
        }
        Insert: {
          angle_type?:
            | Database["public"]["Enums"]["diagnosis_angle_type"]
            | null
          case_id: string
          created_at?: string
          id?: string
          image_url: string
        }
        Update: {
          angle_type?:
            | Database["public"]["Enums"]["diagnosis_angle_type"]
            | null
          case_id?: string
          created_at?: string
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnosis_case_images_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "diagnosis_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosis_cases: {
        Row: {
          assigned_expert_id: string | null
          case_status: Database["public"]["Enums"]["diagnosis_case_status"]
          channel: string | null
          closed_at: string | null
          created_at: string
          crop_id: number | null
          farmer_question: string | null
          first_response_at: string | null
          id: string
          location_district_id: number | null
          location_province_id: number | null
          priority: string | null
          problem_type: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_expert_id?: string | null
          case_status?: Database["public"]["Enums"]["diagnosis_case_status"]
          channel?: string | null
          closed_at?: string | null
          created_at?: string
          crop_id?: number | null
          farmer_question?: string | null
          first_response_at?: string | null
          id?: string
          location_district_id?: number | null
          location_province_id?: number | null
          priority?: string | null
          problem_type?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_expert_id?: string | null
          case_status?: Database["public"]["Enums"]["diagnosis_case_status"]
          channel?: string | null
          closed_at?: string | null
          created_at?: string
          crop_id?: number | null
          farmer_question?: string | null
          first_response_at?: string | null
          id?: string
          location_district_id?: number | null
          location_province_id?: number | null
          priority?: string | null
          problem_type?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnosis_cases_assigned_expert_id_fkey"
            columns: ["assigned_expert_id"]
            isOneToOne: false
            referencedRelation: "agricultural_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosis_cases_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosis_cases_location_district_id_fkey"
            columns: ["location_district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosis_cases_location_province_id_fkey"
            columns: ["location_province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosis_suggestions: {
        Row: {
          advice_text: string | null
          case_id: string
          confidence_level: number | null
          created_at: string
          created_by_expert_id: string | null
          id: string
          is_final: boolean
          language_code: string | null
          source_type: Database["public"]["Enums"]["diagnosis_source_type"]
          suspected_problem: string | null
        }
        Insert: {
          advice_text?: string | null
          case_id: string
          confidence_level?: number | null
          created_at?: string
          created_by_expert_id?: string | null
          id?: string
          is_final?: boolean
          language_code?: string | null
          source_type: Database["public"]["Enums"]["diagnosis_source_type"]
          suspected_problem?: string | null
        }
        Update: {
          advice_text?: string | null
          case_id?: string
          confidence_level?: number | null
          created_at?: string
          created_by_expert_id?: string | null
          id?: string
          is_final?: boolean
          language_code?: string | null
          source_type?: Database["public"]["Enums"]["diagnosis_source_type"]
          suspected_problem?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnosis_suggestions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "diagnosis_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      disease_detections: {
        Row: {
          analyzed_at: string
          confidence_score: number | null
          created_at: string
          detected_disease: string | null
          farmer_id: string
          id: string
          image_url: string
          language: string | null
          plot_id: string | null
          prevention_tips: string[] | null
          severity: string | null
          treatment_recommendations: Json | null
        }
        Insert: {
          analyzed_at?: string
          confidence_score?: number | null
          created_at?: string
          detected_disease?: string | null
          farmer_id: string
          id?: string
          image_url: string
          language?: string | null
          plot_id?: string | null
          prevention_tips?: string[] | null
          severity?: string | null
          treatment_recommendations?: Json | null
        }
        Update: {
          analyzed_at?: string
          confidence_score?: number | null
          created_at?: string
          detected_disease?: string | null
          farmer_id?: string
          id?: string
          image_url?: string
          language?: string | null
          plot_id?: string | null
          prevention_tips?: string[] | null
          severity?: string | null
          treatment_recommendations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "disease_detections_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disease_detections_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      disease_outbreak_alerts: {
        Row: {
          affected_crops: string[] | null
          created_at: string
          detection_count: number
          disease_name: string
          district: string
          first_detected_at: string
          id: string
          is_active: boolean
          last_detected_at: string
          severity: string
          state: string
          updated_at: string
        }
        Insert: {
          affected_crops?: string[] | null
          created_at?: string
          detection_count?: number
          disease_name: string
          district: string
          first_detected_at?: string
          id?: string
          is_active?: boolean
          last_detected_at?: string
          severity?: string
          state: string
          updated_at?: string
        }
        Update: {
          affected_crops?: string[] | null
          created_at?: string
          detection_count?: number
          disease_name?: string
          district?: string
          first_detected_at?: string
          id?: string
          is_active?: boolean
          last_detected_at?: string
          severity?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      districts: {
        Row: {
          created_at: string
          display_order: number | null
          id: number
          is_major: boolean | null
          name_en: string
          name_ne: string
          province_id: number
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: number
          is_major?: boolean | null
          name_en: string
          name_ne: string
          province_id: number
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: number
          is_major?: boolean | null
          name_en?: string
          name_ne?: string
          province_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "districts_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      email_settings: {
        Row: {
          body_template: string
          created_at: string
          enabled: boolean
          event_type: string
          id: string
          subject_template: string
          updated_at: string
        }
        Insert: {
          body_template: string
          created_at?: string
          enabled?: boolean
          event_type: string
          id?: string
          subject_template: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          created_at?: string
          enabled?: boolean
          event_type?: string
          id?: string
          subject_template?: string
          updated_at?: string
        }
        Relationships: []
      }
      expert_ticket_messages: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          message_text: string | null
          sender_id: string | null
          sender_type: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          message_text?: string | null
          sender_id?: string | null
          sender_type?: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          message_text?: string | null
          sender_id?: string | null
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "expert_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_tickets: {
        Row: {
          created_at: string
          crop_name: string
          farmer_id: string
          farmer_phone: string | null
          has_unread_farmer: boolean
          has_unread_technician: boolean
          id: string
          office_id: string
          problem_description: string
          problem_title: string
          status: string
          technician_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          crop_name: string
          farmer_id: string
          farmer_phone?: string | null
          has_unread_farmer?: boolean
          has_unread_technician?: boolean
          id?: string
          office_id: string
          problem_description: string
          problem_title: string
          status?: string
          technician_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          crop_name?: string
          farmer_id?: string
          farmer_phone?: string | null
          has_unread_farmer?: boolean
          has_unread_technician?: boolean
          id?: string
          office_id?: string
          problem_description?: string
          problem_title?: string
          status?: string
          technician_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_tickets_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "ag_offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_tickets_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      experts: {
        Row: {
          created_at: string | null
          crops: string[] | null
          districts: string[] | null
          email: string | null
          id: string
          max_open_cases: number | null
          name: string
          phone: string
          problem_types: string[] | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          crops?: string[] | null
          districts?: string[] | null
          email?: string | null
          id?: string
          max_open_cases?: number | null
          name: string
          phone: string
          problem_types?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          crops?: string[] | null
          districts?: string[] | null
          email?: string | null
          id?: string
          max_open_cases?: number | null
          name?: string
          phone?: string
          problem_types?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      farmer_notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          farmer_id: string
          id: string
          outbreak_alerts: boolean
          push_enabled: boolean
          push_subscription: Json | null
          sms_enabled: boolean
          updated_at: string
          weather_alerts: boolean
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          farmer_id: string
          id?: string
          outbreak_alerts?: boolean
          push_enabled?: boolean
          push_subscription?: Json | null
          sms_enabled?: boolean
          updated_at?: string
          weather_alerts?: boolean
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          farmer_id?: string
          id?: string
          outbreak_alerts?: boolean
          push_enabled?: boolean
          push_subscription?: Json | null
          sms_enabled?: boolean
          updated_at?: string
          weather_alerts?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "farmer_notification_preferences_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: true
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farmer_notifications: {
        Row: {
          created_at: string
          data: Json | null
          farmer_id: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          farmer_id: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          farmer_id?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "farmer_notifications_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farmer_profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          district: string | null
          full_name: string
          id: string
          irrigation_type: string | null
          land_record_id: string | null
          land_size_hectares: number | null
          main_crops: string[] | null
          phone: string | null
          pmfby_enrollment_id: string | null
          preferred_language: string | null
          state: string | null
          updated_at: string
          user_id: string
          village: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          full_name: string
          id?: string
          irrigation_type?: string | null
          land_record_id?: string | null
          land_size_hectares?: number | null
          main_crops?: string[] | null
          phone?: string | null
          pmfby_enrollment_id?: string | null
          preferred_language?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          village?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          full_name?: string
          id?: string
          irrigation_type?: string | null
          land_record_id?: string | null
          land_size_hectares?: number | null
          main_crops?: string[] | null
          phone?: string | null
          pmfby_enrollment_id?: string | null
          preferred_language?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          village?: string | null
        }
        Relationships: []
      }
      fields: {
        Row: {
          area: number | null
          area_unit: string
          created_at: string
          district: string | null
          id: string
          latitude: number | null
          longitude: number | null
          municipality: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: number | null
          area_unit?: string
          created_at?: string
          district?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: number | null
          area_unit?: string
          created_at?: string
          district?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      guide_rules: {
        Row: {
          created_at: string | null
          crop_id: number
          guide_tag: string
          id: string
          is_active: boolean | null
          priority: number | null
          problem_type: string | null
          severity: string | null
          stage: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          crop_id: number
          guide_tag: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          problem_type?: string | null
          severity?: string | null
          stage?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          crop_id?: number
          guide_tag?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          problem_type?: string | null
          severity?: string | null
          stage?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_rules_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      india_districts: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          lgd_code: string | null
          name_en: string
          name_hi: string
          state_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          lgd_code?: string | null
          name_en: string
          name_hi: string
          state_id: number
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          lgd_code?: string | null
          name_en?: string
          name_hi?: string
          state_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "india_districts_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "india_states"
            referencedColumns: ["id"]
          },
        ]
      }
      india_mandis: {
        Row: {
          created_at: string
          district_id: number
          id: number
          is_active: boolean
          lat: number | null
          lng: number | null
          mandi_code: string | null
          name_en: string
          name_hi: string
          source: string | null
        }
        Insert: {
          created_at?: string
          district_id: number
          id?: number
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          mandi_code?: string | null
          name_en: string
          name_hi: string
          source?: string | null
        }
        Update: {
          created_at?: string
          district_id?: number
          id?: number
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          mandi_code?: string | null
          name_en?: string
          name_hi?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "india_mandis_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "india_districts"
            referencedColumns: ["id"]
          },
        ]
      }
      india_states: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          name_en: string
          name_hi: string
          state_code: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          name_en: string
          name_hi: string
          state_code?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          name_en?: string
          name_hi?: string
          state_code?: string | null
        }
        Relationships: []
      }
      learning_levels: {
        Row: {
          code: string
          created_at: string
          description_ne: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          title_ne: string
        }
        Insert: {
          code: string
          created_at?: string
          description_ne?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          title_ne: string
        }
        Update: {
          code?: string
          created_at?: string
          description_ne?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          title_ne?: string
        }
        Relationships: []
      }
      lesson_quizzes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          lesson_id: string
          max_attempts: number | null
          pass_score: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          lesson_id: string
          max_attempts?: number | null
          pass_score?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          lesson_id?: string
          max_attempts?: number | null
          pass_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_ne: string | null
          content_type: string | null
          created_at: string
          estimated_duration_min: number | null
          id: string
          is_published: boolean | null
          media_url: string | null
          module_id: string
          order_index: number | null
          title_ne: string
        }
        Insert: {
          content_ne?: string | null
          content_type?: string | null
          created_at?: string
          estimated_duration_min?: number | null
          id?: string
          is_published?: boolean | null
          media_url?: string | null
          module_id: string
          order_index?: number | null
          title_ne: string
        }
        Update: {
          content_ne?: string | null
          content_type?: string | null
          created_at?: string
          estimated_duration_min?: number | null
          id?: string
          is_published?: boolean | null
          media_url?: string | null
          module_id?: string
          order_index?: number | null
          title_ne?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_contacts: {
        Row: {
          contact_type: string
          contacted_at: string
          contactor_id: string | null
          id: string
          listing_id: string
        }
        Insert: {
          contact_type?: string
          contacted_at?: string
          contactor_id?: string | null
          id?: string
          listing_id: string
        }
        Update: {
          contact_type?: string
          contacted_at?: string
          contactor_id?: string | null
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_contacts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "produce_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_views: {
        Row: {
          id: string
          listing_id: string
          session_id: string | null
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          listing_id: string
          session_id?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          listing_id?: string
          session_id?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_views_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "produce_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      local_levels: {
        Row: {
          created_at: string
          display_order: number | null
          district_id: number
          id: number
          name_en: string
          name_ne: string
          total_wards: number | null
          type: Database["public"]["Enums"]["local_level_type"]
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          district_id: number
          id?: number
          name_en: string
          name_ne: string
          total_wards?: number | null
          type?: Database["public"]["Enums"]["local_level_type"]
        }
        Update: {
          created_at?: string
          display_order?: number | null
          district_id?: number
          id?: number
          name_en?: string
          name_ne?: string
          total_wards?: number | null
          type?: Database["public"]["Enums"]["local_level_type"]
        }
        Relationships: [
          {
            foreignKeyName: "local_levels_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      market_prices: {
        Row: {
          created_at: string
          crop_type: Database["public"]["Enums"]["crop_type"]
          data_source: string | null
          demand_level: string | null
          district: string | null
          fetched_at: string
          id: string
          mandi_name: string | null
          price_date: string
          price_per_quintal: number | null
          state: string
        }
        Insert: {
          created_at?: string
          crop_type: Database["public"]["Enums"]["crop_type"]
          data_source?: string | null
          demand_level?: string | null
          district?: string | null
          fetched_at?: string
          id?: string
          mandi_name?: string | null
          price_date: string
          price_per_quintal?: number | null
          state: string
        }
        Update: {
          created_at?: string
          crop_type?: Database["public"]["Enums"]["crop_type"]
          data_source?: string | null
          demand_level?: string | null
          district?: string | null
          fetched_at?: string
          id?: string
          mandi_name?: string | null
          price_date?: string
          price_per_quintal?: number | null
          state?: string
        }
        Relationships: []
      }
      markets: {
        Row: {
          address: string | null
          address_ne: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          district_id: number | null
          id: string
          is_active: boolean
          is_major: boolean | null
          latitude: number | null
          local_level_id: number | null
          longitude: number | null
          market_code: string | null
          market_type: string
          name_en: string
          name_ne: string
          popular_products: string[] | null
          province_id: number | null
          updated_at: string
          ward_number: number | null
        }
        Insert: {
          address?: string | null
          address_ne?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          district_id?: number | null
          id?: string
          is_active?: boolean
          is_major?: boolean | null
          latitude?: number | null
          local_level_id?: number | null
          longitude?: number | null
          market_code?: string | null
          market_type?: string
          name_en: string
          name_ne: string
          popular_products?: string[] | null
          province_id?: number | null
          updated_at?: string
          ward_number?: number | null
        }
        Update: {
          address?: string | null
          address_ne?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          district_id?: number | null
          id?: string
          is_active?: boolean
          is_major?: boolean | null
          latitude?: number | null
          local_level_id?: number | null
          longitude?: number | null
          market_code?: string | null
          market_type?: string
          name_en?: string
          name_ne?: string
          popular_products?: string[] | null
          province_id?: number | null
          updated_at?: string
          ward_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "markets_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markets_local_level_id_fkey"
            columns: ["local_level_id"]
            isOneToOne: false
            referencedRelation: "local_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markets_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      officer_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          farmer_id: string
          farmer_phone: string | null
          id: string
          notes: string | null
          officer_id: string
          purpose: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          farmer_id: string
          farmer_phone?: string | null
          id?: string
          notes?: string | null
          officer_id: string
          purpose: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          farmer_id?: string
          farmer_phone?: string | null
          id?: string
          notes?: string | null
          officer_id?: string
          purpose?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "officer_appointments_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "officer_appointments_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "agricultural_officers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_npr: number
          created_at: string
          esewa_ref_id: string | null
          id: string
          plan_id: string | null
          raw_payload: Json | null
          status: string
          transaction_uuid: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_npr: number
          created_at?: string
          esewa_ref_id?: string | null
          id?: string
          plan_id?: string | null
          raw_payload?: Json | null
          status?: string
          transaction_uuid: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_npr?: number
          created_at?: string
          esewa_ref_id?: string | null
          id?: string
          plan_id?: string | null
          raw_payload?: Json | null
          status?: string
          transaction_uuid?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_reports: {
        Row: {
          created_at: string
          crop_type: string | null
          detected_issue: string | null
          farmer_id: string
          file_url: string | null
          id: string
          metadata: Json | null
          plot_id: string | null
          report_type: string
          severity: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          crop_type?: string | null
          detected_issue?: string | null
          farmer_id: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          plot_id?: string | null
          report_type?: string
          severity?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          crop_type?: string | null
          detected_issue?: string | null
          farmer_id?: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          plot_id?: string | null
          report_type?: string
          severity?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_reports_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_reports_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      plots: {
        Row: {
          area_hectares: number | null
          created_at: string
          crop_type: Database["public"]["Enums"]["crop_type"]
          district: string | null
          expected_harvest_date: string | null
          farmer_id: string
          id: string
          insurance_sum: number | null
          latitude: number | null
          longitude: number | null
          plot_name: string
          pmfby_insured: boolean | null
          season: string | null
          sowing_date: string | null
          state: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          area_hectares?: number | null
          created_at?: string
          crop_type: Database["public"]["Enums"]["crop_type"]
          district?: string | null
          expected_harvest_date?: string | null
          farmer_id: string
          id?: string
          insurance_sum?: number | null
          latitude?: number | null
          longitude?: number | null
          plot_name: string
          pmfby_insured?: boolean | null
          season?: string | null
          sowing_date?: string | null
          state?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          area_hectares?: number | null
          created_at?: string
          crop_type?: Database["public"]["Enums"]["crop_type"]
          district?: string | null
          expected_harvest_date?: string | null
          farmer_id?: string
          id?: string
          insurance_sum?: number | null
          latitude?: number | null
          longitude?: number | null
          plot_name?: string
          pmfby_insured?: boolean | null
          season?: string | null
          sowing_date?: string | null
          state?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plots_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prevention_tips: {
        Row: {
          created_at: string
          crop: string | null
          detailed_tip: string | null
          id: string
          season: string | null
          short_tip: string
        }
        Insert: {
          created_at?: string
          crop?: string | null
          detailed_tip?: string | null
          id?: string
          season?: string | null
          short_tip: string
        }
        Update: {
          created_at?: string
          crop?: string | null
          detailed_tip?: string | null
          id?: string
          season?: string | null
          short_tip?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          condition_type: Database["public"]["Enums"]["price_alert_condition"]
          created_at: string
          crop_id: number | null
          district_id: number | null
          id: string
          is_active: boolean
          is_recurring: boolean
          last_triggered_at: string | null
          local_level_id: number | null
          market_code: string | null
          percent_reference_days: number | null
          province_id: number | null
          threshold_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          condition_type: Database["public"]["Enums"]["price_alert_condition"]
          created_at?: string
          crop_id?: number | null
          district_id?: number | null
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          last_triggered_at?: string | null
          local_level_id?: number | null
          market_code?: string | null
          percent_reference_days?: number | null
          province_id?: number | null
          threshold_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          condition_type?: Database["public"]["Enums"]["price_alert_condition"]
          created_at?: string
          crop_id?: number | null
          district_id?: number | null
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          last_triggered_at?: string | null
          local_level_id?: number | null
          market_code?: string | null
          percent_reference_days?: number | null
          province_id?: number | null
          threshold_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_alerts_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_alerts_local_level_id_fkey"
            columns: ["local_level_id"]
            isOneToOne: false
            referencedRelation: "local_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_alerts_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      produce_listings: {
        Row: {
          contact_phone: string | null
          created_at: string
          crop_name: string
          district: string | null
          expected_price: number | null
          farmer_id: string | null
          id: string
          image_urls: string[] | null
          is_active: boolean
          municipality: string | null
          notes: string | null
          quantity: number
          unit: string
          updated_at: string
          user_id: string
          variety: string | null
        }
        Insert: {
          contact_phone?: string | null
          created_at?: string
          crop_name: string
          district?: string | null
          expected_price?: number | null
          farmer_id?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean
          municipality?: string | null
          notes?: string | null
          quantity: number
          unit?: string
          updated_at?: string
          user_id: string
          variety?: string | null
        }
        Update: {
          contact_phone?: string | null
          created_at?: string
          crop_name?: string
          district?: string | null
          expected_price?: number | null
          farmer_id?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean
          municipality?: string | null
          notes?: string | null
          quantity?: number
          unit?: string
          updated_at?: string
          user_id?: string
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produce_listings_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provinces: {
        Row: {
          created_at: string
          display_order: number | null
          id: number
          name_en: string
          name_ne: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: number
          name_en: string
          name_ne: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: number
          name_en?: string
          name_ne?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers_json: Json | null
          attempt_number: number | null
          completed_at: string | null
          id: string
          is_passed: boolean | null
          quiz_id: string
          score: number | null
          started_at: string
          total_questions: number | null
          user_id: string
        }
        Insert: {
          answers_json?: Json | null
          attempt_number?: number | null
          completed_at?: string | null
          id?: string
          is_passed?: boolean | null
          quiz_id: string
          score?: number | null
          started_at?: string
          total_questions?: number | null
          user_id: string
        }
        Update: {
          answers_json?: Json | null
          attempt_number?: number | null
          completed_at?: string | null
          id?: string
          is_passed?: boolean | null
          quiz_id?: string
          score?: number | null
          started_at?: string
          total_questions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "lesson_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_options: {
        Row: {
          id: string
          is_correct: boolean | null
          option_text_ne: string
          order_index: number | null
          question_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean | null
          option_text_ne: string
          order_index?: number | null
          question_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean | null
          option_text_ne?: string
          order_index?: number | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          id: string
          order_index: number | null
          question_text_ne: string
          question_type: string | null
          quiz_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number | null
          question_text_ne: string
          question_type?: string | null
          quiz_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number | null
          question_text_ne?: string
          question_type?: string | null
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "lesson_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      soil_data: {
        Row: {
          created_at: string
          data_source: string | null
          fetched_at: string
          id: string
          moisture_percentage: number | null
          nitrogen_level: number | null
          organic_carbon: number | null
          ph_level: number | null
          phosphorus_level: number | null
          plot_id: string
          potassium_level: number | null
          soil_type: string | null
        }
        Insert: {
          created_at?: string
          data_source?: string | null
          fetched_at?: string
          id?: string
          moisture_percentage?: number | null
          nitrogen_level?: number | null
          organic_carbon?: number | null
          ph_level?: number | null
          phosphorus_level?: number | null
          plot_id: string
          potassium_level?: number | null
          soil_type?: string | null
        }
        Update: {
          created_at?: string
          data_source?: string | null
          fetched_at?: string
          id?: string
          moisture_percentage?: number | null
          nitrogen_level?: number | null
          organic_carbon?: number | null
          ph_level?: number | null
          phosphorus_level?: number | null
          plot_id?: string
          potassium_level?: number | null
          soil_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soil_data_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      soil_tests: {
        Row: {
          created_at: string
          ec: number | null
          field_id: string
          id: string
          lab_name: string | null
          nitrogen_level: number | null
          notes: string | null
          organic_matter_percent: number | null
          ph: number | null
          phosphorus_level: number | null
          potassium_level: number | null
          sample_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ec?: number | null
          field_id: string
          id?: string
          lab_name?: string | null
          nitrogen_level?: number | null
          notes?: string | null
          organic_matter_percent?: number | null
          ph?: number | null
          phosphorus_level?: number | null
          potassium_level?: number | null
          sample_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ec?: number | null
          field_id?: string
          id?: string
          lab_name?: string | null
          nitrogen_level?: number | null
          notes?: string | null
          organic_matter_percent?: number | null
          ph?: number | null
          phosphorus_level?: number | null
          potassium_level?: number | null
          sample_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "soil_tests_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          ai_call_limit: number | null
          created_at: string
          currency: string
          description: string | null
          description_ne: string | null
          display_order: number
          esewa_product_code: string | null
          features: Json | null
          id: string
          is_active: boolean
          is_visible: boolean
          name: string
          name_ne: string | null
          pdf_report_limit: number | null
          plan_type: string
          price: number
          updated_at: string
        }
        Insert: {
          ai_call_limit?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          description_ne?: string | null
          display_order?: number
          esewa_product_code?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          is_visible?: boolean
          name: string
          name_ne?: string | null
          pdf_report_limit?: number | null
          plan_type: string
          price?: number
          updated_at?: string
        }
        Update: {
          ai_call_limit?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          description_ne?: string | null
          display_order?: number
          esewa_product_code?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          is_visible?: boolean
          name?: string
          name_ne?: string | null
          pdf_report_limit?: number | null
          plan_type?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      technicians: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_expert: boolean
          is_primary: boolean
          name: string
          office_id: string
          phone: string | null
          role_title: string
          specialization: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_expert?: boolean
          is_primary?: boolean
          name: string
          office_id: string
          phone?: string | null
          role_title?: string
          specialization?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_expert?: boolean
          is_primary?: boolean
          name?: string
          office_id?: string
          phone?: string | null
          role_title?: string
          specialization?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technicians_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "ag_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          attachments: Json | null
          case_id: string | null
          created_at: string | null
          id: string
          message: string | null
          sender_type: string | null
        }
        Insert: {
          attachments?: Json | null
          case_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          sender_type?: string | null
        }
        Update: {
          attachments?: Json | null
          case_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          sender_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      training_documents: {
        Row: {
          created_at: string
          file_url: string
          id: string
          is_active: boolean | null
          language: string | null
          source_org: string | null
          title: string
          title_ne: string | null
          uploaded_by_admin_id: string | null
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          is_active?: boolean | null
          language?: string | null
          source_org?: string | null
          title: string
          title_ne?: string | null
          uploaded_by_admin_id?: string | null
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          is_active?: boolean | null
          language?: string | null
          source_org?: string | null
          title?: string
          title_ne?: string | null
          uploaded_by_admin_id?: string | null
        }
        Relationships: []
      }
      user_certificates: {
        Row: {
          certificate_number: string
          course_id: string
          file_url: string | null
          id: string
          issued_at: string
          meta_json: Json | null
          template_id: string | null
          user_id: string
        }
        Insert: {
          certificate_number: string
          course_id: string
          file_url?: string | null
          id?: string
          issued_at?: string
          meta_json?: Json | null
          template_id?: string | null
          user_id: string
        }
        Update: {
          certificate_number?: string
          course_id?: string
          file_url?: string | null
          id?: string
          issued_at?: string
          meta_json?: Json | null
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          id: string
          is_completed: boolean | null
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          id?: string
          is_completed?: boolean | null
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          id?: string
          is_completed?: boolean | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          admin_notes: string | null
          comment_text: string | null
          created_at: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id: string
          metadata_json: Json | null
          rating: number | null
          status: Database["public"]["Enums"]["feedback_status"]
          target_id: string | null
          target_type: Database["public"]["Enums"]["feedback_target_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          comment_text?: string | null
          created_at?: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id?: string
          metadata_json?: Json | null
          rating?: number | null
          status?: Database["public"]["Enums"]["feedback_status"]
          target_id?: string | null
          target_type: Database["public"]["Enums"]["feedback_target_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          comment_text?: string | null
          created_at?: string
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          metadata_json?: Json | null
          rating?: number | null
          status?: Database["public"]["Enums"]["feedback_status"]
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["feedback_target_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_lesson_status: {
        Row: {
          completed_at: string | null
          id: string
          is_completed: boolean | null
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_status_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_market_cards: {
        Row: {
          available_quantity: number | null
          card_type: string
          contact_phone: string | null
          created_at: string
          crop_id: number | null
          description: string | null
          district_id: number | null
          expires_at: string | null
          id: string
          images: string[] | null
          is_active: boolean
          lat: number | null
          lng: number | null
          local_level_id: number | null
          price: number | null
          price_max: number | null
          price_min: number | null
          price_type: string
          province_id: number | null
          title: string
          unit: string
          updated_at: string
          user_id: string
          ward_number: number | null
          whatsapp: string | null
        }
        Insert: {
          available_quantity?: number | null
          card_type?: string
          contact_phone?: string | null
          created_at?: string
          crop_id?: number | null
          description?: string | null
          district_id?: number | null
          expires_at?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          local_level_id?: number | null
          price?: number | null
          price_max?: number | null
          price_min?: number | null
          price_type?: string
          province_id?: number | null
          title: string
          unit?: string
          updated_at?: string
          user_id: string
          ward_number?: number | null
          whatsapp?: string | null
        }
        Update: {
          available_quantity?: number | null
          card_type?: string
          contact_phone?: string | null
          created_at?: string
          crop_id?: number | null
          description?: string | null
          district_id?: number | null
          expires_at?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          local_level_id?: number | null
          price?: number | null
          price_max?: number | null
          price_min?: number | null
          price_type?: string
          province_id?: number | null
          title?: string
          unit?: string
          updated_at?: string
          user_id?: string
          ward_number?: number | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_market_cards_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_market_cards_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_market_cards_local_level_id_fkey"
            columns: ["local_level_id"]
            isOneToOne: false
            referencedRelation: "local_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_market_cards_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          queries_limit: number
          queries_used: number
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          queries_limit?: number
          queries_used?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          queries_limit?: number
          queries_used?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wards: {
        Row: {
          created_at: string
          id: number
          local_level_id: number
          ward_number: number
        }
        Insert: {
          created_at?: string
          id?: number
          local_level_id: number
          ward_number: number
        }
        Update: {
          created_at?: string
          id?: number
          local_level_id?: number
          ward_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "wards_local_level_id_fkey"
            columns: ["local_level_id"]
            isOneToOne: false
            referencedRelation: "local_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_alert_settings: {
        Row: {
          created_at: string
          enable_cold_alert: boolean
          enable_heat_alert: boolean
          enable_rain_alert: boolean
          enable_spray_alert: boolean
          enable_weather_alerts: boolean
          id: string
          preferred_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enable_cold_alert?: boolean
          enable_heat_alert?: boolean
          enable_rain_alert?: boolean
          enable_spray_alert?: boolean
          enable_weather_alerts?: boolean
          id?: string
          preferred_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enable_cold_alert?: boolean
          enable_heat_alert?: boolean
          enable_rain_alert?: boolean
          enable_spray_alert?: boolean
          enable_weather_alerts?: boolean
          id?: string
          preferred_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weather_alerts: {
        Row: {
          alert_type: string
          created_at: string
          date_sent: string
          id: string
          is_read: boolean
          message: string
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          date_sent?: string
          id?: string
          is_read?: boolean
          message: string
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          date_sent?: string
          id?: string
          is_read?: boolean
          message?: string
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      weather_data: {
        Row: {
          created_at: string
          data_source: string | null
          fetched_at: string
          forecast_date: string
          humidity: number | null
          id: string
          latitude: number
          longitude: number
          plot_id: string | null
          rainfall_mm: number | null
          temperature: number | null
          wind_speed: number | null
        }
        Insert: {
          created_at?: string
          data_source?: string | null
          fetched_at?: string
          forecast_date: string
          humidity?: number | null
          id?: string
          latitude: number
          longitude: number
          plot_id?: string | null
          rainfall_mm?: number | null
          temperature?: number | null
          wind_speed?: number | null
        }
        Update: {
          created_at?: string
          data_source?: string | null
          fetched_at?: string
          forecast_date?: string
          humidity?: number | null
          id?: string
          latitude?: number
          longitude?: number
          plot_id?: string | null
          rainfall_mm?: number | null
          temperature?: number | null
          wind_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_data_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_link_technician_by_email: {
        Args: { p_email: string; p_user_id: string }
        Returns: Json
      }
      auto_route_case: { Args: { p_case_id: string }; Returns: undefined }
      auto_route_ticket: { Args: { p_case_id: string }; Returns: undefined }
      can_user_query: { Args: { p_user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_query_count: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "farmer" | "field_official" | "authority" | "insurer"
      crop_image_source: "ai" | "admin_upload" | "external" | "none"
      crop_stage:
        | "sowing"
        | "early_vegetative"
        | "vegetative"
        | "flowering"
        | "grain_filling"
        | "maturity"
        | "harvest"
      crop_type:
        | "wheat"
        | "rice"
        | "cotton"
        | "sugarcane"
        | "maize"
        | "soybean"
        | "groundnut"
        | "mustard"
        | "other"
      damage_type:
        | "waterlogging"
        | "drought"
        | "lodging"
        | "pest"
        | "disease"
        | "hail"
        | "frost"
        | "other"
        | "none"
      diagnosis_angle_type:
        | "leaf_closeup"
        | "plant_full"
        | "fruit"
        | "stem"
        | "other"
      diagnosis_case_status:
        | "new"
        | "ai_suggested"
        | "expert_pending"
        | "expert_answered"
        | "closed"
      diagnosis_source_type: "rule_engine" | "ai_model" | "human_expert"
      feedback_status:
        | "pending"
        | "seen"
        | "in_progress"
        | "resolved"
        | "dismissed"
      feedback_target_type:
        | "market_price"
        | "guide"
        | "screen"
        | "feature"
        | "app"
        | "other"
      feedback_type:
        | "price_accuracy"
        | "guide_usefulness"
        | "app_experience"
        | "bug_report"
        | "feature_request"
      health_status:
        | "healthy"
        | "mild_stress"
        | "moderate_stress"
        | "severe_damage"
        | "pending"
      local_level_type:
        | "metropolitan"
        | "sub_metropolitan"
        | "municipality"
        | "rural_municipality"
      price_alert_condition:
        | "greater_equal"
        | "less_equal"
        | "percent_increase"
        | "percent_decrease"
      subscription_plan: "free" | "monthly" | "yearly"
      subscription_status: "active" | "expired" | "cancelled"
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
      app_role: ["admin", "farmer", "field_official", "authority", "insurer"],
      crop_image_source: ["ai", "admin_upload", "external", "none"],
      crop_stage: [
        "sowing",
        "early_vegetative",
        "vegetative",
        "flowering",
        "grain_filling",
        "maturity",
        "harvest",
      ],
      crop_type: [
        "wheat",
        "rice",
        "cotton",
        "sugarcane",
        "maize",
        "soybean",
        "groundnut",
        "mustard",
        "other",
      ],
      damage_type: [
        "waterlogging",
        "drought",
        "lodging",
        "pest",
        "disease",
        "hail",
        "frost",
        "other",
        "none",
      ],
      diagnosis_angle_type: [
        "leaf_closeup",
        "plant_full",
        "fruit",
        "stem",
        "other",
      ],
      diagnosis_case_status: [
        "new",
        "ai_suggested",
        "expert_pending",
        "expert_answered",
        "closed",
      ],
      diagnosis_source_type: ["rule_engine", "ai_model", "human_expert"],
      feedback_status: [
        "pending",
        "seen",
        "in_progress",
        "resolved",
        "dismissed",
      ],
      feedback_target_type: [
        "market_price",
        "guide",
        "screen",
        "feature",
        "app",
        "other",
      ],
      feedback_type: [
        "price_accuracy",
        "guide_usefulness",
        "app_experience",
        "bug_report",
        "feature_request",
      ],
      health_status: [
        "healthy",
        "mild_stress",
        "moderate_stress",
        "severe_damage",
        "pending",
      ],
      local_level_type: [
        "metropolitan",
        "sub_metropolitan",
        "municipality",
        "rural_municipality",
      ],
      price_alert_condition: [
        "greater_equal",
        "less_equal",
        "percent_increase",
        "percent_decrease",
      ],
      subscription_plan: ["free", "monthly", "yearly"],
      subscription_status: ["active", "expired", "cancelled"],
    },
  },
} as const
