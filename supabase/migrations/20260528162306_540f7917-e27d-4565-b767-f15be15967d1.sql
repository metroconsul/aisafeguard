
-- 1. Restrict perfis.senha_temporaria column: only service_role can read it.
--    Code that needs it (signup-onboarding edge function) uses service role.
REVOKE SELECT (senha_temporaria) ON public.perfis FROM authenticated;
REVOKE SELECT (senha_temporaria) ON public.perfis FROM anon;

-- 2. Restrict funcionarios.access_pin from anon (anon must not read PINs).
--    portal-login edge function uses service role, so it still works.
REVOKE SELECT (access_pin) ON public.funcionarios FROM anon;

-- 3. Remove unneeded anon SELECT on epi_solicitacoes (only INSERT is needed by portal).
DROP POLICY IF EXISTS "Anon can read epi_solicitacoes" ON public.epi_solicitacoes;
