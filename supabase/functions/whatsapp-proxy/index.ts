import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const N8N_WEBHOOK_URL = "https://nextage-n8n.brbss6.easypanel.host/webhook/integracao_whatsapp";
const N8N_STATUS_URL = "https://nextage-n8n.brbss6.easypanel.host/webhook/status_integracao_whatsapp";
const WHATSAPP_API_URL = "https://api.lernow.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("WHATSAPP_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { action, instancia } = await req.json();

    if (!action || !instancia) {
      return new Response(
        JSON.stringify({ error: "action and instancia are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let response: Response;

    switch (action) {
      case "create": {
        response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "whatsapp.integration.create",
            instancia,
          }),
        });
        const text = await response.text();
        let result: any = { instanceName: instancia, instanceId: null };
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            result.instanceId = parsed[0]?.instance?.instanceId || null;
            result.instanceName = parsed[0]?.instance?.instanceName || instancia;
          } else if (parsed?.instance) {
            result.instanceId = parsed.instance.instanceId || null;
            result.instanceName = parsed.instance.instanceName || instancia;
          }
        } catch {
          result.instanceName = text.trim() || instancia;
        }
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "qrcode": {
        response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "whatsapp.integration.connect",
            instancia,
          }),
        });
        const qrText = await response.text();
        let qrData: any = {};
        try {
          const parsed = JSON.parse(qrText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            qrData = parsed[0];
          } else {
            qrData = parsed;
          }
        } catch {
          qrData = { raw: qrText };
        }
        return new Response(JSON.stringify(qrData), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "status": {
        response = await fetch(N8N_STATUS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instancia }),
        });
        const statusText = await response.text();
        let state = "unknown";
        try {
          const parsed = JSON.parse(statusText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            state = parsed[0]?.instance?.state || "unknown";
          } else if (parsed?.instance?.state) {
            state = parsed.instance.state;
          } else if (parsed?.state) {
            state = parsed.state;
          }
        } catch {
          state = statusText.trim();
        }
        return new Response(JSON.stringify({ state }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "disconnect": {
        response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "whatsapp.integration.disconnect",
            instancia,
          }),
        });
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "whatsapp.integration.delete",
            instancia,
          }),
        });
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
