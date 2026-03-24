import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

  try {
    const body = await req.json();
    const isInvite = body.is_invite === true;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // === INVITE FLOW ===
    if (isInvite) {
      const { email, nome, empresa_id, role } = body;

      if (!email || !nome || !empresa_id || !role) {
        return new Response(
          JSON.stringify({ error: "Todos os campos são obrigatórios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate a temporary password
      const tempPassword = crypto.randomUUID().slice(0, 12);

      // Try to create auth user, or find existing one
      let userId: string;
      let passwordToShare: string | null = tempPassword;

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

      if (authError) {
        if (authError.message.includes("already been registered")) {
          // User exists — find their ID
          const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
          if (listError) {
            return new Response(
              JSON.stringify({ error: "Erro ao buscar usuário existente." }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          const found = existingUsers.users.find((u: any) => u.email === email);
          if (!found) {
            return new Response(
              JSON.stringify({ error: "Usuário não encontrado." }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          userId = found.id;
          passwordToShare = null; // don't reset their password
        } else {
          return new Response(
            JSON.stringify({ error: authError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        userId = authData.user.id;
      }

      // Create perfil linked to the same empresa
      const { error: perfilError } = await supabase.from("perfis").insert({
        id: userId,
        empresa_id,
        nome_completo: nome,
        role,
        status: "pendente",
      });

      if (perfilError) {
        await supabase.auth.admin.deleteUser(userId);
        return new Response(
          JSON.stringify({ error: "Erro ao criar perfil: " + perfilError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert role into user_roles table
      await supabase.from("user_roles").insert({
        user_id: userId,
        role,
      });

      const responsePayload: any = { success: true, message: `Convite enviado para ${email}` };
      if (passwordToShare) responsePayload.temp_password = passwordToShare;

      return new Response(
        JSON.stringify(responsePayload),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === SIGNUP FLOW ===
    const { nome_empresa, nome_usuario, email, senha } = body;

    if (!nome_empresa || !nome_usuario || !email || !senha) {
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (senha.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: false,
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // 2. Create empresa
    const { data: empresaData, error: empresaError } = await supabase
      .from("empresas")
      .insert({ nome_fantasia: nome_empresa, cnpj: "" })
      .select("id")
      .single();

    if (empresaError) {
      await supabase.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar empresa: " + empresaError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Create perfil
    const { error: perfilError } = await supabase.from("perfis").insert({
      id: userId,
      empresa_id: empresaData.id,
      nome_completo: nome_usuario,
      role: "admin",
    });

    if (perfilError) {
      await supabase.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar perfil: " + perfilError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Insert admin role
    await supabase.from("user_roles").insert({
      user_id: userId,
      role: "admin",
    });

    // 5. Send confirmation email
    await supabase.auth.resend({
      type: "signup",
      email,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Conta criada! Verifique seu email." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
