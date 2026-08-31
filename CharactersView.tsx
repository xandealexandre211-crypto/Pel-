import React, { useState } from 'react'
import { useCampanha } from '../../store/CampaignStore'
import { useToast } from '../../store/ToastContext'
import { Personagem, NivelConhecimento } from '../../types'
import { novoId, agoraISO, formatarData } from '../../utils/id'
import Drawer from '../common/Drawer'
import ConfirmDialog from '../common/ConfirmDialog'
import { Badge, Campo, EstadoVazio, classeInput, classeSelect, classeTextarea } from '../common/Primitivos'

type Rascunho = Omit<Personagem, 'id' | 'historico'>

function rascunhoVazio(sessaoAtual: number): Rascunho {
  return {
    nome: '',
    funcaoNarrativa: '',
    localizacaoAtual: '',
    realidadeOrigem: '',
    relacaoComProtagonista: '',
    objetivoConhecido: '',
    confianca: 50,
    dividaOuPromessa: '',
    segredo: '',
    segredoNivel: 'conhecido',
    segredoRevelado: false,
    estadoAtual: '',
    ultimaInteracao: agoraISO(),
    sessaoIntroduzido: sessaoAtual,
  }
}

const NIVEIS: { valor: NivelConhecimento; rotulo: string }[] = [
  { valor: 'conhecido', rotulo: 'Conhecido pelo protagonista' },
  { valor: 'suspeitado', rotulo: 'Suspeitado pelo protagonista' },
  { valor: 'segredo_narrador', rotulo: 'Segredo do narrador' },
]

export default function CharactersView() {
  const { estado, dispatch } = useCampanha()
  const { notificar } = useToast()

  const [drawerAberto, setDrawerAberto] = useState(false)
  const [editando, setEditando] = useState<Personagem | null>(null)
  const [rascunho, setRascunho] = useState<Rascunho>(rascunhoVazio(estado.episodioAtual))
  const [paraExcluir, setParaExcluir] = useState<Personagem | null>(null)

  function abrirNovo() {
    setEditando(null)
    setRascunho(rascunhoVazio(estado.episodioAtual))
    setDrawerAberto(true)
  }

  function abrirEdicao(p: Personagem) {
    setEditando(p)
    setRascunho(p)
    setDrawerAberto(true)
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!rascunho.nome.trim()) return
    if (editando) {
      dispatch({ tipo: 'UPDATE_PERSONAGEM', id: editando.id, alteracoes: rascunho, descricao: 'Personagem editado' })
      notificar(`"${rascunho.nome}" atualizado.`)
    } else {
      const novo: Personagem = { ...rascunho, id: novoId('npc'), historico: [{ id: novoId('hist'), data: agoraISO(), descricao: 'Personagem criado' }] }
      dispatch({ tipo: 'ADD_PERSONAGEM', personagem: novo })
      notificar(`"${rascunho.nome}" adicionado.`)
    }
    setDrawerAberto(false)
  }

  function alternarRevelacao(p: Personagem) {
    dispatch({
      tipo: 'UPDATE_PERSONAGEM',
      id: p.id,
      alteracoes: { segredoRevelado: !p.segredoRevelado },
      descricao: !p.segredoRevelado ? 'Segredo revelado ao jogador' : 'Segredo ocultado novamente',
    })
  }

  function excluirConfirmado() {
    if (!paraExcluir) return
    dispatch({ tipo: 'DELETE_PERSONAGEM', id: paraExcluir.id })
    notificar(`"${paraExcluir.nome}" removido.`)
    setParaExcluir(null)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field-label">Rede de relações</p>
          <h1 className="font-display text-2xl font-semibold text-marfim">Personagens</h1>
        </div>
        <button onClick={abrirNovo} className="btn-focus rounded bg-ambar px-3 py-1.5 text-sm font-medium text-carvao hover:bg-ambar-light">
          + Novo personagem
        </button>
      </div>

      {estado.personagens.length === 0 ? (
        <EstadoVazio titulo="Nenhum personagem registrado" descricao="Adicione NPCs recorrentes para acompanhar objetivos, confiança e segredos." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {estado.personagens.map((p) => (
            <div key={p.id} className="panel rounded border border-metal p-4">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => abrirEdicao(p)} className="btn-focus text-left font-display text-sm font-semibold text-marfim hover:text-ambar-light">
                  {p.nome}
                </button>
                <button onClick={() => setParaExcluir(p)} className="btn-focus text-xs text-marfim-dim hover:text-ferrugem-light">
                  remover
                </button>
              </div>
              <p className="mt-0.5 text-xs text-marfim-dim">{p.funcaoNarrativa || 'função não definida'}</p>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge>{p.localizacaoAtual || 'local desconhecido'}</Badge>
                <Badge tom={p.confianca >= 60 ? 'ciano' : p.confianca >= 30 ? 'ambar' : 'ferrugem'}>confiança {p.confianca}</Badge>
              </div>

              {p.relacaoComProtagonista && <p className="mt-2 text-sm text-marfim-dim">{p.relacaoComProtagonista}</p>}
              {p.dividaOuPromessa && (
                <p className="mt-2 text-xs text-ambar-light">
                  <span className="field-label mr-1 inline">Dívida/promessa:</span>
                  {p.dividaOuPromessa}
                </p>
              )}

              <div className="mt-3 rounded border border-metal/70 bg-carvao px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="field-label">Segredo — {NIVEIS.find((n) => n.valor === p.segredoNivel)?.rotulo}</span>
                  {p.segredoNivel === 'segredo_narrador' && (
                    <button onClick={() => alternarRevelacao(p)} className="btn-focus text-xs text-ciano-light hover:underline">
                      {p.segredoRevelado ? 'ocultar' : 'revelar'}
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-marfim-dim">
                  {p.segredoNivel !== 'segredo_narrador' || p.segredoRevelado ? p.segredo || '—' : '••••••••••••••••'}
                </p>
              </div>

              <p className="mt-2 font-mono text-[0.65rem] text-marfim-dim/60">
                última interação {formatarData(p.ultimaInteracao)} · introduzido na sessão {p.sessaoIntroduzido}
              </p>
            </div>
          ))}
        </div>
      )}

      <Drawer aberto={drawerAberto} titulo={editando ? 'Editar personagem' : 'Novo personagem'} largura="lg" onFechar={() => setDrawerAberto(false)}>
        <form onSubmit={salvar}>
          <Campo rotulo="Nome">
            <input className={classeInput} value={rascunho.nome} onChange={(e) => setRascunho((p) => ({ ...p, nome: e.target.value }))} required autoFocus />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Função narrativa">
              <input className={classeInput} value={rascunho.funcaoNarrativa} onChange={(e) => setRascunho((p) => ({ ...p, funcaoNarrativa: e.target.value }))} />
            </Campo>
            <Campo rotulo="Realidade de origem">
              <input className={classeInput} value={rascunho.realidadeOrigem} onChange={(e) => setRascunho((p) => ({ ...p, realidadeOrigem: e.target.value }))} />
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Localização atual">
              <input className={classeInput} value={rascunho.localizacaoAtual} onChange={(e) => setRascunho((p) => ({ ...p, localizacaoAtual: e.target.value }))} />
            </Campo>
            <Campo rotulo="Estado atual">
              <input className={classeInput} value={rascunho.estadoAtual} onChange={(e) => setRascunho((p) => ({ ...p, estadoAtual: e.target.value }))} />
            </Campo>
          </div>
          <Campo rotulo="Relação com o protagonista">
            <textarea className={classeTextarea} value={rascunho.relacaoComProtagonista} onChange={(e) => setRascunho((p) => ({ ...p, relacaoComProtagonista: e.target.value }))} />
          </Campo>
          <Campo rotulo="Objetivo conhecido">
            <textarea className={classeTextarea} value={rascunho.objetivoConhecido} onChange={(e) => setRascunho((p) => ({ ...p, objetivoConhecido: e.target.value }))} />
          </Campo>
          <Campo rotulo={`Confiança em Caleb (${rascunho.confianca})`}>
            <input
              type="range"
              min={0}
              max={100}
              className="w-full accent-ambar"
              value={rascunho.confianca}
              onChange={(e) => setRascunho((p) => ({ ...p, confianca: Number(e.target.value) }))}
            />
          </Campo>
          <Campo rotulo="Dívida ou promessa">
            <input className={classeInput} value={rascunho.dividaOuPromessa} onChange={(e) => setRascunho((p) => ({ ...p, dividaOuPromessa: e.target.value }))} />
          </Campo>

          <div className="my-4 rounded border border-metal p-3">
            <p className="field-label mb-2">Segredo</p>
            <Campo rotulo="Nível de conhecimento">
              <select
                className={classeSelect}
                value={rascunho.segredoNivel}
                onChange={(e) => setRascunho((p) => ({ ...p, segredoNivel: e.target.value as NivelConhecimento }))}
              >
                {NIVEIS.map((n) => (
                  <option key={n.valor} value={n.valor}>
                    {n.rotulo}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Conteúdo do segredo" hint="Oculto por padrão na interface quando marcado como segredo do narrador.">
              <textarea className={classeTextarea} value={rascunho.segredo} onChange={(e) => setRascunho((p) => ({ ...p, segredo: e.target.value }))} />
            </Campo>
          </div>

          <Campo rotulo="Sessão em que foi introduzido">
            <input
              type="number"
              min={0}
              className={classeInput}
              value={rascunho.sessaoIntroduzido}
              onChange={(e) => setRascunho((p) => ({ ...p, sessaoIntroduzido: Number(e.target.value) }))}
            />
          </Campo>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setDrawerAberto(false)} className="btn-focus rounded border border-metal px-3 py-1.5 text-sm text-marfim-dim hover:text-marfim">
              Cancelar
            </button>
            <button type="submit" className="btn-focus rounded bg-ambar px-4 py-1.5 text-sm font-medium text-carvao hover:bg-ambar-light">
              Salvar personagem
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        aberto={!!paraExcluir}
        titulo="Remover personagem"
        mensagem={`Remover "${paraExcluir?.nome}" da campanha?`}
        confirmarTexto="Remover"
        onConfirmar={excluirConfirmado}
        onCancelar={() => setParaExcluir(null)}
      />
    </div>
  )
}
