

## Plano: Refatorar Disparo de Holerites para Upload Individual por Funcionário

### Problema
No modo "Envio em Lote", o sistema envia o **mesmo PDF** para todos os funcionários. Cada holerite é único por funcionário, então isso não funciona na prática.

### Solução
Reformular o modal para suportar **upload de múltiplos PDFs**, um por funcionário, com uma interface clara para associar cada arquivo ao funcionário correto.

### Arquitetura do Novo Modal

**Modo "Um Funcionário"** (mantém como está):
- Seleciona funcionário, anexa 1 PDF, dispara.

**Modo "Envio em Lote"** (novo fluxo):
- Seleciona o mês de referência.
- Exibe a lista de funcionários ativos em uma tabela/lista com:
  - Nome | Setor | Arquivo (botão de upload individual ou drag-and-drop)
- O RH anexa o PDF de cada funcionário na linha correspondente.
- Dica de UX: aceitar também um **upload múltiplo** onde os arquivos são nomeados com o nome ou CPF do funcionário (ex: `joao_silva.pdf`, `12345678900.pdf`) e o sistema tenta fazer o match automático.
- Botão "Disparar Todos" só fica habilitado quando pelo menos 1 arquivo foi associado.
- Processa apenas os funcionários que têm arquivo anexado.

### Etapas Técnicas

**1. Refatorar `NovoHoleriteModal.tsx`**
- Adicionar estado `fileMap: Record<string, File>` para mapear `funcionario_id → File`.
- No modo lote, renderizar lista de funcionários com input de arquivo individual por linha.
- Adicionar lógica de **auto-match** por nome de arquivo: ao fazer upload múltiplo, comparar nome do arquivo (normalizado) com `nome` ou `cpf` do funcionário.
- Mostrar badge verde nos funcionários que já têm arquivo associado.
- No submit, iterar apenas sobre os funcionários com arquivo no `fileMap`.

**2. Ajustar o loop de envio**
- Em vez de usar o mesmo `file` para todos, pegar `fileMap[func.id]` para cada funcionário.
- O base64 e upload ao storage usam o arquivo correto de cada um.

**3. UX do auto-match**
- Ao selecionar múltiplos arquivos, normalizar o nome (remover acentos, lowercase) e comparar com o nome/CPF dos funcionários.
- Mostrar resultado do match: "12 de 15 funcionários associados automaticamente".
- Permitir correção manual nos não-associados.

### Sem alterações no banco de dados
A estrutura da tabela `documents` e do storage permanece a mesma. A mudança é puramente no frontend.

