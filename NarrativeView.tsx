import React, { useState } from 'react'
import { useCampanha } from '../../store/CampaignStore'
import { useToast } from '../../store/ToastContext'
import { RegistroNarrativo, TipoRegistroNarrativo, StatusRegistroNarrativo } from '../../types'
import { novoId, agoraISO, formatarData } from '../../utils/id'
import Drawer from '../common/Drawer'
import ConfirmDialog from '../common/ConfirmDialog'
import { Badge, Campo, EstadoVazio, classeInput, classeSelect, classeTextarea } from '../common/Primitivos'

const TIPOS: { valor: TipoRegistroNarrativo; rotulo: string }[] = [
  { valor: 'subtrama', rotulo: 'Subtramas' },
  { valor: 'pista', rotulo: 'Pistas' },
  { valor: 'pergunta_sem_resposta', rotulo: 'Perguntas sem resposta' },
  { valor: 'dilema_moral', rotulo: 'Dilemas morais' },
  { valor: 'consequencia_pendente', rotulo: 'Consequências pendentes' },
  { valor: 'promessa', rotulo: 'Promessas' },
  { valor: 'divida', rotulo: 'Dívidas' },
  { valor: 'decisao_irreversivel', rotulo: 'Decisões irreversíveis' },
]

const STATUSES: StatusRegistroNarrativo[] = ['nao_iniciada', 'ativa', 'pausada', 'resolvida', 'perdida', 'transformada', 'desconhecida']

type Rascunho = Omit<RegistroNarrativo, 'id' | 'historico'>

function rascunhoVazio(tipo: TipoRegistroNarrativo, sessaoAtual: number): Rascunho {
  return {
    tipo,
    titulo: '',
    descricao: '',
    status: 'nao_iniciada',
    personagensEnvolvidos: [],
    episodioOrigem: sessaoAtual,
    ultimaAtualizacao: agoraISO(),
    proximaConsequenciaPossivel: '',
    conexoes: [],
    visivelProtagonista: true,
    historico: [],
  } as unknown as Rascunho
}

export default function NarrativeView() {
  const { estado, dispatch } = useCampanha()
  const { notificar } = useToast()

  const [abaAtiva, setAbaAtiva] = useState<TipoRegistroNarrativo>('subtrama')
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [editando, setEditando] = useState<RegistroNarrativo | null>(null)
  const [rascunho, setRascunho] = useState<Rascunho>(rascunhoVazio('subtrama', estado.episodioAtual))
  const [paraExcluir, setParaExcluir] = useState<RegistroNarrativo | null>(null)

  const registrosDaAba = estado.registrosNarrativos.filter((r) => r.tipo === abaAtiva)

  function abrirNovo() {
    setEditando(null)
    setRascunho(rascunhoVazio(abaAtiva, estado.episodioAtual))
    setDrawerAberto(true)
  }

  function abrirEdicao(r: RegistroNarrativo) {
    setEditando(r)
    setRascunho(r)
    setDrawerAberto(true)
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!rascunho.titulo.trim()) return
    if (editando) {
      dispatch({ tipo: 'UPDATE_NARRATIVA', id: editando.id, alteracoes: { ...rascunho, ultimaAtualizacao: agoraISO() }, descricao: 'Registro editado' })
      notificar(`"${rascunho.titulo}" atualizado.`)
    } else {
      const novo: RegistroNarrativo = {
        ...rascunho,
        id: novoId('narr'),
        historico: [{ id: novoId('hist'), data: agoraISO(), descricao: 'Registro criado' }],
      }
      dispatch({ tipo: 'ADD_NARRATIVA', registro: novo })
      notificar(`"${rascunho.titulo}" adicionado.`)
    }
    setDrawerAberto(false)
  }

  function excluirConfirmado() {
    if (!paraExcluir) return
    dispatch({ tipo: 'DELETE_NARRATIVA', id: paraExcluir.id })
    notificar(`"${paraExcluir.titulo}" removido.`)
    setParaExcluir(null)
  }

  function alternarPersonagem(id: string) {
    setRascunho((p) => ({
      ...p,
      personagensEnvolvidos: p.personagensEnvolvidos.includes(id)
        ? p.personagensEnvolvidos.filter((x) => x !== id)
        : [...p.personagensEnvolvidos, id],
    }))
  }

  function alternarConexao(id: string) {
    setRascunho((p) => ({
      ...p,
      conexoes: p.conexoes.includes(id) ? p.conexoes.filter((x) => x !== id) : [...p.conexoes, id],
    }))
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field-label">Registros narrativos</p>
          <h1 className="font-display text-2xl font-semibold text-marfim">Subtramas & Pistas</h1>
        </div>
        <button onClick={abrirNovo} className="btn-focus rounded bg-ambar px-3 py-1.5 text-sm font-medium text-carvao hover:bg-ambar-light">
          + Novo registro
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TIPOS.map((t) => (
          <button
            key={t.valor}
            onClick={() => setAbaAtiva(t.valor)}
            className={`btn-focus rounded border px-2.5 py-1 text-xs font-medium ${
              abaAtiva === t.valor ? 'border-ambar/50 bg-ambar/10 text-ambar-light' : 'border-metal text-marfim-dim hover:text-marfim'
            }`}
          >
            {t.rotulo} ({estado.registrosNarrativos.filter((r) => r.tipo === t.valor).length})
          </button>
        ))}
      </div>

      {registrosDaAba.length === 0 ? (
        <EstadoVazio titulo="Nenhum registro nesta categoria" descricao="Adicione um novo registro para começar a acompanhar esse fio narrativo." />
      ) : (
        <div className="space-y-2.5">
          {registrosDaAba.map((r) => (
            <div key={r.id} className="panel rounded border border-metal p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button onClick={() => abrirEdicao(r)} className="btn-focus truncate font-display text-sm font-semibold text-marfim hover:text-ambar-light">
                      {r.titulo}
                    </button>
                    <Badge tom={r.status === 'ativa' ? 'ciano' : r.status === 'perdida' ? 'ferrugem' : 'metal' as any}>{r.status.replace('_', ' ')}</Badge>
                  </div>
                  {r.descricao && <p className="mt-1 line-clamp-2 text-sm text-marfim-dim">{r.descricao}</p>}
                  {r.personagensEnvolvidos.length > 0 && (
                    <p className="mt-1 text-xs text-marfim-dim">
                      envolve:{' '}
                      {r.personagensEnvolvidos
                        .map((id) => estado.personagens.find((p) => p.id === id)?.nome)
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {r.conexoes.length > 0 && (
                    <p className="mt-1 text-xs text-ciano-light">
                      conectado a: {r.conexoes.map((id) => estado.registrosNarrativos.find((x) => x.id === id)?.titulo).filter(Boolean).join(', ')}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-[0.65rem] text-marfim-dim/60">
                    episódio {r.episodioOrigem} · atualizado {formatarData(r.ultimaAtualizacao)}
                  </p>
                </div>
                <button onClick={() => setParaExcluir(r)} className="btn-focus text-xs text-marfim-dim hover:text-ferrugem-light">
                  remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer aberto={drawerAberto} titulo={editando ? 'Editar registro' : 'Novo registro'} largura="lg" onFechar={() => setDrawerAberto(false)}>
        <form onSubmit={salvar}>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Tipo">
              <select
                className={classeSelect}
                value={rascunho.tipo}
                onChange={(e) => setRascunho((p) => ({ ...p, tipo: e.target.value as TipoRegistroNarrativo }))}
              >
                {TIPOS.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.rotulo}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Status">
              <select
                className={classeSelect}
                value={rascunho.status}
                onChange={(e) => setRascunho((p) => ({ ...p, status: e.target.value as StatusRegistroNarrativo }))}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
          <Campo rotulo="Título">
            <input className={classeInput} value={rascunho.titulo} onChange={(e) => setRascunho((p) => ({ ...p, titulo: e.target.value }))} required autoFocus />
          </Campo>
          <Campo rotulo="Descrição">
            <textarea className={classeTextarea} value={rascunho.descricao} onChange={(e) => setRascunho((p) => ({ ...p, descricao: e.target.value }))} />
          </Campo>
          <Campo rotulo="Próxima consequência possível">
            <textarea
              className={classeTextarea}
              value={rascunho.proximaConsequenciaPossivel}
              onChange={(e) => setRascunho((p) => ({ ...p, proximaConsequenciaPossivel: e.target.value }))}
            />
          </Campo>
          <Campo rotulo="Episódio de origem">
            <input
              type="number"
              min={0}
              className={classeInput}
              value={rascunho.episodioOrigem}
              onChange={(e) => setRascunho((p) => ({ ...p, episodioOrigem: Number(e.target.value) }))}
            />
          </Campo>

          {estado.personagens.length > 0 && (
            <div className="mb-3">
              <span className="field-label mb-1 block">Personagens envolvidos</span>
              <div className="flex flex-wrap gap-1.5">
                {estado.personagens.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => alternarPersonagem(p.id)}
                    className={`btn-focus rounded border px-2 py-1 text-xs ${
                      rascunho.personagensEnvolvidos.includes(p.id) ? 'border-ambar/50 bg-ambar/10 text-ambar-light' : 'border-metal text-marfim-dim'
                    }`}
                  >
                    {p.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          {estado.registrosNarrativos.filter((r) => r.id !== editando?.id).length > 0 && (
            <div className="mb-3">
              <span className="field-label mb-1 block">Conectar a outros registros</span>
              <div className="flex flex-wrap gap-1.5">
                {estado.registrosNarrativos
                  .filter((r) => r.id !== editando?.id)
                  .map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => alternarConexao(r.id)}
                      className={`btn-focus rounded border px-2 py-1 text-xs ${
                        rascunho.conexoes.includes(r.id) ? 'border-ciano/50 bg-ciano/10 text-ciano-light' : 'border-metal text-marfim-dim'
                      }`}
                    >
                      {r.titulo}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <label className="mb-3 flex items-center gap-2 text-sm text-marfim-dim">
            <input
              type="checkbox"
              checked={rascunho.visivelProtagonista}
              onChange={(e) => setRascunho((p) => ({ ...p, visivelProtagonista: e.target.checked }))}
            />
            Visível para o protagonista (desmarque para segredos exclusivos do narrador)
          </label>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setDrawerAberto(false)} className="btn-focus rounded border border-metal px-3 py-1.5 text-sm text-marfim-dim hover:text-marfim">
              Cancelar
            </button>
            <button type="submit" className="btn-focus rounded bg-ambar px-4 py-1.5 text-sm font-medium text-carvao hover:bg-ambar-light">
              Salvar registro
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        aberto={!!paraExcluir}
        titulo="Remover registro"
        mensagem={`Remover "${paraExcluir?.titulo}"?`}
        confirmarTexto="Remover"
        onConfirmar={excluirConfirmado}
        onCancelar={() => setParaExcluir(null)}
      />
    </div>
  )
}
