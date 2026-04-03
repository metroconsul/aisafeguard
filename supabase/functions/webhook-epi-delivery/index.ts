import { corsHeaders } from "@supabase/supabase-js/cors";

const WEBHOOK_URL = "https://n8n-n8n.nd25qi.easypanel.host/webhook/epi-delivery";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    return new Response(
      JSON.stringify({ success: response.ok, status: response.status, data: text }),
      { status: response.ok ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
