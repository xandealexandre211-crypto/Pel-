import React, { useState } from 'react'
import { useCampanha } from '../../store/CampaignStore'
import { useToast } from '../../store/ToastContext'
import { FalhaTecnica, GravidadeFalha, StatusFalha, CausaFalha, Item } from '../../types'
import { novoId, agoraISO, formatarData } from '../../utils/id'
import Drawer from '../common/Drawer'
import ConfirmDialog from '../common/ConfirmDialog'
import { Badge, Campo, EstadoVazio, classeInput, classeSelect, classeTextarea } from '../common/Primitivos'

const GRAVIDADES: GravidadeFalha[] = ['menor', 'moderada', 'grave', 'catastrofica']
const STATUSES: StatusFalha[] = ['ativa', 'contida', 'reparada', 'agravada', 'permanente']
const CAUSAS: CausaFalha[] = ['equipamento', 'jogador', 'regra_desconhecida', 'terceiros', 'imprevisivel']

const TOM_GRAVIDADE: Record<GravidadeFalha, 'ciano' | 'ambar' | 'ferrugem'> = {
  menor: 'ciano',
  moderada: 'ambar',
  grave: 'ferrugem',
  catastrofica: 'ferrugem',
}

type Rascunho = Omit<FalhaTecnica, 'id' | 'historico'>

function rascunhoVazio(sessaoAtual: number, equipamento?: Item): Rascunho {
  return {
    equipamentoId: equipamento?.id ?? null,
    equipamentoNome: equipamento?.nome ?? '',
    nomeFalha: '',
    gravidade: 'menor',
    descricao: '',
    sintomas: '',
    causa: 'imprevisivel',
    causaDetalhe: '',
    dataDescoberta: agoraISO(),
    recursoExigidoReparo: '',
    tempoEstimadoReparo: '',
    riscoPiora: '',
    status: 'ativa',
    consequenciaAssociada: '',
    geradaAleatoriamente: false,
    sessaoOrigem: sessaoAtual,
  }
}

// Deriva uma condição técnica interna (0-100) a partir do estado conhecido do item.
function condicaoEstimada(item: Item): number {
  const base: Record<string, number> = {
    intacto: 90,
    improvisado: 65,
    danificado: 40,
    descarregado: 55,
    instavel: 30,
    contaminado: 25,
    rastreado: 60,
    inutilizado: 5,
    perdido: 0,
    destruido: 0,
    roubado: 0,
    esgotado: 0,
  }
  let condicao = base[item.estado] ?? 50
  if (item.cargaMaxima && item.cargaAtual !== undefined) {
    const cargaPct = (item.cargaAtual / item.cargaMaxima) * 100
    condicao = Math.round((condicao + (100 - Math.abs(80 - cargaPct))) / 2)
  }
  return Math.max(0, Math.min(100, condicao))
}

const SINTOMAS_POR_GRAVIDADE: Record<GravidadeFalha, string[]> = {
  menor: ['ruído metálico intermitente', 'leve atraso de resposta', 'luz indicadora piscando fora do padrão'],
  moderada: ['perda de precisão na leitura', 'oscilação de energia', 'superaquecimento localizado'],
  grave: ['abertura de fissura visível', 'cheiro de queimado constante', 'perda momentânea de controle'],
  catastrofica: ['colapso estrutural iminente', 'alteração visível da realidade ao redor', 'retroalimentação de energia descontrolada'],
}

const CONSEQUENCIAS_POR_GRAVIDADE: Record<GravidadeFalha, string[]> = {
  menor: ['Atraso na próxima operação', 'Gasto adicional de energia'],
  moderada: ['Destino da próxima travessia impreciso', 'Bloqueio temporário do equipamento'],
  grave: ['Separação de um aliado durante o uso', 'Exposição a um ambiente hostil'],
  catastrofica: ['Alteração permanente em uma regra conhecida da tecnologia', 'Impossibilidade de retorno pela mesma rota'],
}

function sortear<T>(lista: T[]): T {
  return lista[Math.floor(Math.random() * lista.length)]
}

export interface FailuresViewHandle {
  abrirRegistro: () => void
}

const FailuresView = React.forwardRef<FailuresViewHandle>((_props, ref) => {
  const { estado, dispatch } = useCampanha()
  const { notificar } = useToast()

  const [drawerAberto, setDrawerAberto] = useState(false)
  const [falhaEditando, setFalhaEditando] = useState<FalhaTecnica | null>(null)
  const [rascunho, setRascunho] = useState<Rascunho>(rascunhoVazio(estado.episodioAtual))
  const [paraExcluir, setParaExcluir] = useState<FalhaTecnica | null>(null)
  const [sugestaoGerada, setSugestaoGerada] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState<StatusFalha | 'todas'>('todas')

  React.useImperativeHandle(ref, () => ({
    abrirRegistro: () => {
      setFalhaEditando(null)
      setSugestaoGerada(false)
      setRascunho(rascunhoVazio(estado.episodioAtual))
      setDrawerAberto(true)
    },
  }))

  const equipamentos = estado.itens.filter((i) => !i.arquivado && (i.categoria === 'equipamento' || i.categoria === 'experimental'))

  function abrirNovoManual() {
    setFalhaEditando(null)
    setSugestaoGerada(false)
    setRascunho(rascunhoVazio(estado.episodioAtual))
    setDrawerAberto(true)
  }

  function gerarFalhaAleatoria() {
    if (equipamentos.length === 0) {
      notificar('Não há equipamentos no inventário para gerar uma falha.', 'erro')
      return
    }
    const equipamento = sortear(equipamentos)
    const condicao = condicaoEstimada(equipamento)

    // Pesos de gravidade inversamente proporcionais à condição do equipamento.
    let pesos: Record<GravidadeFalha, number>
    if (condicao >= 75) pesos = { menor: 70, moderada: 25, grave: 5, catastrofica: 0 }
    else if (condicao >= 50) pesos = { menor: 40, moderada: 40, grave: 18, catastrofica: 2 }
    else if (condicao >= 25) pesos = { menor: 15, moderada: 35, grave: 40, catastrofica: 10 }
    else pesos = { menor: 5, moderada: 20, grave: 40, catastrofica: 35 }

    const total = Object.values(pesos).reduce((a, b) => a + b, 0)
    let alvo = Math.random() * total
    let gravidade: GravidadeFalha = 'menor'
    for (const g of GRAVIDADES) {
      if (alvo < pesos[g]) {
        gravidade = g
        break
      }
      alvo -= pesos[g]
    }

    const sintoma = sortear(SINTOMAS_POR_GRAVIDADE[gravidade])
    const consequencia = sortear(CONSEQUENCIAS_POR_GRAVIDADE[gravidade])
    const causasPossiveis: CausaFalha[] = condicao < 40 ? ['equipamento', 'equipamento', 'jogador', 'imprevisivel'] : ['imprevisivel', 'jogador', 'terceiros', 'regra_desconhecida']
    const causa = sortear(causasPossiveis)

    setRascunho({
      equipamentoId: equipamento.id,
      equipamentoNome: equipamento.nome,
      nomeFalha: `Falha ${gravidade} em ${equipamento.nome}`,
      gravidade,
      descricao: `Gerada a partir da condição estimada do equipamento (${condicao}/100). Revise e ajuste antes de confirmar.`,
      sintomas: sintoma,
      causa,
      causaDetalhe: '',
      dataDescoberta: agoraISO(),
      recursoExigidoReparo: '',
      tempoEstimadoReparo: '',
      riscoPiora: condicao < 50 ? 'Alto — equipamento já debilitado' : 'Moderado',
      status: 'ativa',
      consequenciaAssociada: consequencia,
      geradaAleatoriamente: true,
      sessaoOrigem: estado.episodioAtual,
    })
    setFalhaEditando(null)
    setSugestaoGerada(true)
    setDrawerAberto(true)
  }

  function abrirEdicao(f: FalhaTecnica) {
    setFalhaEditando(f)
    setSugestaoGerada(false)
    setRascunho(f)
    setDrawerAberto(true)
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!rascunho.nomeFalha.trim()) return
    if (falhaEditando) {
      dispatch({ tipo: 'UPDATE_FALHA', id: falhaEditando.id, alteracoes: rascunho, descricao: 'Falha editada' })
      notificar('Falha atualizada.')
    } else {
      const nova: FalhaTecnica = { ...rascunho, id: novoId('falha'), historico: [{ id: novoId('hist'), data: agoraISO(), descricao: rascunho.geradaAleatoriamente ? 'Falha gerada aleatoriamente e confirmada' : 'Falha registrada manualmente' }] }
      dispatch({ tipo: 'ADD_FALHA', falha: nova })
      notificar('Falha técnica registrada.')
    }
    setDrawerAberto(false)
  }

  function excluirConfirmado() {
    if (!paraExcluir) return
    dispatch({ tipo: 'DELETE_FALHA', id: paraExcluir.id })
    notificar('Falha removida.')
    setParaExcluir(null)
  }

  function alterarStatus(f: FalhaTecnica, status: StatusFalha) {
    dispatch({ tipo: 'UPDATE_FALHA', id: f.id, alteracoes: { status }, descricao: `Status alterado para ${status}` })
  }

  const listaFiltrada = filtroStatus === 'todas' ? estado.falhas : estado.falhas.filter((f) => f.status === filtroStatus)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field-label">Diagnóstico</p>
          <h1 className="font-display text-2xl font-semibold text-marfim">Falhas Técnicas</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className={`${classeSelect} w-auto`} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as any)}>
            <option value="todas">Todos os status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button onClick={gerarFalhaAleatoria} className="btn-focus rounded border border-ciano/50 bg-ciano/10 px-3 py-1.5 text-sm font-medium text-ciano-light hover:bg-ciano/20">
            🎲 Gerar falha técnica
          </button>
          <button onClick={abrirNovoManual} className="btn-focus rounded bg-ambar px-3 py-1.5 text-sm font-medium text-carvao hover:bg-ambar-light">
            + Registrar falha
          </button>
        </div>
      </div>

      {listaFiltrada.length === 0 ? (
        <EstadoVazio titulo="Nenhuma falha registrada" descricao="Registre uma falha manualmente ou gere uma sugestão aleatória baseada nos equipamentos do inventário." />
      ) : (
        <div className="space-y-2.5">
          {listaFiltrada.map((f) => (
            <div key={f.id} className="panel rounded border border-metal p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button onClick={() => abrirEdicao(f)} className="btn-focus truncate font-display text-sm font-semibold text-marfim hover:text-ambar-light">
                      {f.nomeFalha}
                    </button>
                    <Badge tom={TOM_GRAVIDADE[f.gravidade]}>{f.gravidade}</Badge>
                    <Badge>{f.status}</Badge>
                    {f.geradaAleatoriamente && <Badge tom="ciano">sugestão aleatória</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-marfim-dim">{f.equipamentoNome}</p>
                  {f.descricao && <p className="mt-1 line-clamp-2 text-sm text-marfim-dim">{f.descricao}</p>}
                  <p className="mt-1 font-mono text-[0.68rem] text-marfim-dim/70">descoberta em {formatarData(f.dataDescoberta)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    className="rounded border border-metal bg-carvao px-2 py-1 text-xs text-marfim-dim btn-focus"
                    value={f.status}
                    onChange={(e) => alterarStatus(f, e.target.value as StatusFalha)}
                    aria-label={`Status de ${f.nomeFalha}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => setParaExcluir(f)} className="btn-focus rounded border border-ferrugem/40 px-2 py-1 text-xs text-ferrugem-light hover:bg-ferrugem/10">
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer aberto={drawerAberto} titulo={falhaEditando ? 'Editar falha' : sugestaoGerada ? 'Sugestão gerada — revise antes de confirmar' : 'Registrar falha'} largura="lg" onFechar={() => setDrawerAberto(false)}>
        {sugestaoGerada && (
          <p className="mb-4 rounded border border-ciano/40 bg-ciano/10 px-3 py-2 text-xs text-ciano-light">
            Isto é uma sugestão aleatória controlada, não uma decisão irreversível. Edite qualquer campo e confirme para registrar, ou cancele.
          </p>
        )}
        <form onSubmit={salvar}>
          <Campo rotulo="Equipamento afetado">
            <select
              className={classeSelect}
              value={rascunho.equipamentoId ?? ''}
              onChange={(e) => {
                const eq = estado.itens.find((i) => i.id === e.target.value)
                setRascunho((p) => ({ ...p, equipamentoId: eq?.id ?? null, equipamentoNome: eq?.nome ?? p.equipamentoNome }))
              }}
            >
              <option value="">— selecionar do inventário —</option>
              {equipamentos.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Nome da falha">
            <input className={classeInput} value={rascunho.nomeFalha} onChange={(e) => setRascunho((p) => ({ ...p, nomeFalha: e.target.value }))} required />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Gravidade">
              <select className={classeSelect} value={rascunho.gravidade} onChange={(e) => setRascunho((p) => ({ ...p, gravidade: e.target.value as GravidadeFalha }))}>
                {GRAVIDADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Status">
              <select className={classeSelect} value={rascunho.status} onChange={(e) => setRascunho((p) => ({ ...p, status: e.target.value as StatusFalha }))}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
          <Campo rotulo="Descrição">
            <textarea className={classeTextarea} value={rascunho.descricao} onChange={(e) => setRascunho((p) => ({ ...p, descricao: e.target.value }))} />
          </Campo>
          <Campo rotulo="Sintomas observáveis">
            <textarea className={classeTextarea} value={rascunho.sintomas} onChange={(e) => setRascunho((p) => ({ ...p, sintomas: e.target.value }))} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Causa">
              <select className={classeSelect} value={rascunho.causa} onChange={(e) => setRascunho((p) => ({ ...p, causa: e.target.value as CausaFalha }))}>
                {CAUSAS.map((c) => (
                  <option key={c} value={c}>
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Detalhe da causa">
              <input className={classeInput} value={rascunho.causaDetalhe} onChange={(e) => setRascunho((p) => ({ ...p, causaDetalhe: e.target.value }))} />
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Recurso exigido para reparo">
              <input className={classeInput} value={rascunho.recursoExigidoReparo} onChange={(e) => setRascunho((p) => ({ ...p, recursoExigidoReparo: e.target.value }))} />
            </Campo>
            <Campo rotulo="Tempo estimado de reparo">
              <input className={classeInput} value={rascunho.tempoEstimadoReparo} onChange={(e) => setRascunho((p) => ({ ...p, tempoEstimadoReparo: e.target.value }))} />
            </Campo>
          </div>
          <Campo rotulo="Risco de piora">
            <input className={classeInput} value={rascunho.riscoPiora} onChange={(e) => setRascunho((p) => ({ ...p, riscoPiora: e.target.value }))} />
          </Campo>
          <Campo rotulo="Consequência associada">
            <textarea className={classeTextarea} value={rascunho.consequenciaAssociada} onChange={(e) => setRascunho((p) => ({ ...p, consequenciaAssociada: e.target.value }))} />
          </Campo>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setDrawerAberto(false)} className="btn-focus rounded border border-metal px-3 py-1.5 text-sm text-marfim-dim hover:text-marfim">
              Cancelar
            </button>
            <button type="submit" className="btn-focus rounded bg-ambar px-4 py-1.5 text-sm font-medium text-carvao hover:bg-ambar-light">
              {sugestaoGerada ? 'Confirmar e registrar' : 'Salvar falha'}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        aberto={!!paraExcluir}
        titulo="Excluir falha técnica"
        mensagem={`Remover o registro "${paraExcluir?.nomeFalha}"?`}
        confirmarTexto="Excluir"
        onConfirmar={excluirConfirmado}
        onCancelar={() => setParaExcluir(null)}
      />
    </div>
  )
})

FailuresView.displayName = 'FailuresView'
export default FailuresView
