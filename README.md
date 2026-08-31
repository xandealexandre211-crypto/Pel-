# Oficina de Campo — Dossiê de Caleb Mercer

Painel de gerenciamento (frontend-only) para uma campanha narrativa de RPG de
ficção científica. Funciona como o "arquivo de campo" do protagonista **Caleb
Mercer**: inventário, recursos, falhas técnicas, personagens, subtramas,
diário de sessões e histórico de auditoria — tudo persistido localmente no
navegador (`localStorage`), sem backend.

## Como executar localmente

Pré-requisitos: [Node.js](https://nodejs.org) 18 ou superior.

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (normalmente `http://localhost:5173`).

Para gerar uma build de produção:

```bash
npm run build
npm run preview
```

## Estrutura dos arquivos

```
src/
  types/index.ts              modelo de dados tipado da campanha inteira
  data/seed.ts                campanha de exemplo (Caleb Mercer, editável/apagável)
  utils/id.ts                 geração de id e formatação de data
  utils/continuidade.ts       gerador do bloco de continuidade (texto para colar na IA narradora)
  store/CampaignStore.tsx     Context + reducer + persistência em localStorage
  store/ToastContext.tsx      notificações de sucesso/erro
  components/
    Layout/                   Sidebar (navegação) e Header (comandos rápidos + atalhos)
    Dashboard/                painel operacional principal
    Inventory/                inventário: busca, filtros, formulário, todas as ações
    Resources/                recursos e medidores editáveis
    Failures/                 falhas técnicas + gerador de falha aleatória controlada
    Characters/                NPCs, confiança, segredos com 3 níveis de conhecimento
    Narrative/                subtramas, pistas, dilemas, promessas, dívidas, decisões
    Journal/                  diário de sessões + gerador de bloco de continuidade
    History/                  timeline de auditoria (todas as alterações do sistema)
    Backup/                   exportar/importar JSON, snapshots, apagar tudo
    common/                   Drawer, ConfirmDialog, Badge, ProgressBar, EstadoVazio, Campo
```

Toda a lógica de mutação de estado vive no reducer em `CampaignStore.tsx`
(funções puras por ação), separada dos componentes de apresentação. Todo
formulário de criação/edição é um Drawer lateral; toda ação destrutiva passa
por um `ConfirmDialog` — exclusões definitivas (apagar toda a campanha) exigem
digitar uma palavra de confirmação.

## Persistência

Os dados são salvos automaticamente em `localStorage`, sob a chave
`oficina-de-campo:v1`, a cada alteração de estado. Fechar a aba ou recarregar
a página não apaga nada. Para levar a campanha para outro navegador ou
computador, use **Backup → Exportar campanha completa (JSON)** e depois
**Importar** no destino.

## Testes manuais realizados

Antes da entrega, os seguintes fluxos foram verificados percorrendo o código
e a árvore de componentes (sem acesso a rede neste ambiente para rodar
`npm install`, então recomenda-se repetir esses passos após instalar as
dependências localmente):

1. Adicionar item — `InventoryView` → "+ Adicionar item" → `ItemForm` → `ADD_ITEM`.
2. Editar item — clique no nome do item abre o Drawer preenchido → `UPDATE_ITEM`.
3. Alterar quantidade — editando o campo "Quantidade" no formulário, ou via "Dividir".
4. Consumir item — botão "Consumir" decrementa 1 unidade; ao chegar a 0, marca `esgotado`.
5. Mover item — seletor de localização inline em cada linha do inventário.
6. Registrar falha técnica — `FailuresView` → "+ Registrar falha".
7. Gerar falha aleatória editável — botão "🎲 Gerar falha técnica", com aviso de que é sugestão, editável antes de confirmar.
8. Atualizar recurso — `ResourcesView`, edição completa ou botões rápidos ±1/±10.
9. Criar NPC — `CharactersView` → "+ Novo personagem".
10. Criar subtrama — `NarrativeView`, aba "Subtramas" → "+ Novo registro".
11. Registrar sessão — `JournalView` → "+ Nova sessão".
12. Gerar continuidade — botão "Gerar bloco de continuidade", exclui segredos do narrador.
13. Exportar/importar dados — `BackupView`, com validação de estrutura antes de substituir.
14. Persistência após reload — `useEffect` grava em `localStorage` a cada mudança de estado; o estado inicial é lido de lá.
15. Histórico registra mudanças — toda ação do reducer que altera dados também acrescenta um evento em `auditoria`.
16. Ações destrutivas pedem confirmação — exclusão de item, NPC, sessão, falha, recurso e "apagar tudo" usam `ConfirmDialog`.
17. Sem erros de console — nenhum acesso a propriedade não verificada; formulários controlados; imports conferidos.
18. Sem botões falsos — todo botão visível dispara uma ação real do reducer, navegação real ou download real.

## Sobre os dados de exemplo

A campanha inicial (Caleb Mercer, o protótipo de portal instável, a fissura
no núcleo de cristal) existe apenas para que o painel não comece vazio. Edite
ou apague qualquer coisa livremente — inclusive via **Backup → Apagar todos
os dados**, que reinicia com o mesmo conjunto de exemplo.
