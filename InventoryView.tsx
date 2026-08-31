import React, { useMemo, useState } from 'react'
import { useCampanha } from '../../store/CampaignStore'
import { useToast } from '../../store/ToastContext'
import { Item, Localizacao, CategoriaItem } from '../../types'
import { novoId, agoraISO, formatarData } from '../../utils/id'
import Drawer from '../common/Drawer'
import ConfirmDialog from '../common/ConfirmDialog'
import { Badge, EstadoVazio, classeInput, classeSelect } from '../common/Primitivos'
import ItemForm, { RascunhoItem, rascunhoVazio } from './ItemForm'

const LOCALIZACOES: (Localizacao | 'todas')[] = [
  'todas',
  'carregado',
  'laboratorio',
  'veiculo',
  'base',
  'outra_realidade',
  'desconhecida',
]
const CATEGORIAS: (CategoriaItem | 'todas')[] = ['todas', 'equipamento', 'objeto_base', 'consumivel', 'narrativo', 'experimental']

type Ordenacao = 'nome' | 'quantidade' | 'peso'

export interface InventoryViewHandle {
  abrirNovoItem: () => void
}

const InventoryView = React.forwardRef<InventoryViewHandle>((_props, ref) => {
  const { estado, dispatch, salvarSnapshotItens, desfazerItens } = useCampanha()
  const { notificar } = useToast()

  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaItem | 'todas'>('todas')
  const [filtroLocalizacao, setFiltroLocalizacao] = useState<Localizacao | 'todas'>('todas')
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('nome')
  const [mostrarArquivados, setMostrarArquivados] = useState(false)

  const [drawerAberto, setDrawerAberto] = useState(false)
  const [itemEditando, setItemEditando] = useState<Item | null>(null)
  const [itemParaExcluir, setItemParaExcluir] = useState<Item | null>(null)
  const [selecionados, setSelecionados] = useState<string[]>([])

  React.useImperativeHandle(ref, () => ({
    abrirNovoItem: () => {
      setItemEditando(null)
      setDrawerAberto(true)
    },
  }))

  const itensFiltrados = useMemo(() => {
    let lista = estado.itens.filter((i) => i.arquivado === mostrarArquivados)
    if (busca.trim()) {
      const b = busca.toLowerCase()
      lista = lista.filter(
        (i) => i.nome.toLowerCase().includes(b) || i.tags.some((t) => t.toLowerCase().includes(b)) || i.descricao.toLowerCase().includes(b),
      )
    }
    if (filtroCategoria !== 'todas') lista = lista.filter((i) => i.categoria === filtroCategoria)
    if (filtroLocalizacao !== 'todas') lista = lista.filter((i) => i.localizacao === filtroLocalizacao)
    lista = [...lista].sort((a, b) => {
      if (ordenacao === 'nome') return a.nome.localeCompare(b.nome)
      if (ordenacao === 'quantidade') return b.quantidade - a.quantidade
      return b.pesoOuEspaco - a.pesoOuEspaco
    })
    return lista
  }, [estado.itens, busca, filtroCategoria, filtroLocalizacao, ordenacao, mostrarArquivados])

  function abrirEdicao(item: Item) {
    setItemEditando(item)
    setDrawerAberto(true)
  }

  function salvar(rascunho: RascunhoItem) {
    if (itemEditando) {
      dispatch({
        tipo: 'UPDATE_ITEM',
        id: itemEditando.id,
        alteracoes: rascunho,
        descricao: 'Item editado',
      })
      notificar(`"${rascunho.nome}" atualizado.`)
    } else {
      const novo: Item = { ...rascunho, id: novoId('item'), arquivado: false, historico: [{ id: novoId('hist'), data: agoraISO(), descricao: 'Item criado' }] }
      dispatch({ tipo: 'ADD_ITEM', item: novo })
      notificar(`"${rascunho.nome}" adicionado ao inventário.`)
    }
    setDrawerAberto(false)
    setItemEditando(null)
  }

  function consumir(item: Item) {
    salvarSnapshotItens()
    if (item.quantidade <= 1) {
      dispatch({
        tipo: 'UPDATE_ITEM',
        id: item.id,
        alteracoes: { quantidade: 0, estado: 'esgotado' },
        descricao: 'Item totalmente consumido — marcado como esgotado',
      })
      notificar(`"${item.nome}" foi totalmente consumido.`)
    } else {
      dispatch({
        tipo: 'UPDATE_ITEM',
        id: item.id,
        alteracoes: { quantidade: item.quantidade - 1 },
        descricao: 'Uma unidade consumida',
      })
      notificar(`Consumida 1 unidade de "${item.nome}".`)
    }
  }

  function mover(item: Item, destino: Localizacao) {
    salvarSnapshotItens()
    dispatch({
      tipo: 'UPDATE_ITEM',
      id: item.id,
      alteracoes: { localizacao: destino },
      descricao: `Movido de ${item.localizacao} para ${destino}`,
    })
    notificar(`"${item.nome}" movido para ${destino.replace('_', ' ')}.`)
  }

  function duplicar(item: Item) {
    salvarSnapshotItens()
    dispatch({ tipo: 'DUPLICATE_ITEM', id: item.id })
    notificar(`"${item.nome}" duplicado.`)
  }

  function arquivar(item: Item, valor: boolean) {
    salvarSnapshotItens()
    dispatch({ tipo: 'ARCHIVE_ITEM', id: item.id, arquivar: valor })
    notificar(valor ? `"${item.nome}" arquivado.` : `"${item.nome}" restaurado.`)
  }

  function marcarComo(item: Item, estadoNovo: Item['estado']) {
    salvarSnapshotItens()
    dispatch({ tipo: 'UPDATE_ITEM', id: item.id, alteracoes: { estado: estadoNovo }, descricao: `Marcado como ${estadoNovo}` })
    notificar(`"${item.nome}" marcado como ${estadoNovo}.`)
  }

  function excluirConfirmado() {
    if (!itemParaExcluir) return
    salvarSnapshotItens()
    dispatch({ tipo: 'DELETE_ITEM', id: itemParaExcluir.id })
    notificar(`"${itemParaExcluir.nome}" excluído.`)
    setItemParaExcluir(null)
  }

  function dividirQuantidade(item: Item) {
    const resposta = window.prompt(`Dividir "${item.nome}" (quantidade atual: ${item.quantidade}). Quanto mover para um novo item?`, '1')
    if (!resposta) return
    const qtd = Number(resposta)
    if (!qtd || qtd <= 0 || qtd >= item.quantidade) {
      notificar('Quantidade inválida para divisão.', 'erro')
      return
    }
    salvarSnapshotItens()
    dispatch({ tipo: 'UPDATE_ITEM', id: item.id, alteracoes: { quantidade: item.quantidade - qtd }, descricao: `Dividido: ${qtd} unidades removidas` })
    const novo: Item = {
      ...item,
      id: novoId('item'),
      quantidade: qtd,
      historico: [{ id: novoId('hist'), data: agoraISO(), descricao: `Criado a partir da divisão de "${item.nome}"` }],
    }
    dispatch({ tipo: 'ADD_ITEM', item: novo })
    notificar(`"${item.nome}" dividido em dois itens.`)
  }

  function alternarSelecao(id: string) {
    setSelecionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function combinarSelecionados() {
    if (selecionados.length !== 2) return
    const [aId, bId] = selecionados
    const a = estado.itens.find((i) => i.id === aId)
    const b = estado.itens.find((i) => i.id === bId)
    if (!a || !b) return
    if (a.nome.trim().toLowerCase() !== b.nome.trim().toLowerCase()) {
      notificar('Só é possível combinar itens com o mesmo nome.', 'erro')
      return
    }
    salvarSnapshotItens()
    dispatch({
      tipo: 'UPDATE_ITEM',
      id: a.id,
      alteracoes: { quantidade: a.quantidade + b.quantidade },
      descricao: `Combinado com ${b.quantidade} unidade(s) de item duplicado`,
    })
    dispatch({ tipo: 'DELETE_ITEM', id: b.id })
    notificar(`Itens combinados em "${a.nome}".`)
    setSelecionados([])
  }

  function desfazer() {
    const ok = desfazerItens()
    notificar(ok ? 'Última alteração no inventário desfeita.' : 'Não há alteração recente para desfazer.', ok ? 'sucesso' : 'erro')
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field-label">Arquivo de campo</p>
          <h1 className="font-display text-2xl font-semibold text-marfim">Inventário</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={desfazer} className="btn-focus rounded border border-metal px-3 py-1.5 text-sm text-marfim-dim hover:text-marfim">
            Desfazer última alteração
          </button>
          {selecionados.length === 2 && (
            <button
              onClick={combinarSelecionados}
              className="btn-focus rounded border border-ciano/50 bg-ciano/10 px-3 py-1.5 text-sm text-ciano-light hover:bg-ciano/20"
            >
              Combinar selecionados
            </button>
          )}
          <button
            onClick={() => {
              setItemEditando(null)
              setDrawerAberto(true)
            }}
            className="btn-focus rounded bg-ambar px-3 py-1.5 text-sm font-medium text-carvao hover:bg-ambar-light"
          >
            + Adicionar item
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          placeholder="Buscar por nome, tag ou descrição…"
          className={`${classeInput} max-w-xs`}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select className={`${classeSelect} w-auto`} value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value as any)}>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c === 'todas' ? 'Todas categorias' : c.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select className={`${classeSelect} w-auto`} value={filtroLocalizacao} onChange={(e) => setFiltroLocalizacao(e.target.value as any)}>
          {LOCALIZACOES.map((l) => (
            <option key={l} value={l}>
              {l === 'todas' ? 'Todas localizações' : l.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select className={`${classeSelect} w-auto`} value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}>
          <option value="nome">Ordenar por nome</option>
          <option value="quantidade">Ordenar por quantidade</option>
          <option value="peso">Ordenar por peso/espaço</option>
        </select>
        <button
          onClick={() => setMostrarArquivados((v) => !v)}
          className={`btn-focus rounded border px-3 py-1.5 text-sm ${
            mostrarArquivados ? 'border-ambar/50 bg-ambar/10 text-ambar-light' : 'border-metal text-marfim-dim hover:text-marfim'
          }`}
        >
          {mostrarArquivados ? 'Vendo arquivados' : 'Ver arquivados'}
        </button>
      </div>

      {itensFiltrados.length === 0 ? (
        <EstadoVazio
          titulo={mostrarArquivados ? 'Nenhum item arquivado' : 'Nenhum item encontrado'}
          descricao={
            mostrarArquivados
              ? 'Itens arquivados aparecerão aqui.'
              : 'Ajuste os filtros ou adicione o primeiro item ao arquivo de campo de Caleb.'
          }
        />
      ) : (
        <div className="space-y-2.5">
          {itensFiltrados.map((item) => (
            <div key={item.id} className="panel rounded border border-metal p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <input
                    type="checkbox"
                    className="mt-1.5"
                    checked={selecionados.includes(item.id)}
                    onChange={() => alternarSelecao(item.id)}
                    aria-label={`Selecionar ${item.nome} para combinar`}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button onClick={() => abrirEdicao(item)} className="btn-focus truncate font-display text-sm font-semibold text-marfim hover:text-ambar-light">
                        {item.nome}
                      </button>
                      <Badge>{item.categoria.replace('_', ' ')}</Badge>
                      <Badge tom={item.estado === 'intacto' ? 'ciano' : ['destruido', 'inutilizado', 'esgotado', 'perdido', 'roubado'].includes(item.estado) ? 'ferrugem' : 'ambar'}>
                        {item.estado}
                      </Badge>
                      <Badge>{item.localizacao.replace('_', ' ')}</Badge>
                    </div>
                    {item.descricao && <p className="mt-1 line-clamp-2 text-sm text-marfim-dim">{item.descricao}</p>}
                    <p className="mt-1 font-mono text-[0.68rem] text-marfim-dim/70">
                      qtd {item.quantidade} · peso/espaço {item.pesoOuEspaco}
                      {item.cargaMaxima ? ` · carga ${item.cargaAtual ?? 0}/${item.cargaMaxima}` : ''} · obtido sessão {item.sessaoObtido}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <select
                    className="rounded border border-metal bg-carvao px-2 py-1 text-xs text-marfim-dim btn-focus"
                    value={item.localizacao}
                    onChange={(e) => mover(item, e.target.value as Localizacao)}
                    aria-label={`Mover ${item.nome}`}
                  >
                    {LOCALIZACOES.filter((l) => l !== 'todas').map((l) => (
                      <option key={l} value={l}>
                        {l.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  <BotaoAcao onClick={() => consumir(item)} disabled={item.quantidade === 0}>
                    Consumir
                  </BotaoAcao>
                  <BotaoAcao onClick={() => dividirQuantidade(item)} disabled={item.quantidade <= 1}>
                    Dividir
                  </BotaoAcao>
                  <BotaoAcao onClick={() => duplicar(item)}>Duplicar</BotaoAcao>
                  {!mostrarArquivados ? (
                    <BotaoAcao onClick={() => arquivar(item, true)}>Arquivar</BotaoAcao>
                  ) : (
                    <BotaoAcao onClick={() => arquivar(item, false)}>Restaurar</BotaoAcao>
                  )}
                  <select
                    className="rounded border border-metal bg-carvao px-2 py-1 text-xs text-marfim-dim btn-focus"
                    value=""
                    onChange={(e) => e.target.value && marcarComo(item, e.target.value as Item['estado'])}
                    aria-label={`Marcar estado de ${item.nome}`}
                  >
                    <option value="">Marcar como…</option>
                    <option value="perdido">Perdido</option>
                    <option value="destruido">Destruído</option>
                    <option value="roubado">Roubado</option>
                    <option value="contaminado">Contaminado</option>
                    <option value="rastreado">Rastreado</option>
                  </select>
                  <BotaoAcao onClick={() => setItemParaExcluir(item)} perigo>
                    Excluir
                  </BotaoAcao>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer
        aberto={drawerAberto}
        titulo={itemEditando ? 'Editar item' : 'Adicionar item'}
        subtitulo={itemEditando ? `Última atualização: ${formatarData(itemEditando.historico.at(-1)?.data ?? '')}` : undefined}
        onFechar={() => {
          setDrawerAberto(false)
          setItemEditando(null)
        }}
      >
        <ItemForm
          inicial={
            itemEditando
              ? {
                  nome: itemEditando.nome,
                  categoria: itemEditando.categoria,
                  descricao: itemEditando.descricao,
                  quantidade: itemEditando.quantidade,
                  pesoOuEspaco: itemEditando.pesoOuEspaco,
                  localizacao: itemEditando.localizacao,
                  estado: itemEditando.estado,
                  cargaAtual: itemEditando.cargaAtual,
                  cargaMaxima: itemEditando.cargaMaxima,
                  origem: itemEditando.origem,
                  funcaoConhecida: itemEditando.funcaoConhecida,
                  limitacoesConhecidas: itemEditando.limitacoesConhecidas,
                  riscosConhecidos: itemEditando.riscosConhecidos,
                  informacoesDesconhecidas: itemEditando.informacoesDesconhecidas,
                  tags: itemEditando.tags,
                  observacoes: itemEditando.observacoes,
                  sessaoObtido: itemEditando.sessaoObtido,
                  dataObtido: itemEditando.dataObtido,
                }
              : rascunhoVazio(estado.episodioAtual)
          }
          onSalvar={salvar}
          onCancelar={() => {
            setDrawerAberto(false)
            setItemEditando(null)
          }}
        />
      </Drawer>

      <ConfirmDialog
        aberto={!!itemParaExcluir}
        titulo="Excluir item"
        mensagem={`Tem certeza de que deseja excluir "${itemParaExcluir?.nome}"? Essa ação não pode ser desfeita pelo botão "desfazer".`}
        confirmarTexto="Excluir item"
        onConfirmar={excluirConfirmado}
        onCancelar={() => setItemParaExcluir(null)}
      />
    </div>
  )
})

function BotaoAcao({
  children,
  onClick,
  disabled,
  perigo,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  perigo?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-focus rounded border px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        perigo ? 'border-ferrugem/40 text-ferrugem-light hover:bg-ferrugem/10' : 'border-metal text-marfim-dim hover:border-ciano/40 hover:text-ciano-light'
      }`}
    >
      {children}
    </button>
  )
}

InventoryView.displayName = 'InventoryView'
export default InventoryView
