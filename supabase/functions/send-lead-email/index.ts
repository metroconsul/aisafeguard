import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { nome_pessoa, nome_empresa, insta_site } = await req.json();

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🛡️ SafeGuard — Novo Lead</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
          <h2 style="color: #111827; margin-top: 0;">Novo agendamento de call</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-weight: 600;">Nome</td>
              <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; color: #111827;">${nome_pessoa}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-weight: 600;">Empresa</td>
              <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; color: #111827;">${nome_empresa}</td>
            </tr>
            <tr>
              <td style="padding: 12px; color: #6b7280; font-weight: 600;">Insta / Site</td>
              <td style="padding: 12px; color: #111827;">${insta_site}</td>
            </tr>
          </table>
          <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
            O lead foi redirecionado para o Calendly para agendar a call.
          </p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SafeGuard <onboarding@resend.dev>",
        to: ["metroaienterprise@gmail.com"],
        subject: `Novo Lead SafeGuard: ${nome_empresa}`,
        html: htmlBody,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`Resend API error [${res.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending lead email:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
