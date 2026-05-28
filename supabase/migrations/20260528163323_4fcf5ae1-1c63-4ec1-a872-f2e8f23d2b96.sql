-- Onda 1: trancar entregas (assinatura pública migrada para edge functions)
DROP POLICY IF EXISTS "Anon can view entregas for signing" ON public.entregas;
DROP POLICY IF EXISTS "Anon can update entregas for signing" ON public.entregas;

REVOKE SELECT, UPDATE ON public.entregas FROM anon;