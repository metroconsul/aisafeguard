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
      cargos: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_id: string
          id: string
          nome: string
          setor_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          setor_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          setor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cargos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargos_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
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
      empresa_produto_audit: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          empresa_id: string
          id: string
          new_value: Json | null
          old_value: Json | null
          product_key: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          product_key: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          product_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_produto_audit_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_produtos: {
        Row: {
          ativado_por: string | null
          brand_config: Json
          created_at: string
          empresa_id: string
          enabled: boolean
          id: string
          product_key: string
          updated_at: string
        }
        Insert: {
          ativado_por?: string | null
          brand_config?: Json
          created_at?: string
          empresa_id: string
          enabled?: boolean
          id?: string
          product_key: string
          updated_at?: string
        }
        Update: {
          ativado_por?: string | null
          brand_config?: Json
          created_at?: string
          empresa_id?: string
          enabled?: boolean
          id?: string
          product_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
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
          cancelado_em: string | null
          cargo_snapshot: string | null
          created_at: string | null
          data_entrega: string | null
          data_vencimento: string
          empresa_id: string | null
          epi_id: string
          foto_assinatura: string | null
          funcionario_id: string
          id: string
          imagem_assinatura: string | null
          kit_id: string | null
          kit_item_id: string | null
          origem: string
          quantidade: number
          registrado_por: string | null
          setor_id_snapshot: string | null
          setor_snapshot: string | null
          status_assinatura: string | null
        }
        Insert: {
          cancelado_em?: string | null
          cargo_snapshot?: string | null
          created_at?: string | null
          data_entrega?: string | null
          data_vencimento: string
          empresa_id?: string | null
          epi_id: string
          foto_assinatura?: string | null
          funcionario_id: string
          id?: string
          imagem_assinatura?: string | null
          kit_id?: string | null
          kit_item_id?: string | null
          origem?: string
          quantidade?: number
          registrado_por?: string | null
          setor_id_snapshot?: string | null
          setor_snapshot?: string | null
          status_assinatura?: string | null
        }
        Update: {
          cancelado_em?: string | null
          cargo_snapshot?: string | null
          created_at?: string | null
          data_entrega?: string | null
          data_vencimento?: string
          empresa_id?: string | null
          epi_id?: string
          foto_assinatura?: string | null
          funcionario_id?: string
          id?: string
          imagem_assinatura?: string | null
          kit_id?: string | null
          kit_item_id?: string | null
          origem?: string
          quantidade?: number
          registrado_por?: string | null
          setor_id_snapshot?: string | null
          setor_snapshot?: string | null
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
          {
            foreignKeyName: "entregas_kit_fk"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "epi_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_kit_item_fk"
            columns: ["kit_item_id"]
            isOneToOne: false
            referencedRelation: "epi_kit_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          empresa_id: string
          entity: string
          entity_id: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          empresa_id: string
          entity: string
          entity_id?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          empresa_id?: string
          entity?: string
          entity_id?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "epi_audit_log_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_excecoes_ponto: {
        Row: {
          aprovado_em: string
          aprovado_por: string
          created_at: string
          data_referencia: string
          empresa_id: string
          funcionario_id: string
          id: string
          motivo: string
          observacao: string | null
          turno: string | null
        }
        Insert: {
          aprovado_em?: string
          aprovado_por: string
          created_at?: string
          data_referencia: string
          empresa_id: string
          funcionario_id: string
          id?: string
          motivo: string
          observacao?: string | null
          turno?: string | null
        }
        Update: {
          aprovado_em?: string
          aprovado_por?: string
          created_at?: string
          data_referencia?: string
          empresa_id?: string
          funcionario_id?: string
          id?: string
          motivo?: string
          observacao?: string | null
          turno?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epi_excecoes_ponto_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_excecoes_ponto_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_kit_itens: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_id: string
          epi_id: string
          id: string
          kit_id: string
          obrigatorio: boolean
          quantidade_necessaria: number
          updated_at: string
          validade_unidade: string
          validade_valor: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_id: string
          epi_id: string
          id?: string
          kit_id: string
          obrigatorio?: boolean
          quantidade_necessaria?: number
          updated_at?: string
          validade_unidade?: string
          validade_valor: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          epi_id?: string
          id?: string
          kit_id?: string
          obrigatorio?: boolean
          quantidade_necessaria?: number
          updated_at?: string
          validade_unidade?: string
          validade_valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "epi_kit_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_kit_itens_epi_id_fkey"
            columns: ["epi_id"]
            isOneToOne: false
            referencedRelation: "epis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_kit_itens_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "epi_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_kits: {
        Row: {
          ativo: boolean
          cargo_id: string
          created_at: string
          empresa_id: string
          id: string
          nome: string
          updated_at: string
          versao: number
        }
        Insert: {
          ativo?: boolean
          cargo_id: string
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          updated_at?: string
          versao?: number
        }
        Update: {
          ativo?: boolean
          cargo_id?: string
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          updated_at?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "epi_kits_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_kits_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_policies: {
        Row: {
          aviso_antecedencia_dias: number
          created_at: string
          empresa_id: string
          modo: string
          updated_at: string
        }
        Insert: {
          aviso_antecedencia_dias?: number
          created_at?: string
          empresa_id: string
          modo?: string
          updated_at?: string
        }
        Update: {
          aviso_antecedencia_dias?: number
          created_at?: string
          empresa_id?: string
          modo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "epi_policies_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
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
      funcionario_epi_requisitos: {
        Row: {
          created_at: string
          empresa_id: string
          epi_id: string
          funcionario_id: string
          id: string
          kit_id: string
          kit_item_id: string
          kit_versao: number
          obrigatorio: boolean
          proxima_vencimento: string | null
          quantidade_entregue: number
          quantidade_necessaria: number
          resolvido_em: string | null
          status: string
          ultima_entrega_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          epi_id: string
          funcionario_id: string
          id?: string
          kit_id: string
          kit_item_id: string
          kit_versao?: number
          obrigatorio?: boolean
          proxima_vencimento?: string | null
          quantidade_entregue?: number
          quantidade_necessaria?: number
          resolvido_em?: string | null
          status?: string
          ultima_entrega_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          epi_id?: string
          funcionario_id?: string
          id?: string
          kit_id?: string
          kit_item_id?: string
          kit_versao?: number
          obrigatorio?: boolean
          proxima_vencimento?: string | null
          quantidade_entregue?: number
          quantidade_necessaria?: number
          resolvido_em?: string | null
          status?: string
          ultima_entrega_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionario_epi_requisitos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionario_epi_requisitos_epi_id_fkey"
            columns: ["epi_id"]
            isOneToOne: false
            referencedRelation: "epis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionario_epi_requisitos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionario_epi_requisitos_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "epi_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionario_epi_requisitos_kit_item_id_fkey"
            columns: ["kit_item_id"]
            isOneToOne: false
            referencedRelation: "epi_kit_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionario_epi_requisitos_ultima_entrega_id_fkey"
            columns: ["ultima_entrega_id"]
            isOneToOne: false
            referencedRelation: "entregas"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          access_pin: string | null
          admission_stage: string | null
          cargo: string
          cargo_id: string | null
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
          admission_stage?: string | null
          cargo: string
          cargo_id?: string | null
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
          admission_stage?: string | null
          cargo?: string
          cargo_id?: string | null
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
            foreignKeyName: "funcionarios_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
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
      portal_sessions: {
        Row: {
          created_at: string
          empresa_id: string
          expires_at: string
          funcionario_id: string
          id: string
          ip_address: string | null
          last_seen_at: string
          token: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          empresa_id: string
          expires_at: string
          funcionario_id: string
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          token: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          empresa_id?: string
          expires_at?: string
          funcionario_id?: string
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          token?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      restaurant_product_settings: {
        Row: {
          accent_color: string
          brand_logo_url: string | null
          brand_name: string
          carga_semanal_max_horas: number
          created_at: string
          empresa_id: string
          exige_ciencia_escala: boolean
          intervalo_minimo_horas: number
          origem_regra: string
          permite_troca_turno: boolean
          portal_brand_name: string
          primary_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          brand_logo_url?: string | null
          brand_name?: string
          carga_semanal_max_horas?: number
          created_at?: string
          empresa_id: string
          exige_ciencia_escala?: boolean
          intervalo_minimo_horas?: number
          origem_regra?: string
          permite_troca_turno?: boolean
          portal_brand_name?: string
          primary_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          brand_logo_url?: string | null
          brand_name?: string
          carga_semanal_max_horas?: number
          created_at?: string
          empresa_id?: string
          exige_ciencia_escala?: boolean
          intervalo_minimo_horas?: number
          origem_regra?: string
          permite_troca_turno?: boolean
          portal_brand_name?: string
          primary_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_product_settings_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
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
      time_entries: {
        Row: {
          accuracy: number | null
          address_reference: string | null
          created_at: string
          device_info: string | null
          empresa_id: string
          funcionario_id: string
          id: string
          latitude: number | null
          longitude: number | null
          recorded_at: string
          tipo: string
        }
        Insert: {
          accuracy?: number | null
          address_reference?: string | null
          created_at?: string
          device_info?: string | null
          empresa_id: string
          funcionario_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          recorded_at?: string
          tipo: string
        }
        Update: {
          accuracy?: number | null
          address_reference?: string | null
          created_at?: string
          device_info?: string | null
          empresa_id?: string
          funcionario_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          recorded_at?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
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
      email_queue_dispatch: { Args: never; Returns: undefined }
      empresa_tem_produto: {
        Args: { _empresa_id: string; _product_key: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      epi_calc_vencimento: {
        Args: { _base: string; _unidade: string; _valor: number }
        Returns: string
      }
      epi_consumo_por_setor: {
        Args: { _bucket?: string; _fim: string; _inicio: string }
        Returns: {
          eventos: number
          periodo: string
          setor: string
          total: number
        }[]
      }
      epi_consumo_ranking: {
        Args: { _fim: string; _inicio: string; _setor?: string }
        Returns: {
          epi_id: string
          eventos: number
          nome_equipamento: string
          numero_ca: string
          total: number
        }[]
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
      recalc_requisitos_funcionario: {
        Args: { _funcionario_id: string }
        Returns: undefined
      }
      sync_requisitos_funcionario: {
        Args: { _funcionario_id: string }
        Returns: undefined
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
