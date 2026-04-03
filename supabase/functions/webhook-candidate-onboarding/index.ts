import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { candidate_id, name, phone } = payload;

    if (!candidate_id || !name) {
      return new Response(
        JSON.stringify({ error: "candidate_id and name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const n8nUrl = "https://n8n-n8n.nd25qi.easypanel.host/webhook/candidate-onboarding";

    const n8nResponse = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidate_id,
        name,
        phone: phone || null,
        onboarding_url: `https://aisafeguard.lovable.app/onboarding/${candidate_id}`,
      }),
    });

    const responseText = await n8nResponse.text();
    console.log(`webhook-candidate-onboarding: n8n responded ${n8nResponse.status}`, responseText);

    return new Response(
      JSON.stringify({ success: true, n8n_status: n8nResponse.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("webhook-candidate-onboarding error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
