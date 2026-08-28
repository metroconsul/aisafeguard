import {
  corsHeaders,
  getServiceClient,
  jsonResponse,
  readJson,
  requirePortalSession,
} from "../_shared/portal-session.ts";

/**
 * Router único para todas as operações de leitura/escrita do Portal do Colaborador.
 * Toda chamada exige `x-portal-token` válido (ou body.portal_token).
 *
 * Body: { action: "...", ...params }
 *
 * Actions:
 *  - list_documents         { categories: string[] }
 *  - list_entregas
 *  - list_time_entries_today
 *  - get_meu_kit            -> requisitos do kit do cargo + política de irregularidade
 *  - submit_time_entry      { tipo, latitude, longitude, accuracy, device_info }

 *  - submit_epi_request     { epi_id, motivo }
 *  - sign_document          { document_id, ip_address?, user_agent? }
 *  - logout
 *  - get_signed_url         { file_url } -> URL pública/assinada para um arquivo do funcionário
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Use POST" }, 405);

  const supabase = getServiceClient();
  const body = await readJson(req);
  const action = String(body.action ?? "");

  const sessionOrResp = await requirePortalSession(req, body, supabase);
  if (sessionOrResp instanceof Response) return sessionOrResp;
  const session = sessionOrResp;

  try {
    switch (action) {
      case "list_documents": {
        const categories = Array.isArray(body.categories) ? (body.categories as string[]) : [];
        if (categories.length === 0) {
          return jsonResponse({ error: "categories obrigatório" }, 400);
        }
        const { data, error } = await supabase
          .from("documents")
          .select("id, title, doc_category, reference_period, signature_status, signed_at, file_url, expiration_date, created_at, empresa_id")
          .eq("funcionario_id", session.funcionario_id)
          .eq("empresa_id", session.empresa_id)
          .in("doc_category", categories)
          .order("created_at", { ascending: false });
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ documents: data ?? [] });
      }

      case "count_pending_holerites": {
        const { count, error } = await supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("funcionario_id", session.funcionario_id)
          .eq("empresa_id", session.empresa_id)
          .eq("doc_category", "holerite")
          .eq("signature_status", "pendente");
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ count: count ?? 0 });
      }

      case "list_nrs_vencendo": {
        const in30 = new Date();
        in30.setDate(in30.getDate() + 30);
        const todayStr = new Date().toISOString().split("T")[0];
        const in30Str = in30.toISOString().split("T")[0];
        const { data, error } = await supabase
          .from("documents")
          .select("title, expiration_date")
          .eq("funcionario_id", session.funcionario_id)
          .eq("empresa_id", session.empresa_id)
          .eq("doc_category", "treinamento_nr")
          .not("expiration_date", "is", null)
          .lte("expiration_date", in30Str)
          .gte("expiration_date", todayStr);
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ items: data ?? [] });
      }

      case "list_entregas": {
        const { data, error } = await supabase
          .from("entregas")
          .select("id, data_entrega, data_vencimento, status_assinatura, epis(id, nome_equipamento, numero_ca)")
          .eq("funcionario_id", session.funcionario_id)
          .eq("empresa_id", session.empresa_id)
          .order("data_entrega", { ascending: false });
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ entregas: data ?? [] });
      }

      case "list_time_entries_today": {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const { data, error } = await supabase
          .from("time_entries")
          .select("id, tipo, recorded_at")
          .eq("funcionario_id", session.funcionario_id)
          .eq("empresa_id", session.empresa_id)
          .gte("recorded_at", start.toISOString())
          .order("recorded_at", { ascending: true });
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ entries: data ?? [] });
      }

      case "get_meu_kit": {
        const { data, error } = await supabase
          .from("funcionario_epi_requisitos")
          .select("id, epi_id, quantidade_necessaria, quantidade_entregue, obrigatorio, status, proxima_vencimento, epis(nome_equipamento, numero_ca)")
          .eq("funcionario_id", session.funcionario_id)
          .eq("empresa_id", session.empresa_id);
        if (error) return jsonResponse({ error: error.message }, 500);
        const { data: policy } = await supabase
          .from("epi_policies")
          .select("modo, aviso_antecedencia_dias")
          .eq("empresa_id", session.empresa_id)
          .maybeSingle();
        return jsonResponse({
          requisitos: data ?? [],
          policy: policy ?? { modo: "none", aviso_antecedencia_dias: 7 },
        });
      }

      case "submit_time_entry": {
        const tipo = String(body.tipo ?? "");
        const allowed = ["entrada", "saida_almoco", "volta_almoco", "saida"];
        if (!allowed.includes(tipo)) return jsonResponse({ error: "tipo inválido" }, 400);

        // Política de irregularidade de EPI (validação obrigatoriamente no servidor).
        const { data: policy } = await supabase
          .from("epi_policies")
          .select("modo")
          .eq("empresa_id", session.empresa_id)
          .maybeSingle();
        const modo = String(policy?.modo ?? "none");

        let irregularidade: { vencidos: number; pendentes: number } | null = null;
        if (modo === "alert" || modo === "hard_block") {
          const { data: reqs } = await supabase
            .from("funcionario_epi_requisitos")
            .select("status")
            .eq("funcionario_id", session.funcionario_id)
            .eq("empresa_id", session.empresa_id)
            .eq("obrigatorio", true)
            .in("status", ["pending", "partial", "expired"]);
          const vencidos = (reqs ?? []).filter((r) => r.status === "expired").length;
          const pendentes = (reqs ?? []).length - vencidos;
          if (vencidos + pendentes > 0) irregularidade = { vencidos, pendentes };
        }

        if (modo === "hard_block" && irregularidade) {
          // Exceção autorizada pela gestão para o dia libera o registro.
          const hoje = new Date().toISOString().split("T")[0];
          const { data: excecao } = await supabase
            .from("epi_excecoes_ponto")
            .select("id")
            .eq("funcionario_id", session.funcionario_id)
            .eq("empresa_id", session.empresa_id)
            .eq("data_referencia", hoje)
            .maybeSingle();
          if (!excecao) {
            // Status 200 intencional: o cliente do Portal precisa ler o payload do bloqueio.
            return jsonResponse({ blocked: true, reason: "epi_irregular", irregularidade });
          }
        }

        const insertBody: Record<string, unknown> = {
          empresa_id: session.empresa_id,
          funcionario_id: session.funcionario_id,
          tipo,
          recorded_at: new Date().toISOString(),
        };
        if (typeof body.latitude === "number") insertBody.latitude = body.latitude;
        if (typeof body.longitude === "number") insertBody.longitude = body.longitude;
        if (typeof body.accuracy === "number") insertBody.accuracy = body.accuracy;
        if (typeof body.device_info === "string") insertBody.device_info = String(body.device_info).slice(0, 200);
        const { data, error } = await supabase.from("time_entries").insert(insertBody).select("id, tipo, recorded_at").single();
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ entry: data, warning: modo === "alert" ? irregularidade : null });
      }


      case "submit_epi_request": {
        const epi_id = String(body.epi_id ?? "");
        const motivo = String(body.motivo ?? "");
        if (!epi_id || !motivo) return jsonResponse({ error: "epi_id e motivo obrigatórios" }, 400);
        const { error } = await supabase.from("epi_solicitacoes").insert({
          funcionario_id: session.funcionario_id,
          empresa_id: session.empresa_id,
          epi_id,
          motivo: motivo.slice(0, 500),
        });
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ success: true });
      }

      case "sign_document": {
        const document_id = String(body.document_id ?? "");
        if (!document_id) return jsonResponse({ error: "document_id obrigatório" }, 400);

        // Verifica posse do documento
        const { data: doc, error: docErr } = await supabase
          .from("documents")
          .select("id, doc_category, signature_status, empresa_id, funcionario_id")
          .eq("id", document_id)
          .maybeSingle();
        if (docErr) return jsonResponse({ error: docErr.message }, 500);
        if (!doc || doc.funcionario_id !== session.funcionario_id || doc.empresa_id !== session.empresa_id) {
          return jsonResponse({ error: "Documento não encontrado" }, 404);
        }
        if (!["holerite", "cartao_ponto"].includes(doc.doc_category)) {
          return jsonResponse({ error: "Categoria não assinável pelo portal" }, 400);
        }
        if (doc.signature_status === "assinado") {
          return jsonResponse({ success: true, already_signed: true });
        }

        const now = new Date().toISOString();
        const ip = (typeof body.ip_address === "string" ? body.ip_address : null)
          ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
        const ua = (typeof body.user_agent === "string" ? body.user_agent : null)
          ?? req.headers.get("user-agent") ?? null;

        const { error: upErr } = await supabase
          .from("documents")
          .update({ signature_status: "assinado", signed_at: now, signature_ip: ip })
          .eq("id", document_id);
        if (upErr) return jsonResponse({ error: upErr.message }, 500);

        await supabase.from("signature_logs").insert({
          funcionario_id: session.funcionario_id,
          empresa_id: session.empresa_id,
          document_id,
          action_type: doc.doc_category === "holerite" ? "assinatura_holerite" : "assinatura_ponto",
          ip_address: ip,
          user_agent: ua,
          signed_at: now,
        });

        return jsonResponse({ success: true });
      }

      case "get_signed_url": {
        const fileUrl = String(body.file_url ?? "");
        if (!fileUrl) return jsonResponse({ error: "file_url obrigatório" }, 400);
        // Extrai bucket e path da URL pública/storage
        // Formato: https://<proj>.supabase.co/storage/v1/object/(public|sign)/<bucket>/<path>
        const match = fileUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?.*)?$/);
        if (!match) return jsonResponse({ error: "URL inválida" }, 400);
        const bucket = match[1];
        const path = decodeURIComponent(match[2]);

        // Confere que o arquivo pertence à empresa/funcionário da sessão (path deve conter o empresa_id ou funcionario_id)
        const empresaId = session.empresa_id;
        const funcId = session.funcionario_id;
        if (!path.includes(empresaId) && !path.includes(funcId)) {
          return jsonResponse({ error: "Sem permissão para este arquivo" }, 403);
        }

        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
        if (error || !data) return jsonResponse({ error: error?.message ?? "Falha ao gerar URL" }, 500);
        return jsonResponse({ url: data.signedUrl });
      }

      // ————— Produto de operação de turnos (isolado do Safeguard) —————
      case "get_minha_escala": {
        const inicio = String(body.inicio ?? "");
        const fim = String(body.fim ?? "");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fim)) {
          return jsonResponse({ error: "inicio e fim (YYYY-MM-DD) obrigatórios" }, 400);
        }

        const { data: enabled } = await supabase.rpc("empresa_tem_produto", {
          _empresa_id: session.empresa_id,
          _product_key: "restaurant_operations",
        });
        if (!enabled) return jsonResponse({ enabled: false, escalas: [], settings: null });

        const { data, error } = await supabase
          .from("restaurant_escalas")
          .select("id, data, status, folga, observacao, restaurant_escala_blocos(id, ordem, inicio_previsto, fim_previsto, turno_nome_snapshot)")
          .eq("funcionario_id", session.funcionario_id)
          .eq("empresa_id", session.empresa_id)
          .eq("status", "publicada")
          .gte("data", inicio)
          .lte("data", fim)
          .order("data", { ascending: true });
        if (error) return jsonResponse({ error: error.message }, 500);

        const { data: settings } = await supabase
          .from("restaurant_product_settings")
          .select("portal_brand_name, brand_name, primary_color, accent_color, exige_ciencia_escala")
          .eq("empresa_id", session.empresa_id)
          .maybeSingle();

        return jsonResponse({ enabled: true, escalas: data ?? [], settings: settings ?? null });
      }

      case "registrar_ciencia_escala": {
        const inicio = String(body.periodo_inicio ?? "");
        const fim = String(body.periodo_fim ?? "");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fim)) {
          return jsonResponse({ error: "periodo_inicio e periodo_fim obrigatórios" }, 400);
        }
        const { data: enabled } = await supabase.rpc("empresa_tem_produto", {
          _empresa_id: session.empresa_id,
          _product_key: "restaurant_operations",
        });
        if (!enabled) return jsonResponse({ error: "Produto não habilitado" }, 403);

        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
        const { error } = await supabase.from("restaurant_escala_ciencia").insert({
          empresa_id: session.empresa_id,
          funcionario_id: session.funcionario_id,
          periodo_inicio: inicio,
          periodo_fim: fim,
          versao: 1,
          visualizado_em: new Date().toISOString(),
          ip_address: ip,
          user_agent: req.headers.get("user-agent") ?? null,
        });
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ success: true });
      }

      case "logout": {
        await supabase.from("portal_sessions").delete().eq("token", session.token);
        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: "Action desconhecida" }, 400);
    }
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});