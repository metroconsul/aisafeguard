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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admission_documents: {
        Row: {
          admission_id: string
          created_at: string | null
          doc_type: string
          feedback_rh: string | null
          file_url: string
          id: string
          status: string
        }
        Insert: {
          admission_id: string
          created_at?: string | null
          doc_type: string
          feedback_rh?: string | null
          file_url: string
          id?: string
          status?: string
        }
        Update: {
          admission_id?: string
          created_at?: string | null
          doc_type?: string
          feedback_rh?: string | null
          file_url?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "admission_documents_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admission_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      admission_requests: {
        Row: {
          candidate_cpf: string | null
          candidate_name: string
          candidate_phone: string | null
          created_at: string | null
          empresa_id: string
          id: string
          status: string
          token: string
        }
        Insert: {
          candidate_cpf?: string | null
          candidate_name: string
          candidate_phone?: string | null
          created_at?: string | null
          empresa_id: string
          id?: string
          status?: string
          token?: string
        }
        Update: {
          candidate_cpf?: string | null
          candidate_name?: string
          candidate_phone?: string | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admission_requests_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          aso_type: string | null
          created_at: string | null
          doc_category: string
          empresa_id: string
          expiration_date: string | null
          file_url: string | null
          funcionario_id: string | null
          health_status: string | null
          id: string
          issue_date: string | null
          notification_status: string | null
          provider_or_lead: string | null
          reference_period: string | null
          signature_ip: string | null
          signature_status: string
          signed_at: string | null
          title: string
          workload_hours: number | null
          worksite: string | null
          zapsign_token: string | null
        }
        Insert: {
          aso_type?: string | null
          created_at?: string | null
          doc_category?: string
          empresa_id: string
          expiration_date?: string | null
          file_url?: string | null
          funcionario_id?: string | null
          health_status?: string | null
          id?: string
          issue_date?: string | null
          notification_status?: string | null
          provider_or_lead?: string | null
          reference_period?: string | null
          signature_ip?: string | null
          signature_status?: string
          signed_at?: string | null
          title: string
          workload_hours?: number | null
          worksite?: string | null
          zapsign_token?: string | null
        }
        Update: {
          aso_type?: string | null
          created_at?: string | null
          doc_category?: string
          empresa_id?: string
          expiration_date?: string | null
          file_url?: string | null
          funcionario_id?: string | null
          health_status?: string | null
          id?: string
          issue_date?: string | null
          notification_status?: string | null
          provider_or_lead?: string | null
          reference_period?: string | null
          signature_ip?: string | null
          signature_status?: string
          signed_at?: string | null
          title?: string
          workload_hours?: number | null
          worksite?: string | null
          zapsign_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          cnpj: string
          created_at: string | null
          id: string
          logo_url: string | null
          nome_fantasia: string
        }
        Insert: {
          cnpj: string
          created_at?: string | null
          id?: string
          logo_url?: string | null
          nome_fantasia: string
        }
        Update: {
          cnpj?: string
          created_at?: string | null
          id?: string
          logo_url?: string | null
          nome_fantasia?: string
        }
        Relationships: []
      }
      entregas: {
        Row: {
          created_at: string | null
          data_entrega: string | null
          data_vencimento: string
          empresa_id: string | null
          epi_id: string
          foto_assinatura: string | null
          funcionario_id: string
          id: string
          imagem_assinatura: string | null
          status_assinatura: string | null
        }
        Insert: {
          created_at?: string | null
          data_entrega?: string | null
          data_vencimento: string
          empresa_id?: string | null
          epi_id: string
          foto_assinatura?: string | null
          funcionario_id: string
          id?: string
          imagem_assinatura?: string | null
          status_assinatura?: string | null
        }
        Update: {
          created_at?: string | null
          data_entrega?: string | null
          data_vencimento?: string
          empresa_id?: string | null
          epi_id?: string
          foto_assinatura?: string | null
          funcionario_id?: string
          id?: string
          imagem_assinatura?: string | null
          status_assinatura?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entregas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_epi_id_fkey"
            columns: ["epi_id"]
            isOneToOne: false
            referencedRelation: "epis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_solicitacoes: {
        Row: {
          created_at: string | null
          empresa_id: string
          epi_id: string
          funcionario_id: string
          id: string
          motivo: string
          status: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          epi_id: string
          funcionario_id: string
          id?: string
          motivo: string
          status?: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          epi_id?: string
          funcionario_id?: string
          id?: string
          motivo?: string
          status?: string
        }
        Relationships: []
      }
      epis: {
        Row: {
          created_at: string | null
          dias_validade: number
          empresa_id: string | null
          id: string
          nome_equipamento: string
          numero_ca: string
          quantidade_estoque: number | null
        }
        Insert: {
          created_at?: string | null
          dias_validade: number
          empresa_id?: string | null
          id?: string
          nome_equipamento: string
          numero_ca: string
          quantidade_estoque?: number | null
        }
        Update: {
          created_at?: string | null
          dias_validade?: number
          empresa_id?: string | null
          id?: string
          nome_equipamento?: string
          numero_ca?: string
          quantidade_estoque?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "epis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          access_pin: string | null
          cargo: string
          cpf: string | null
          created_at: string | null
          empresa_id: string | null
          id: string
          matricula: string
          nome: string
          setor: string
          setor_id: string | null
          status: string
          telefone_whatsapp: string | null
        }
        Insert: {
          access_pin?: string | null
          cargo: string
          cpf?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          matricula: string
          nome: string
          setor: string
          setor_id?: string | null
          status?: string
          telefone_whatsapp?: string | null
        }
        Update: {
          access_pin?: string | null
          cargo?: string
          cpf?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          matricula?: string
          nome?: string
          setor?: string
          setor_id?: string | null
          status?: string
          telefone_whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      integracao_whatsapp: {
        Row: {
          created_at: string
          email: string | null
          empresa_id: string
          id: string
          instance_id: string | null
          instancia: string | null
          nome: string
          numero: string
          status: string | null
          updated_at: string
          vinculado_em: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          empresa_id: string
          id?: string
          instance_id?: string | null
          instancia?: string | null
          nome: string
          numero: string
          status?: string | null
          updated_at?: string
          vinculado_em?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          empresa_id?: string
          id?: string
          instance_id?: string | null
          instancia?: string | null
          nome?: string
          numero?: string
          status?: string | null
          updated_at?: string
          vinculado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integracao_whatsapp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          lida: boolean
          mensagem: string
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          lida?: boolean
          mensagem: string
          tipo?: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          lida?: boolean
          mensagem?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          created_at: string | null
          email: string | null
          empresa_id: string
          id: string
          nome_completo: string
          role: string
          senha_temporaria: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          empresa_id: string
          id: string
          nome_completo: string
          role?: string
          senha_temporaria?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          empresa_id?: string
          id?: string
          nome_completo?: string
          role?: string
          senha_temporaria?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      setores: {
        Row: {
          created_at: string | null
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "setores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      setores_epis: {
        Row: {
          created_at: string | null
          empresa_id: string
          epi_id: string
          id: string
          setor_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          epi_id: string
          id?: string
          setor_id: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          epi_id?: string
          id?: string
          setor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "setores_epis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setores_epis_epi_id_fkey"
            columns: ["epi_id"]
            isOneToOne: false
            referencedRelation: "epis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setores_epis_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_logs: {
        Row: {
          action_type: string | null
          created_at: string | null
          document_id: string | null
          empresa_id: string
          funcionario_id: string
          id: string
          ip_address: string | null
          signed_at: string | null
          user_agent: string | null
        }
        Insert: {
          action_type?: string | null
          created_at?: string | null
          document_id?: string | null
          empresa_id: string
          funcionario_id: string
          id?: string
          ip_address?: string | null
          signed_at?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string | null
          created_at?: string | null
          document_id?: string | null
          empresa_id?: string
          funcionario_id?: string
          id?: string
          ip_address?: string | null
          signed_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_user_empresa_id: { Args: never; Returns: string }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "tecnico_seguranca" | "rh" | "almoxarifado"
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
      app_role: ["admin", "tecnico_seguranca", "rh", "almoxarifado"],
    },
  },
} as const
