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
      farmer_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          district: string | null
          full_name: string
          id: string
          land_record_id: string | null
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
          land_record_id?: string | null
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
          land_record_id?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
    },
  },
} as const
