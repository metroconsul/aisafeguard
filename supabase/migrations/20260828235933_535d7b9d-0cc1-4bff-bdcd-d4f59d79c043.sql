INSERT INTO public.empresa_produtos (empresa_id, product_key, enabled)
SELECT e.id, 'restaurant_operations', true FROM public.empresas e
ON CONFLICT (empresa_id, product_key) DO UPDATE SET enabled = true, updated_at = now();