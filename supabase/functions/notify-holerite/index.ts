import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id, employee_id, employee_name, phone, reference_period, action } =
      await req.json();

    const webhookUrl = Deno.env.get("N8N_WEBHOOK_URL") || "";

    if (!webhookUrl) {
      console.warn("N8N_WEBHOOK_URL not configured – skipping webhook call");
      return new Response(JSON.stringify({ success: true, warning: "webhook_url_not_set" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = {
      document_id,
      employee_id,
      employee_name,
      phone,
      reference_period,
      action,
      portal_url: "https://aisafeguard.lovable.app/portal",
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Webhook returned ${response.status}: ${text}`);
    }

    await response.text();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("notify-holerite error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
