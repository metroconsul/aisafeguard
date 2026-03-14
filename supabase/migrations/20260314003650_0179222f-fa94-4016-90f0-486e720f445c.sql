
-- 1. Funcionarios
CREATE TABLE public.funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  matricula TEXT UNIQUE NOT NULL,
  cargo TEXT NOT NULL,
  setor TEXT NOT NULL,
  telefone_whatsapp TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. EPIs
CREATE TABLE public.epis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_equipamento TEXT NOT NULL,
  numero_ca TEXT NOT NULL,
  dias_validade INT NOT NULL,
  quantidade_estoque INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Entregas
CREATE TABLE public.entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE NOT NULL,
  epi_id UUID REFERENCES public.epis(id) ON DELETE CASCADE NOT NULL,
  data_entrega TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_vencimento TIMESTAMP WITH TIME ZONE NOT NULL,
  status_assinatura TEXT CHECK (status_assinatura IN ('Pendente', 'Assinado')) DEFAULT 'Pendente',
  imagem_assinatura TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth required for this industrial app)
CREATE POLICY "Allow all access to funcionarios" ON public.funcionarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to epis" ON public.epis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to entregas" ON public.entregas FOR ALL USING (true) WITH CHECK (true);
