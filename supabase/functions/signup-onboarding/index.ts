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
      let { email, nome, empresa_id, role } = body;
      const resendUserId = body.resend_user_id;

      // For resend: look up email from auth if not provided
      if (resendUserId && !email) {
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const found = existingUsers?.users?.find((u: any) => u.id === resendUserId);
        if (found) {
          email = found.email;
        }
      }

      if (!email || !nome || !empresa_id || !role) {
        return new Response(
          JSON.stringify({ error: "Todos os campos são obrigatórios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate a unique memorable password
      const adjectives = ["Forte","Seguro","Rapido","Bravo","Firme","Alerta","Agil","Nobre"];
      const nouns = ["Capacete","Luva","Oculos","Bota","Colete","Escudo","Cinto","Viseira"];
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const num = Math.floor(Math.random() * 900) + 100; // 100-999
      const tempPassword = `${adj}${noun}${num}`;

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

          // Buscar senha salva no banco
          const { data: perfilExistente } = await supabase
            .from("perfis")
            .select("senha_temporaria")
            .eq("id", userId)
            .maybeSingle();

          if (perfilExistente?.senha_temporaria) {
            passwordToShare = perfilExistente.senha_temporaria;
          }
          // Sempre sincronizar a senha no auth com a que vamos compartilhar
          await supabase.auth.admin.updateUserById(userId, { password: passwordToShare! });
        } else {
          return new Response(
            JSON.stringify({ error: authError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        userId = authData.user.id;
      }

      // Upsert perfil linked to the same empresa
      const { error: perfilError } = await supabase.from("perfis").upsert({
        id: userId,
        empresa_id,
        nome_completo: nome,
        role,
        status: "pendente",
        senha_temporaria: passwordToShare || undefined,
        email,
      }, { onConflict: "id" });

      if (perfilError) {
        return new Response(
          JSON.stringify({ error: "Erro ao criar perfil: " + perfilError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upsert role into user_roles table
      await supabase.from("user_roles").upsert({
        user_id: userId,
        role,
      }, { onConflict: "user_id,role" });

      // Get empresa name for the email
      let empresaNome = "";
      const { data: empresaInfo } = await supabase
        .from("empresas")
        .select("nome_fantasia")
        .eq("id", empresa_id)
        .single();
      if (empresaInfo) empresaNome = empresaInfo.nome_fantasia;

      // Map role to display name
      const roleLabels: Record<string, string> = {
        admin: "Administrador",
        tecnico_seguranca: "Técnico de Segurança",
        rh: "RH",
        almoxarifado: "Almoxarifado",
      };

      // Send invite email via transactional email system
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const loginUrl = "https://wear-and-sign.lovable.app/login";
      
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "convite-equipe",
          recipientEmail: email,
          idempotencyKey: `convite-${userId}-${empresa_id}`,
          templateData: {
            nome,
            email,
            senha: passwordToShare,
            cargo: roleLabels[role] || role,
            empresaNome,
            loginUrl,
          },
        },
      });

      const responsePayload: any = { success: true, message: `Convite enviado para ${email}`, email };
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
      email,
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
