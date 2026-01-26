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
      agricultural_officers: {
        Row: {
          alternate_phone: string | null
          created_at: string
          designation: string
          designation_ne: string | null
          district: string
          email: string | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          latitude: number | null
          longitude: number | null
          municipality: string | null
          name: string
          name_ne: string | null
          office_address: string | null
          office_address_ne: string | null
          office_name: string | null
          office_name_ne: string | null
          phone: string | null
          profile_image_url: string | null
          province: string
          specializations: string[] | null
          updated_at: string
          ward_no: number | null
          working_hours: string | null
        }
        Insert: {
          alternate_phone?: string | null
          created_at?: string
          designation?: string
          designation_ne?: string | null
          district: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          name: string
          name_ne?: string | null
          office_address?: string | null
          office_address_ne?: string | null
          office_name?: string | null
          office_name_ne?: string | null
          phone?: string | null
          profile_image_url?: string | null
          province: string
          specializations?: string[] | null
          updated_at?: string
          ward_no?: number | null
          working_hours?: string | null
        }
        Update: {
          alternate_phone?: string | null
          created_at?: string
          designation?: string
          designation_ne?: string | null
          district?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          name?: string
          name_ne?: string | null
          office_address?: string | null
          office_address_ne?: string | null
          office_name?: string | null
          office_name_ne?: string | null
          phone?: string | null
          profile_image_url?: string | null
          province?: string
          specializations?: string[] | null
          updated_at?: string
          ward_no?: number | null
          working_hours?: string | null
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
      health_status:
        | "healthy"
        | "mild_stress"
        | "moderate_stress"
        | "severe_damage"
        | "pending"
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
      health_status: [
        "healthy",
        "mild_stress",
        "moderate_stress",
        "severe_damage",
        "pending",
      ],
      subscription_plan: ["free", "monthly", "yearly"],
      subscription_status: ["active", "expired", "cancelled"],
    },
  },
} as const
