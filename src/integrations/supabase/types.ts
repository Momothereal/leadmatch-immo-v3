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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      leads: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string
          desired_city: string | null
          desired_features: Json | null
          desired_postal_code: string | null
          desired_property_type:
            | Database["public"]["Enums"]["property_type"]
            | null
          desired_rooms_min: number | null
          desired_surface_min: number | null
          desired_transaction_type:
            | Database["public"]["Enums"]["lead_transaction_type"]
            | null
          email: string | null
          financing: Database["public"]["Enums"]["lead_financing"] | null
          first_name: string
          id: string
          is_shared: boolean
          last_name: string
          notes: string | null
          phone: string | null
          timeline: Database["public"]["Enums"]["lead_timeline"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          desired_city?: string | null
          desired_features?: Json | null
          desired_postal_code?: string | null
          desired_property_type?:
            | Database["public"]["Enums"]["property_type"]
            | null
          desired_rooms_min?: number | null
          desired_surface_min?: number | null
          desired_transaction_type?:
            | Database["public"]["Enums"]["lead_transaction_type"]
            | null
          email?: string | null
          financing?: Database["public"]["Enums"]["lead_financing"] | null
          first_name: string
          id?: string
          is_shared?: boolean
          last_name: string
          notes?: string | null
          phone?: string | null
          timeline?: Database["public"]["Enums"]["lead_timeline"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          desired_city?: string | null
          desired_features?: Json | null
          desired_postal_code?: string | null
          desired_property_type?:
            | Database["public"]["Enums"]["property_type"]
            | null
          desired_rooms_min?: number | null
          desired_surface_min?: number | null
          desired_transaction_type?:
            | Database["public"]["Enums"]["lead_transaction_type"]
            | null
          email?: string | null
          financing?: Database["public"]["Enums"]["lead_financing"] | null
          first_name?: string
          id?: string
          is_shared?: boolean
          last_name?: string
          notes?: string | null
          phone?: string | null
          timeline?: Database["public"]["Enums"]["lead_timeline"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          property_id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          property_id: string
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          property_id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          bedrooms: number | null
          city: string | null
          created_at: string
          description: string | null
          dpe_rating: string | null
          features: Json | null
          id: string
          is_shared: boolean
          neighborhood: string | null
          postal_code: string | null
          price: number | null
          property_type: Database["public"]["Enums"]["property_type"]
          rooms: number | null
          surface_m2: number | null
          title: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          dpe_rating?: string | null
          features?: Json | null
          id?: string
          is_shared?: boolean
          neighborhood?: string | null
          postal_code?: string | null
          price?: number | null
          property_type?: Database["public"]["Enums"]["property_type"]
          rooms?: number | null
          surface_m2?: number | null
          title: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          dpe_rating?: string | null
          features?: Json | null
          id?: string
          is_shared?: boolean
          neighborhood?: string | null
          postal_code?: string | null
          price?: number | null
          property_type?: Database["public"]["Enums"]["property_type"]
          rooms?: number | null
          surface_m2?: number | null
          title?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      lead_financing:
        | "approved"
        | "in_progress"
        | "not_started"
        | "cash"
        | "unknown"
      lead_timeline:
        | "immediate"
        | "1-3months"
        | "3-6months"
        | "6-12months"
        | "exploring"
      lead_transaction_type: "buy" | "rent"
      property_type: "apartment" | "house" | "land" | "commercial" | "other"
      transaction_type: "sale" | "rent"
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
      lead_financing: [
        "approved",
        "in_progress",
        "not_started",
        "cash",
        "unknown",
      ],
      lead_timeline: [
        "immediate",
        "1-3months",
        "3-6months",
        "6-12months",
        "exploring",
      ],
      lead_transaction_type: ["buy", "rent"],
      property_type: ["apartment", "house", "land", "commercial", "other"],
      transaction_type: ["sale", "rent"],
    },
  },
} as const
