# Separação total dos dois produtos (Safeguard × Operação de Turnos)

Objetivo: cada conta pertence a um único produto. Sem botão de troca, sem rota compartilhada, logins e cadastros separados por nicho — dá para vender para os dois mercados sem conflito.

## Regras do modelo

- Uma empresa tem exatamente um produto ativo: `safeguard_industrial` **ou** `restaurant_operations`.
- Contas (usuários) pertencem a uma empresa, logo pertencem a um só produto.
- O produto define para onde o login vai e o que o portal do colaborador mostra.

## Mudanças na aplicação

1. Remover o seletor de produto
   - Excluir `ProductSwitcher` e seu uso no cabeçalho do Safeguard e no shell de turnos.
   - `useProdutos` deixa de expor `hasBoth`; passa a expor um único `productKey` (fail-closed).

2. Logins separados
   - `/login` → entrada do Ava Safeguard (identidade azul atual).
   - `/turnos/login` → entrada do produto de turnos (marca/cores do produto de restaurantes).
   - Após autenticar, o destino vem do produto da empresa, não da URL: Safeguard → `/app`, Turnos → `/restaurant/dashboard`.
   - Se a conta entrar pela porta errada, mostra aviso curto e redireciona para o produto correto (nunca dá acesso ao outro).

3. Cadastros separados por nicho
   - `/cadastro` → cria empresa com produto Safeguard.
   - `/turnos/cadastro` → cria empresa com produto Turnos (mesma estrutura de formulário, textos e marca do nicho).
   - O produto é gravado em `empresa_produtos` no momento da criação da empresa; nunca escolhido depois pelo usuário.

4. Bloqueio cruzado de rotas
   - `/app/*` exige produto Safeguard; `/restaurant/*` exige produto Turnos.
   - Acesso ao produto que não é o da empresa redireciona para o produto correto (sem tela de "solicite ativação" para o outro nicho).

5. Portal do colaborador isolado por produto
   - Empresa Turnos: abas Escala e Ponto.
   - Empresa Safeguard: abas EPIs, Holerites, Documentos, Ponto.
   - `/portal/login` identifica a empresa pelo CPF+PIN e já entrega o portal do produto certo; rotas do outro produto ficam indisponíveis.

## Dados existentes

Hoje as duas empresas têm apenas `restaurant_operations` habilitado e nenhum registro do Safeguard, o que quebraria a regra de produto único ao ligar o Safeguard automaticamente. Proposta de atribuição (ajustável antes de rodar):

- Ramos Epi → `safeguard_industrial` (a operação dela é de EPI: há entregas e kits).
- Elmtrx → `restaurant_operations`.

A alteração é feita por atualização de dados, sem apagar nada: desativa a linha que não corresponde e insere a do produto correto. Todas as tabelas dos dois produtos permanecem intactas.

## Detalhes técnicos

- Banco: nova restrição garantindo no máximo um produto habilitado por empresa (índice único parcial em `empresa_produtos` onde `enabled`), mais atualização das linhas atuais. RLS e grants existentes preservados.
- `useProdutos`: retorna `productKey | null` e `loading`; sem produto habilitado → sem acesso administrativo (fail-closed).
- `RequireProduct`: passa a comparar igualdade estrita com `productKey` e a redirecionar para a home do produto da empresa.
- `ProtectedRoute` continua aplicando o RBAC legado apenas em `/app/*`.
- Portal: o `portal-api` já valida entitlement; a resposta da sessão passa a informar o produto para a UI montar só as abas certas.
- Landing pages: CTAs do Safeguard apontam para `/login` e `/cadastro`; a página do produto de turnos aponta para `/turnos/login` e `/turnos/cadastro`.
