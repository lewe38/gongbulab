export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: number
          page_context: Json | null
          role: Database["public"]["Enums"]["chat_role"]
          thread_id: number
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          page_context?: Json | null
          role: Database["public"]["Enums"]["chat_role"]
          thread_id: number
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          page_context?: Json | null
          role?: Database["public"]["Enums"]["chat_role"]
          thread_id?: number
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: number
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_usage: {
        Row: {
          message_count: number
          month: string
          tokens_total: number
          user_id: string
        }
        Insert: {
          message_count?: number
          month: string
          tokens_total?: number
          user_id: string
        }
        Update: {
          message_count?: number
          month?: string
          tokens_total?: number
          user_id?: string
        }
        Relationships: []
      }
      example_translations: {
        Row: {
          example_id: number
          locale: string
          translation: string
        }
        Insert: {
          example_id: number
          locale: string
          translation: string
        }
        Update: {
          example_id?: number
          locale?: string
          translation?: string
        }
        Relationships: [
          {
            foreignKeyName: "example_translations_example_id_fkey"
            columns: ["example_id"]
            isOneToOne: false
            referencedRelation: "examples"
            referencedColumns: ["id"]
          },
        ]
      }
      examples: {
        Row: {
          grammar_point_id: number
          id: number
          korean: string
          order_in_point: number
          romanization: string | null
        }
        Insert: {
          grammar_point_id: number
          id?: number
          korean: string
          order_in_point: number
          romanization?: string | null
        }
        Update: {
          grammar_point_id?: number
          id?: number
          korean?: string
          order_in_point?: number
          romanization?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "examples_grammar_point_id_fkey"
            columns: ["grammar_point_id"]
            isOneToOne: false
            referencedRelation: "grammar_points"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_points: {
        Row: {
          created_at: string
          form_notes: string | null
          id: number
          lesson_id: number
          order_in_lesson: number
          title_ko: string
          title_translit: string | null
        }
        Insert: {
          created_at?: string
          form_notes?: string | null
          id?: number
          lesson_id: number
          order_in_lesson: number
          title_ko: string
          title_translit?: string | null
        }
        Update: {
          created_at?: string
          form_notes?: string | null
          id?: number
          lesson_id?: number
          order_in_lesson?: number
          title_ko?: string
          title_translit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grammar_points_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_translations: {
        Row: {
          explanation: string
          grammar_point_id: number
          locale: string
          notes: string | null
          summary: string
        }
        Insert: {
          explanation: string
          grammar_point_id: number
          locale: string
          notes?: string | null
          summary: string
        }
        Update: {
          explanation?: string
          grammar_point_id?: number
          locale?: string
          notes?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_translations_grammar_point_id_fkey"
            columns: ["grammar_point_id"]
            isOneToOne: false
            referencedRelation: "grammar_points"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_translations: {
        Row: {
          dialogue: string | null
          lesson_id: number
          locale: string
          title: string
        }
        Insert: {
          dialogue?: string | null
          lesson_id: number
          locale: string
          title: string
        }
        Update: {
          dialogue?: string | null
          lesson_id?: number
          locale?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_translations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          id: number
          level: number
          section_number: number
          source_pdf: string | null
          title_ko: string
          unit_number: number
        }
        Insert: {
          created_at?: string
          id?: number
          level: number
          section_number: number
          source_pdf?: string | null
          title_ko: string
          unit_number: number
        }
        Update: {
          created_at?: string
          id?: number
          level?: number
          section_number?: number
          source_pdf?: string | null
          title_ko?: string
          unit_number?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_level: number
          display_name: string | null
          interface_lang: string
          plan: Database["public"]["Enums"]["user_plan"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: number
          display_name?: string | null
          interface_lang?: string
          plan?: Database["public"]["Enums"]["user_plan"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: number
          display_name?: string | null
          interface_lang?: string
          plan?: Database["public"]["Enums"]["user_plan"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      srs_cards: {
        Row: {
          created_at: string
          difficulty: number
          due_at: string
          id: number
          lapses: number
          last_review_at: string | null
          reps: number
          stability: number
          state: Database["public"]["Enums"]["srs_state"]
          user_id: string
          word_id: number
        }
        Insert: {
          created_at?: string
          difficulty?: number
          due_at?: string
          id?: number
          lapses?: number
          last_review_at?: string | null
          reps?: number
          stability?: number
          state?: Database["public"]["Enums"]["srs_state"]
          user_id: string
          word_id: number
        }
        Update: {
          created_at?: string
          difficulty?: number
          due_at?: string
          id?: number
          lapses?: number
          last_review_at?: string | null
          reps?: number
          stability?: number
          state?: Database["public"]["Enums"]["srs_state"]
          user_id?: string
          word_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "srs_cards_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      srs_reviews: {
        Row: {
          card_id: number
          difficulty_after: number | null
          difficulty_before: number | null
          id: number
          rating: Database["public"]["Enums"]["srs_rating"]
          reviewed_at: string
          stability_after: number | null
          stability_before: number | null
          time_taken_ms: number | null
          user_id: string
        }
        Insert: {
          card_id: number
          difficulty_after?: number | null
          difficulty_before?: number | null
          id?: number
          rating: Database["public"]["Enums"]["srs_rating"]
          reviewed_at?: string
          stability_after?: number | null
          stability_before?: number | null
          time_taken_ms?: number | null
          user_id: string
        }
        Update: {
          card_id?: number
          difficulty_after?: number | null
          difficulty_before?: number | null
          id?: number
          rating?: Database["public"]["Enums"]["srs_rating"]
          reviewed_at?: string
          stability_after?: number | null
          stability_before?: number | null
          time_taken_ms?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "srs_reviews_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "srs_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          current_period_end: string | null
          plan: Database["public"]["Enums"]["user_plan"]
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      word_translations: {
        Row: {
          example_korean: string | null
          example_translation: string | null
          locale: string
          translation: string
          word_id: number
        }
        Insert: {
          example_korean?: string | null
          example_translation?: string | null
          locale: string
          translation: string
          word_id: number
        }
        Update: {
          example_korean?: string | null
          example_translation?: string | null
          locale?: string
          translation?: string
          word_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "word_translations_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      words: {
        Row: {
          created_at: string
          hangeul: string
          id: number
          level: number
          part_of_speech: string | null
          romanization: string | null
          source_lesson_id: number | null
        }
        Insert: {
          created_at?: string
          hangeul: string
          id?: number
          level: number
          part_of_speech?: string | null
          romanization?: string | null
          source_lesson_id?: number | null
        }
        Update: {
          created_at?: string
          hangeul?: string
          id?: number
          level?: number
          part_of_speech?: string | null
          romanization?: string | null
          source_lesson_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "words_source_lesson_id_fkey"
            columns: ["source_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      chat_role: "user" | "assistant" | "system"
      srs_rating: "again" | "hard" | "good" | "easy"
      srs_state: "new" | "learning" | "review" | "relearning"
      user_plan: "free" | "premium"
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
      chat_role: ["user", "assistant", "system"],
      srs_rating: ["again", "hard", "good", "easy"],
      srs_state: ["new", "learning", "review", "relearning"],
      user_plan: ["free", "premium"],
    },
  },
} as const

