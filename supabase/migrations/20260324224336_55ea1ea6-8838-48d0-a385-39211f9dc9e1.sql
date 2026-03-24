INSERT INTO public.user_roles (user_id, role)
SELECT '77b65c69-0d9b-4b60-b9f7-f8622f4f4994', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '77b65c69-0d9b-4b60-b9f7-f8622f4f4994' AND role = 'admin'
);