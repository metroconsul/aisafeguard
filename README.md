# EPI Safe

Construa um SaaS completo de gestão e automação de entrega de EPIs (Equipamentos de Proteção Individual) para indústrias. Quero que você crie o frontend e provisione automaticamente o banco de dados usando o Lovable Cloud (Supabase).

Banco de Dados (Schema) Crie as seguintes tabelas e seus relacionamentos:

funcionarios: id (uuid), nome (text), matricula (text, unique), cargo (text), setor (text).

epis: id (uuid), nome_equipament (text), numero_ca (text), dias_validade (int), quantidade_estoque (int).

entregas: id (uuid), funcionario_id (relacionado a funcionarios), epi_id (relacionado a epis), data_entrega (timestamp), data_vencimento (timestamp), status_assinatura (text: 'Pendente', 'Assinado').

Design Visual e Layout (Estilo Nexus Dashboard) O design deve ser extremamente profissional, limpo e em modo claro (light theme), focado em dados analíticos.

Cores: Fundo geral off-white/cinza muito claro. Cards brancos. Cor primária para botões e destaques em um tom de roxo vibrante (#6366F1 ou similar). Cores secundárias para gráficos em ciano, azul claro e azul escuro.

Sidebar (Esquerda): Fundo branco, dividida em seções. 'Geral' (Dashboard, Nova Entrega), 'Cadastros' (Funcionários, EPIs, Setores) e 'Suporte'. No rodapé da sidebar, coloque um seletor de equipe e um botão de upgrade.

Top Header: Barra de busca centralizada, ícone de notificação e avatar do usuário (Técnico de Segurança) à direita.

Dashboard Principal (Página Inicial) Adapte a visualização analítica para o contexto de segurança do trabalho:

Row 1 (KPI Cards): 3 cards limpos exibindo: 'Entregas no Mês', 'EPIs Vencidos/A Vencer' (com badge vermelho se for > 0) e 'Taxa de Assinaturas' (%). Inclua pequenos indicadores de tendência (ex: +15% verde).

Row 2 (Gráficos Principais): À esquerda, um gráfico de barras empilhadas mostrando 'Entregas por Setor' ao longo dos meses. À direita, um gráfico de barras simples para 'Entregas na Semana'.

Row 3 (Distribuição e Lista): À esquerda, um gráfico de rosca (Donut Chart) mostrando a 'Distribuição de EPIs por Tipo' (Luvas, Óculos, Botas, etc.). À direita, uma lista em formato de tabela com as 'Últimas Integrações/Entregas', mostrando a foto do funcionário, nome, EPI e uma barra de progresso ou badge de status (Pendente/Assinado).

Gere a estrutura completa da aplicação, popule os gráficos com dados fictícios realistas de indústria caso o banco esteja vazio, e garanta que as tabelas do Lovable Cloud estejam ativas." criar o fluxo de assinatura digital para as entregas de EPI e a integração com Webhook. Por favor, implemente o seguinte:

Atualização do Banco de Dados: Adicione o campo telefone_whatsapp (text) na tabela de funcionarios. Adicione também o campo imagem_assinatura (text, para salvar a URL ou base64 da assinatura) na tabela de entregas.

Rota e Tela de Assinatura Mobile: Crie uma nova página com uma rota dinâmica /assinar/[id_da_entrega]. Esta tela deve ser mobile-first (pensada para a tela do celular do funcionário), com design limpo e fundo branco.

Ao carregar a página, ela deve ler o ID da URL e buscar no Supabase os dados da entrega (Nome do Funcionário, EPI, CA e Data).

Exiba um texto legal simples: 'Eu, [Nome do Funcionário], confirmo o recebimento do equipamento [Nome do EPI] em perfeitas condições de uso.'

Abaixo do texto, implemente um componente de Canvas (Quadro de Desenho) onde o funcionário possa assinar com o dedo.

Adicione um botão 'Confirmar Assinatura' que, ao ser clicado, salva o desenho da assinatura no campo imagem_assinatura, muda o status_assinatura para 'Assinado' no Supabase e mostra uma tela de sucesso ('Assinatura registrada com sucesso. Você pode fechar esta página.').

Gatilho de Webhook no Painel Admin: No dashboard principal que você já criou, edite a ação do formulário de 'Nova Entrega'. Assim que o Técnico de Segurança salvar a entrega e ela for inserida no Supabase, o sistema deve disparar um HTTP POST (Webhook) para uma URL externa (crie uma constante no código onde eu possa colar a URL do meu n8n depois).

O JSON (payload) enviado no webhook deve conter: nome_funcionario, telefone_whatsapp, nome_epi, e o link_assinatura (que deve ser a URL base da aplicação + a rota /assinar/[id_da_entrega])."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://aisafeguard.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2836a82a-dbd3-474c-b80d-73d065325574).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
