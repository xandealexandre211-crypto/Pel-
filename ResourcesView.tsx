import React, { useState } from 'react'
import { useCampanha } from '../../store/CampaignStore'
import { useToast } from '../../store/ToastContext'
import { Recurso, CorAlerta } from '../../types'
import { novoId, agoraISO, formatarData } from '../../utils/id'
import Drawer from '../common/Drawer'
import ConfirmDialog from '../common/ConfirmDialog'
import { Campo, ProgressBar, EstadoVazio, classeInput, classeSelect, classeTextarea } from '../common/Primitivos'

export interface ResourcesViewHandle {
  abrirAlteracaoRapida: () => void
}

const ResourcesView = React.forwardRef<ResourcesViewHandle>((_props, ref) => {
  const { estado, dispatch } = useCampanha()
  const { notificar } = useToast()

  const [drawerAberto, setDrawerAberto] = useState(false)
  const [recursoEditando, setRecursoEditando] = useState<Recurso | null>(null)
  const [paraExcluir, setParaExcluir] = useState<Recurso | null>(null)
  const [rascunho, setRascunho] = useState({
    nome: '',
    valorAtual: 0,
    valorMaximo: undefined as number | undefined,
    unidade: '',
    descricao: '',
    corAlerta: 'ciano' as CorAlerta,
  })

  React.useImperativeHandle(ref, () => ({
    abrirAlteracaoRapida: () => {
      if (estado.recursos.length > 0) abrirEdicao(estado.recursos[0])
      else abrirNovo()
    },
  }))

  function abrirNovo() {
    setRecursoEditando(null)
    setRascunho({ nome: '', valorAtual: 0, valorMaximo: undefined, unidade: '', descricao: '', corAlerta: 'ciano' })
    setDrawerAberto(true)
  }

  function abrirEdicao(r: Recurso) {
    setRecursoEditando(r)
    setRascunho({
      nome: r.nome,
      valorAtual: r.valorAtual,
      valorMaximo: r.valorMaximo,
      unidade: r.unidade,
      descricao: r.descricao,
      corAlerta: r.corAlerta,
    })
    setDrawerAberto(true)
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!rascunho.nome.trim()) return
    if (recursoEditando) {
      dispatch({
        tipo: 'UPDATE_RECURSO',
        id: recursoEditando.id,
        alteracoes: rascunho,
        descricao: `Valor alterado de ${recursoEditando.valorAtual} para ${rascunho.valorAtual}`,
      })
      notificar(`"${rascunho.nome}" atualizado.`)
    } else {
      const novo: Recurso = {
        ...rascunho,
        id: novoId('rec'),
        historico: [{ id: novoId('hist'), data: agoraISO(), descricao: 'Recurso criado' }],
      }
      dispatch({ tipo: 'ADD_RECURSO', recurso: novo })
      notificar(`"${rascunho.nome}" adicionado aos recursos.`)
    }
    setDrawerAberto(false)
  }

  function ajusteRapido(r: Recurso, delta: number) {
    const novoValor = r.valorMaximo !== undefined ? Math.max(0, Math.min(r.valorMaximo, r.valorAtual + delta)) : Math.max(0, r.valorAtual + delta)
    dispatch({
      tipo: 'UPDATE_RECURSO',
      id: r.id,
      alteracoes: { valorAtual: novoValor },
      descricao: `Ajuste rápido: ${delta > 0 ? '+' : ''}${delta}`,
    })
  }

  function excluirConfirmado() {
    if (!paraExcluir) return
    dispatch({ tipo: 'DELETE_RECURSO', id: paraExcluir.id })
    notificar(`"${paraExcluir.nome}" removido dos recursos.`)
    setParaExcluir(null)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field-label">Telemetria</p>
          <h1 className="font-display text-2xl font-semibold text-marfim">Recursos & Medidores</h1>
        </div>
        <button onClick={abrirNovo} className="btn-focus rounded bg-ambar px-3 py-1.5 text-sm font-medium text-carvao hover:bg-ambar-light">
          + Novo recurso
        </button>
      </div>

      {estado.recursos.length === 0 ? (
        <EstadoVazio titulo="Nenhum recurso cadastrado" descricao="Adicione medidores como energia, combustível ou dinheiro disponível." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {estado.recursos.map((r) => {
            const tom = r.corAlerta === 'ferrugem' ? 'ferrugem' : r.corAlerta === 'ambar' ? 'ambar' : 'ciano'
            return (
              <div key={r.id} className="panel rounded border border-metal p-4">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => abrirEdicao(r)} className="btn-focus text-left font-display text-sm font-semibold text-marfim hover:text-ambar-light">
                    {r.nome}
                  </button>
                  <button onClick={() => setParaExcluir(r)} className="btn-focus text-xs text-marfim-dim hover:text-ferrugem-light">
                    remover
                  </button>
                </div>
                <p className="mt-1 font-mono text-2xl text-marfim">
                  {r.valorAtual}
                  {r.valorMaximo !== undefined && <span className="text-sm text-marfim-dim">/{r.valorMaximo}</span>}
                  <span className="ml-1 text-sm text-marfim-dim">{r.unidade}</span>
                </p>
                {r.valorMaximo !== undefined && (
                  <div className="mt-2">
                    <ProgressBar valor={r.valorAtual} maximo={r.valorMaximo} tom={tom} />
                  </div>
                )}
                {r.descricao && <p className="mt-2 text-sm text-marfim-dim">{r.descricao}</p>}
                <div className="mt-3 flex gap-1.5">
                  <button onClick={() => ajusteRapido(r, -1)} className="btn-focus rounded border border-metal px-2 py-1 text-xs text-marfim-dim hover:text-marfim">
                    −1
                  </button>
                  <button onClick={() => ajusteRapido(r, 1)} className="btn-focus rounded border border-metal px-2 py-1 text-xs text-marfim-dim hover:text-marfim">
                    +1
                  </button>
                  <button onClick={() => ajusteRapido(r, -10)} className="btn-focus rounded border border-metal px-2 py-1 text-xs text-marfim-dim hover:text-marfim">
                    −10
                  </button>
                  <button onClick={() => ajusteRapido(r, 10)} className="btn-focus rounded border border-metal px-2 py-1 text-xs text-marfim-dim hover:text-marfim">
                    +10
                  </button>
                </div>
                {r.historico.length > 0 && (
                  <p className="mt-2 font-mono text-[0.65rem] text-marfim-dim/60">
                    última alteração {formatarData(r.historico.at(-1)!.data)}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Drawer aberto={drawerAberto} titulo={recursoEditando ? 'Editar recurso' : 'Novo recurso'} onFechar={() => setDrawerAberto(false)}>
        <form onSubmit={salvar}>
          <Campo rotulo="Nome">
            <input
              className={classeInput}
              value={rascunho.nome}
              onChange={(e) => setRascunho((p) => ({ ...p, nome: e.target.value }))}
              required
              autoFocus
            />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Valor atual">
              <input
                type="number"
                className={classeInput}
                value={rascunho.valorAtual}
                onChange={(e) => setRascunho((p) => ({ ...p, valorAtual: Number(e.target.value) }))}
              />
            </Campo>
            <Campo rotulo="Valor máximo (opcional)">
              <input
                type="number"
                className={classeInput}
                value={rascunho.valorMaximo ?? ''}
                onChange={(e) => setRascunho((p) => ({ ...p, valorMaximo: e.target.value === '' ? undefined : Number(e.target.value) }))}
              />
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Unidade">
              <input
                className={classeInput}
                placeholder="%, USD, minutos…"
                value={rascunho.unidade}
                onChange={(e) => setRascunho((p) => ({ ...p, unidade: e.target.value }))}
              />
            </Campo>
            <Campo rotulo="Cor de alerta">
              <select
                className={classeSelect}
                value={rascunho.corAlerta}
                onChange={(e) => setRascunho((p) => ({ ...p, corAlerta: e.target.value as CorAlerta }))}
              >
                <option value="ciano">Ciano — normal</option>
                <option value="ambar">Âmbar — atenção</option>
                <option value="ferrugem">Ferrugem — perigo</option>
              </select>
            </Campo>
          </div>
          <Campo rotulo="Descrição">
            <textarea
              className={classeTextarea}
              value={rascunho.descricao}
              onChange={(e) => setRascunho((p) => ({ ...p, descricao: e.target.value }))}
            />
          </Campo>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setDrawerAberto(false)} className="btn-focus rounded border border-metal px-3 py-1.5 text-sm text-marfim-dim hover:text-marfim">
              Cancelar
            </button>
            <button type="submit" className="btn-focus rounded bg-ambar px-4 py-1.5 text-sm font-medium text-carvao hover:bg-ambar-light">
              Salvar recurso
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        aberto={!!paraExcluir}
        titulo="Remover recurso"
        mensagem={`Remover "${paraExcluir?.nome}" da lista de recursos?`}
        confirmarTexto="Remover"
        onConfirmar={excluirConfirmado}
        onCancelar={() => setParaExcluir(null)}
      />
    </div>
  )
})

ResourcesView.displayName = 'ResourcesView'
export default ResourcesView
