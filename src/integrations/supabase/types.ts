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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      courses: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string | null
          estimated_duration: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          tags: string[] | null
          thumbnail: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_duration?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          tags?: string[] | null
          thumbnail?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_duration?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          tags?: string[] | null
          thumbnail?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hackathon_scores: {
        Row: {
          comments: string | null
          design_score: number
          id: string
          innovation_score: number
          judge_id: string
          presentation_score: number
          scored_at: string
          submission_id: string
          technical_score: number
        }
        Insert: {
          comments?: string | null
          design_score?: number
          id?: string
          innovation_score?: number
          judge_id: string
          presentation_score?: number
          scored_at?: string
          submission_id: string
          technical_score?: number
        }
        Update: {
          comments?: string | null
          design_score?: number
          id?: string
          innovation_score?: number
          judge_id?: string
          presentation_score?: number
          scored_at?: string
          submission_id?: string
          technical_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_scores_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "hackathon_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_submissions: {
        Row: {
          demo_url: string | null
          github_url: string | null
          hackathon_id: string
          id: string
          project_description: string | null
          project_name: string
          submitted_at: string
          team_id: string
          tech_stack: string[] | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          demo_url?: string | null
          github_url?: string | null
          hackathon_id: string
          id?: string
          project_description?: string | null
          project_name: string
          submitted_at?: string
          team_id: string
          tech_stack?: string[] | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          demo_url?: string | null
          github_url?: string | null
          hackathon_id?: string
          id?: string
          project_description?: string | null
          project_name?: string
          submitted_at?: string
          team_id?: string
          tech_stack?: string[] | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_submissions_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hackathon_submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "hackathon_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_teams: {
        Row: {
          created_at: string
          description: string | null
          hackathon_id: string
          id: string
          leader_id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hackathon_id: string
          id?: string
          leader_id: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hackathon_id?: string
          id?: string
          leader_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_teams_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathons: {
        Row: {
          banner_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          is_published: boolean | null
          max_team_size: number
          min_team_size: number
          prizes: string | null
          registration_deadline: string | null
          rules: string | null
          short_description: string | null
          start_date: string
          status: string
          themes: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_published?: boolean | null
          max_team_size?: number
          min_team_size?: number
          prizes?: string | null
          registration_deadline?: string | null
          rules?: string | null
          short_description?: string | null
          start_date: string
          status?: string
          themes?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_published?: boolean | null
          max_team_size?: number
          min_team_size?: number
          prizes?: string | null
          registration_deadline?: string | null
          rules?: string | null
          short_description?: string | null
          start_date?: string
          status?: string
          themes?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_completions: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          id: string
          lesson_order: number | null
          module_name: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          id?: string
          lesson_order?: number | null
          module_name?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_order?: number | null
          module_name?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      problems: {
        Row: {
          constraints: string | null
          created_at: string
          created_by: string | null
          difficulty: string | null
          id: string
          is_published: boolean | null
          memory_limit: string | null
          points: number | null
          sample_input: string | null
          sample_output: string | null
          statement: string
          tags: string[] | null
          time_limit: string | null
          title: string
        }
        Insert: {
          constraints?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          id?: string
          is_published?: boolean | null
          memory_limit?: string | null
          points?: number | null
          sample_input?: string | null
          sample_output?: string | null
          statement: string
          tags?: string[] | null
          time_limit?: string | null
          title: string
        }
        Update: {
          constraints?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          id?: string
          is_published?: boolean | null
          memory_limit?: string | null
          points?: number | null
          sample_input?: string | null
          sample_output?: string | null
          statement?: string
          tags?: string[] | null
          time_limit?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          attempted_at: string
          id: string
          is_correct: boolean
          quiz_id: string
          selected_answer: string
          user_id: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          is_correct?: boolean
          quiz_id: string
          selected_answer: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          id?: string
          is_correct?: boolean
          quiz_id?: string
          selected_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          answer: string
          course_id: string
          created_at: string
          id: string
          marks: number | null
          module_name: string | null
          options: string[]
          question: string
        }
        Insert: {
          answer: string
          course_id: string
          created_at?: string
          id?: string
          marks?: number | null
          module_name?: string | null
          options?: string[]
          question: string
        }
        Update: {
          answer?: string
          course_id?: string
          created_at?: string
          id?: string
          marks?: number | null
          module_name?: string | null
          options?: string[]
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          code: string
          id: string
          language: string
          problem_id: string
          status: string | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          code: string
          id?: string
          language: string
          problem_id: string
          status?: string | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          code?: string
          id?: string
          language?: string
          problem_id?: string
          status?: string | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "hackathon_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_courses: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          progress_percentage: number | null
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          progress_percentage?: number | null
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          progress_percentage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
