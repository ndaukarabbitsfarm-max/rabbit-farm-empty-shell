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
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          last_message_at: string
          product_id: string | null
          seller_id: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          product_id?: string | null
          seller_id: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          product_id?: string | null
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          created_at: string
          farm_photo_paths: string[]
          id: string
          id_document_path: string
          kind: Database["public"]["Enums"]["verification_kind"]
          notes: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_photo_paths?: string[]
          id?: string
          id_document_path: string
          kind?: Database["public"]["Enums"]["verification_kind"]
          notes?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          farm_photo_paths?: string[]
          id?: string
          id_document_path?: string
          kind?: Database["public"]["Enums"]["verification_kind"]
          notes?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          city: string | null
          created_at: string
          id: string
          region: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          region: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          region?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_per_unit_tzs: number
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_per_unit_tzs?: number
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_per_unit_tzs?: number
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string
          delivery_city: string | null
          delivery_region: string | null
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          seller_id: string
          shipping_address: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_tzs: number
          transport_cost_tzs: number
          unit_price_tzs: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          delivery_city?: string | null
          delivery_region?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          seller_id: string
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_tzs?: number
          transport_cost_tzs?: number
          unit_price_tzs?: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          delivery_city?: string | null
          delivery_region?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          seller_id?: string
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_tzs?: number
          transport_cost_tzs?: number
          unit_price_tzs?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          path: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          user_id?: string | null
        }
        Relationships: []
      }
      price_tiers: {
        Row: {
          created_at: string
          id: string
          min_qty: number
          price_tzs: number
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_qty: number
          price_tzs: number
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          min_qty?: number
          price_tzs?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          product_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          product_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          product_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_comments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          breed: string | null
          category_slug: string
          city: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          media_urls: string[]
          moq: number
          pedigree_verified: boolean
          price_tzs: number
          quantity: number
          region: string | null
          seller_id: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          vaccination_records: string | null
          whatsapp: string | null
        }
        Insert: {
          breed?: string | null
          category_slug: string
          city?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          media_urls?: string[]
          moq?: number
          pedigree_verified?: boolean
          price_tzs?: number
          quantity?: number
          region?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          vaccination_records?: string | null
          whatsapp?: string | null
        }
        Update: {
          breed?: string | null
          category_slug?: string
          city?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          media_urls?: string[]
          moq?: number
          pedigree_verified?: boolean
          price_tzs?: number
          quantity?: number
          region?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          vaccination_records?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved: boolean
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          region: string | null
          role: Database["public"]["Enums"]["user_kind"]
          suspended: boolean
          updated_at: string
          verification_kind:
            | Database["public"]["Enums"]["verification_kind"]
            | null
          verified: boolean
          whatsapp: string | null
        }
        Insert: {
          approved?: boolean
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_kind"]
          suspended?: boolean
          updated_at?: string
          verification_kind?:
            | Database["public"]["Enums"]["verification_kind"]
            | null
          verified?: boolean
          whatsapp?: string | null
        }
        Update: {
          approved?: boolean
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_kind"]
          suspended?: boolean
          updated_at?: string
          verification_kind?:
            | Database["public"]["Enums"]["verification_kind"]
            | null
          verified?: boolean
          whatsapp?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          product_id: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          product_id?: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          product_id?: string | null
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string
          product_id: string
          rating: number
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          rating: number
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          rating?: number
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_requests: {
        Row: {
          buyer_id: string
          category_slug: string
          contact_phone: string
          created_at: string
          details: string | null
          id: string
          quantity: number
          region: string | null
          status: string
          target_price_tzs: number | null
          title: string
          unit: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          category_slug: string
          contact_phone: string
          created_at?: string
          details?: string | null
          id?: string
          quantity?: number
          region?: string | null
          status?: string
          target_price_tzs?: number | null
          title: string
          unit?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          category_slug?: string
          contact_phone?: string
          created_at?: string
          details?: string | null
          id?: string
          quantity?: number
          region?: string | null
          status?: string
          target_price_tzs?: number | null
          title?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_likes: {
        Row: {
          created_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      video_posts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          product_id: string | null
          seller_id: string
          updated_at: string
          video_path: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          seller_id: string
          updated_at?: string
          video_path: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          seller_id?: string
          updated_at?: string
          video_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_posts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_stats: {
        Args: never
        Returns: {
          total_products: number
          total_users: number
          total_views: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_page_view: { Args: { _path: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      kyc_status: "pending" | "approved" | "rejected"
      listing_status: "pending" | "approved" | "rejected"
      order_status:
        | "requested"
        | "accepted"
        | "in_transit"
        | "completed"
        | "cancelled"
      report_status: "open" | "reviewed" | "actioned"
      user_kind: "buyer" | "seller"
      verification_kind: "breeder" | "builder"
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
      app_role: ["admin", "moderator", "user"],
      kyc_status: ["pending", "approved", "rejected"],
      listing_status: ["pending", "approved", "rejected"],
      order_status: [
        "requested",
        "accepted",
        "in_transit",
        "completed",
        "cancelled",
      ],
      report_status: ["open", "reviewed", "actioned"],
      user_kind: ["buyer", "seller"],
      verification_kind: ["breeder", "builder"],
    },
  },
} as const
