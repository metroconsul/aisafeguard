import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const N8N_WEBHOOK_URL = "https://impecuniously-muzzy-maddie.ngrok-free.dev/webhook/notify-holerite";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id, employee_id, employee_name, phone, reference_period, action, pdf_base64, file_name } =
      await req.json();

    const payload: Record<string, unknown> = {
      document_id,
      employee_id,
      employee_name,
      phone,
      reference_period,
      action,
      portal_url: "https://aisafeguard.lovable.app/portal",
    };

    if (pdf_base64) {
      payload.pdf_base64 = pdf_base64;
      payload.file_name = file_name || `holerite_${reference_period?.replace("/", "-")}.pdf`;
    }

    console.log(`Sending notify-holerite to n8n for ${employee_name} (${action})`);

    const response = await fetch(N8N_WEBHOOK_URL, {
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
