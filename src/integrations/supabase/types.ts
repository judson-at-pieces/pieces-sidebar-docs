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
      admin_access_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      doc_content: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      github_config: {
        Row: {
          created_at: string
          created_by: string
          id: string
          installation_id: number | null
          repo_name: string
          repo_owner: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          installation_id?: number | null
          repo_name: string
          repo_owner: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          installation_id?: number | null
          repo_name?: string
          repo_owner?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_github_config_installation"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "github_installations"
            referencedColumns: ["installation_id"]
          },
        ]
      }
      github_installations: {
        Row: {
          account_login: string
          account_type: string
          created_at: string
          id: string
          installation_id: number
          installed_at: string
          updated_at: string
        }
        Insert: {
          account_login: string
          account_type: string
          created_at?: string
          id?: string
          installation_id: number
          installed_at?: string
          updated_at?: string
        }
        Update: {
          account_login?: string
          account_type?: string
          created_at?: string
          id?: string
          installation_id?: number
          installed_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_editing_sessions: {
        Row: {
          branch_name: string | null
          content: string
          created_at: string
          file_path: string
          id: string
          locked_at: string | null
          locked_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_name?: string | null
          content: string
          created_at?: string
          file_path: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_name?: string | null
          content?: string
          created_at?: string
          file_path?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      live_typing_sessions: {
        Row: {
          content: string | null
          cursor_position: number | null
          file_path: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          cursor_position?: number | null
          file_path: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          cursor_position?: number | null
          file_path?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      navigation_items: {
        Row: {
          created_at: string
          description: string | null
          file_path: string | null
          href: string
          icon: string | null
          id: string
          is_active: boolean
          is_auto_generated: boolean
          order_index: number
          parent_id: string | null
          section_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          href: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_auto_generated?: boolean
          order_index?: number
          parent_id?: string | null
          section_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          href?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_auto_generated?: boolean
          order_index?: number
          parent_id?: string | null
          section_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigation_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "navigation_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_sections: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          order_index: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acquire_file_lock: {
        Args: { p_file_path: string; p_user_id: string }
        Returns: boolean
      }
      acquire_file_lock_by_branch: {
        Args: { p_file_path: string; p_user_id: string; p_branch_name: string }
        Returns: boolean
      }
      generate_admin_access_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_github_config: {
        Args: Record<PropertyKey, never>
        Returns: {
          repo_owner: string
          repo_name: string
          installation_id: number
        }[]
      }
      get_live_editing_sessions: {
        Args: Record<PropertyKey, never>
        Returns: {
          file_path: string
          content: string
          locked_by_email: string
          locked_by_name: string
          locked_at: string
          updated_at: string
        }[]
      }
      get_live_editing_sessions_by_branch: {
        Args: { branch_name: string }
        Returns: {
          file_path: string
          content: string
          locked_by_email: string
          locked_by_name: string
          locked_at: string
          updated_at: string
        }[]
      }
      get_navigation_structure: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      release_file_lock: {
        Args: { p_file_path: string; p_user_id: string }
        Returns: boolean
      }
      release_file_lock_by_branch: {
        Args: { p_file_path: string; p_user_id: string; p_branch_name: string }
        Returns: boolean
      }
      save_live_content: {
        Args: { p_file_path: string; p_content: string; p_user_id: string }
        Returns: boolean
      }
      save_live_content_by_branch: {
        Args: {
          p_file_path: string
          p_content: string
          p_user_id: string
          p_branch_name: string
        }
        Returns: boolean
      }
      sync_navigation_from_content: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      use_admin_access_code: {
        Args: { access_code: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "user"],
    },
  },
} as const
