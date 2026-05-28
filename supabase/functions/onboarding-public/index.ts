import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-fA-F-]{36}$/;
const BUCKET = "admission-docs";
const SIGN_TTL = 60 * 30; // 30 min

const DOC_TYPES: Record<string, string> = {
  rg_cpf: "RG / CPF",
  comprovante_residencia: "Comprovante de Residência",
  cnh: "CNH (opcional)",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    const funcionario_id = String(body.funcionario_id || "");

    if (!UUID_RE.test(funcionario_id)) {
      return json({ error: "funcionario_id inválido" }, 400);
    }

    // Sempre revalidar o candidato em estado em_admissao
    const { data: candidate } = await supabase
      .from("funcionarios")
      .select("id, nome, cargo, setor, empresa_id, status")
      .eq("id", funcionario_id)
      .maybeSingle();

    if (!candidate || candidate.status !== "em_admissao") {
      return json({ error: "Link expirado ou inválido" }, 404);
    }

    async function signIfPath(file_url: string | null) {
      if (!file_url) return null;
      // tratar como path se não começa com http
      if (/^https?:\/\//.test(file_url)) return file_url;
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(file_url, SIGN_TTL);
      if (error) return null;
      return data.signedUrl;
    }

    if (action === "get_candidate") {
      const [{ data: empresa }, { data: docs }] = await Promise.all([
        supabase
          .from("empresas")
          .select("nome_fantasia")
          .eq("id", candidate.empresa_id)
          .maybeSingle(),
        supabase
          .from("documents")
          .select("id, doc_category, title, file_url")
          .eq("funcionario_id", candidate.id)
          .eq("doc_category", "admissao"),
      ]);

      const docsSigned = await Promise.all(
        (docs || []).map(async (d) => ({
          id: d.id,
          doc_category: d.doc_category,
          title: d.title,
          file_url: await signIfPath(d.file_url as string | null),
        })),
      );

      return json({
        candidate: {
          id: candidate.id,
          nome: candidate.nome,
          cargo: candidate.cargo,
          setor: candidate.setor,
          empresa_id: candidate.empresa_id,
          status: candidate.status,
        },
        empresa_nome: empresa?.nome_fantasia || "",
        docs: docsSigned,
      });
    }

    if (action === "upload_document") {
      const doc_type = String(body.doc_type || "");
      const file_base64 = String(body.file_base64 || "");
      const file_name = String(body.file_name || "doc");
      const content_type = String(body.content_type || "application/octet-stream");

      if (!DOC_TYPES[doc_type]) return json({ error: "doc_type inválido" }, 400);
      if (!file_base64) return json({ error: "Arquivo ausente" }, 400);

      // limite 10MB pós-decodificação ~ 13.5MB base64
      if (file_base64.length > 14_000_000) {
        return json({ error: "Arquivo excede 10MB" }, 413);
      }

      const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
      if (!allowed.includes(content_type)) {
        return json({ error: "Tipo de arquivo não permitido" }, 400);
      }

      const bin = Uint8Array.from(atob(file_base64), (c) => c.charCodeAt(0));
      const ext = (file_name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${candidate.empresa_id}/${candidate.id}/${doc_type}_${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, bin, { contentType: content_type, upsert: false });
      if (upErr) return json({ error: "Upload falhou: " + upErr.message }, 500);

      const label = DOC_TYPES[doc_type];

      // remover docs anteriores do mesmo tipo (mesma label)
      await supabase
        .from("documents")
        .delete()
        .eq("funcionario_id", candidate.id)
        .eq("doc_category", "admissao")
        .eq("title", label);

      const { data: newDoc, error: insErr } = await supabase
        .from("documents")
        .insert({
          funcionario_id: candidate.id,
          empresa_id: candidate.empresa_id,
          title: label,
          doc_category: "admissao",
          file_url: path, // armazenamos o path; o front recebe signed url
          signature_status: "nao_aplicavel",
        })
        .select("id, doc_category, title, file_url")
        .single();

      if (insErr) return json({ error: insErr.message }, 500);

      return json({
        doc: {
          id: newDoc.id,
          doc_category: newDoc.doc_category,
          title: newDoc.title,
          file_url: await signIfPath(newDoc.file_url as string),
        },
      });
    }

    if (action === "submit") {
      // Recarrega docs com signed URLs para enviar ao n8n
      const { data: docs } = await supabase
        .from("documents")
        .select("id, doc_category, title, file_url")
        .eq("funcionario_id", candidate.id)
        .eq("doc_category", "admissao");

      const docsSigned = await Promise.all(
        (docs || []).map(async (d) => ({
          id: d.id,
          title: d.title,
          doc_category: d.doc_category,
          file_url: await signIfPath(d.file_url as string | null),
        })),
      );

      const { data: empresa } = await supabase
        .from("empresas")
        .select("nome_fantasia, cnpj")
        .eq("id", candidate.empresa_id)
        .maybeSingle();

      // Atualiza status para "em_analise" (não bloqueia se já estiver)
      const { error: updErr } = await supabase
        .from("funcionarios")
        .update({ status: "em_analise" })
        .eq("id", candidate.id)
        .eq("status", "em_admissao");

      if (updErr) {
        console.error("onboarding-public submit: status update error", updErr);
      }

      // Dispara webhook n8n
      const webhookUrl =
        Deno.env.get("N8N_ONBOARDING_WEBHOOK_URL") ||
        "https://impecuniously-muzzy-maddie.ngrok-free.dev/webhook/candidate-onboarding";

      const payload = {
        tipo: "onboarding_submetido",
        funcionario: {
          id: candidate.id,
          nome: candidate.nome,
          cargo: candidate.cargo,
          setor: candidate.setor,
          empresa_id: candidate.empresa_id,
          status: "em_analise",
        },
        empresa: {
          id: candidate.empresa_id,
          nome_fantasia: empresa?.nome_fantasia || "",
          cnpj: empresa?.cnpj || "",
        },
        documentos: docsSigned,
        submitted_at: new Date().toISOString(),
      };

      try {
        const resp = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        console.log("onboarding-public webhook status:", resp.status);
      } catch (e) {
        console.error("onboarding-public webhook error:", e);
      }

      return json({ success: true });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (e) {
    console.error("onboarding-public error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});