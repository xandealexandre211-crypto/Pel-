import React, { useState } from 'react'
import { useCampanha } from '../../store/CampaignStore'
import { useToast } from '../../store/ToastContext'
import { Badge, ProgressBar, Campo, classeInput, classeSelect, classeTextarea } from '../common/Primitivos'
import Drawer from '../common/Drawer'
import { formatarData } from '../../utils/id'
import { SecaoAtiva, EstadoProtagonista } from '../../types'

const RISCO_TOM: Record<string, 'ciano' | 'ambar' | 'ferrugem'> = {
  baixo: 'ciano',
  moderado: 'ambar',
  alto: 'ferrugem',
  critico: 'ferrugem',
}

export default function Dashboard({
  onExportar,
  irPara,
}: {
  onExportar: () => void
  irPara: (s: SecaoAtiva) => void
}) {
  const { estado, dispatch } = useCampanha()
  const { notificar } = useToast()
  const [editorAberto, setEditorAberto] = useState(false)
  const [rascunho, setRascunho] = useState<EstadoProtagonista>(estado.protagonista)
  const [meta, setMeta] = useState({
    nomeCampanha: estado.nomeCampanha,
    temporadaAtual: estado.temporadaAtual,
    episodioAtual: estado.episodioAtual,
    estabilidadePortal: estado.estabilidadePortal,
    integridadeNucleo: estado.integridadeNucleo,
  })

  function abrirEditor() {
    setRascunho(estado.protagonista)
    setMeta({
      nomeCampanha: estado.nomeCampanha,
      temporadaAtual: estado.temporadaAtual,
      episodioAtual: estado.episodioAtual,
      estabilidadePortal: estado.estabilidadePortal,
      integridadeNucleo: estado.integridadeNucleo,
    })
    setEditorAberto(true)
  }

  function salvarEditor(e: React.FormEvent) {
    e.preventDefault()
    dispatch({ tipo: 'UPDATE_PROTAGONISTA', alteracoes: rascunho })
    dispatch({ tipo: 'UPDATE_META', alteracoes: meta })
    notificar('Estado do painel atualizado.')
    setEditorAberto(false)
  }

  const itensAtivos = estado.itens.filter((i) => !i.arquivado)
  const falhasAtivas = estado.falhas.filter((f) => f.status === 'ativa' || f.status === 'agravada')
  const subtramasAtivas = estado.registrosNarrativos.filter(
    (r) => r.tipo === 'subtrama' && (r.status === 'ativa' || r.status === 'nao_iniciada'),
  )
  const recursosCriticos = estado.recursos.filter((r) => r.corAlerta === 'ferrugem')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="field-label">Painel operacional</p>
          <h1 className="font-display text-2xl font-semibold text-marfim">{estado.nomeCampanha}</h1>
          <p className="mt-1 text-sm text-marfim-dim">
            Temporada {estado.temporadaAtual} · Episódio {estado.episodioAtual} · última alteração{' '}
            {formatarData(estado.ultimaAlteracao)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={abrirEditor}
            className="btn-focus rounded border border-metal px-3 py-2 text-sm text-marfim-dim hover:text-marfim"
          >
            Editar estado do painel
          </button>
          <button
            onClick={onExportar}
            className="btn-focus rounded border border-ambar/50 bg-ambar/10 px-3 py-2 text-sm font-medium text-ambar-light hover:bg-ambar/20"
          >
            Exportar continuidade da sessão
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Cartao rotulo="Localização atual" valor={estado.protagonista.localizacaoAtual} extenso />
        <Cartao rotulo="Objetivo imediato" valor={estado.protagonista.objetivoImediato} extenso />
        <Cartao rotulo="Condição física" valor={estado.protagonista.condicaoFisica} extenso />
        <div className="panel rounded border border-metal p-3">
          <p className="field-label">Nível de risco</p>
          <div className="mt-1.5">
            <Badge tom={RISCO_TOM[estado.protagonista.nivelRisco]}>{estado.protagonista.nivelRisco}</Badge>
          </div>
        </div>

        <MedidorCartao rotulo="Estabilidade do portal" valor={estado.estabilidadePortal} />
        <MedidorCartao rotulo="Integridade do núcleo" valor={estado.integridadeNucleo} inverso />

        <ContagemCartao
          rotulo="Itens no inventário"
          numero={itensAtivos.length}
          onClick={() => irPara('inventario')}
        />
        <ContagemCartao
          rotulo="Falhas técnicas ativas"
          numero={falhasAtivas.length}
          tom={falhasAtivas.length > 0 ? 'ferrugem' : 'ciano'}
          onClick={() => irPara('falhas')}
        />
        <ContagemCartao
          rotulo="Subtramas em andamento"
          numero={subtramasAtivas.length}
          onClick={() => irPara('narrativa')}
        />
        <ContagemCartao
          rotulo="Recursos críticos"
          numero={recursosCriticos.length}
          tom={recursosCriticos.length > 0 ? 'ferrugem' : 'ciano'}
          onClick={() => irPara('recursos')}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="panel rounded border border-metal p-4">
          <p className="field-label mb-2">Falhas técnicas ativas</p>
          {falhasAtivas.length === 0 ? (
            <p className="text-sm text-marfim-dim">Nenhuma falha ativa registrada no momento.</p>
          ) : (
            <ul className="space-y-2">
              {falhasAtivas.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2 border-b border-metal/50 pb-2 text-sm last:border-0">
                  <span className="truncate text-marfim">{f.nomeFalha}</span>
                  <Badge tom={f.gravidade === 'catastrofica' || f.gravidade === 'grave' ? 'ferrugem' : 'ambar'}>
                    {f.gravidade}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel rounded border border-metal p-4">
          <p className="field-label mb-2">Última alteração no sistema</p>
          {estado.auditoria.length === 0 ? (
            <p className="text-sm text-marfim-dim">Nenhum evento registrado ainda.</p>
          ) : (
            (() => {
              const ultimo = estado.auditoria[estado.auditoria.length - 1]
              return (
                <div className="text-sm">
                  <p className="text-marfim">{ultimo.objetoAlterado}</p>
                  <p className="mt-0.5 text-marfim-dim">{ultimo.valorNovo}</p>
                  <p className="mt-1 font-mono text-[0.7rem] text-marfim-dim/70">{formatarData(ultimo.dataHora)}</p>
                </div>
              )
            })()
          )}
        </div>
      </div>

      <Drawer aberto={editorAberto} titulo="Editar estado do painel" largura="lg" onFechar={() => setEditorAberto(false)}>
        <form onSubmit={salvarEditor}>
          <Campo rotulo="Nome da campanha">
            <input
              className={classeInput}
              value={meta.nomeCampanha}
              onChange={(e) => setMeta((m) => ({ ...m, nomeCampanha: e.target.value }))}
            />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Temporada atual">
              <input
                type="number"
                min={1}
                className={classeInput}
                value={meta.temporadaAtual}
                onChange={(e) => setMeta((m) => ({ ...m, temporadaAtual: Number(e.target.value) }))}
              />
            </Campo>
            <Campo rotulo="Episódio atual">
              <input
                type="number"
                min={1}
                className={classeInput}
                value={meta.episodioAtual}
                onChange={(e) => setMeta((m) => ({ ...m, episodioAtual: Number(e.target.value) }))}
              />
            </Campo>
          </div>

          <div className="my-4 border-t border-metal pt-4">
            <p className="field-label mb-2">Protagonista</p>
            <Campo rotulo="Nome">
              <input
                className={classeInput}
                value={rascunho.nome}
                onChange={(e) => setRascunho((r) => ({ ...r, nome: e.target.value }))}
              />
            </Campo>
            <Campo rotulo="Localização atual">
              <input
                className={classeInput}
                value={rascunho.localizacaoAtual}
                onChange={(e) => setRascunho((r) => ({ ...r, localizacaoAtual: e.target.value }))}
              />
            </Campo>
            <Campo rotulo="Objetivo imediato">
              <textarea
                className={classeTextarea}
                value={rascunho.objetivoImediato}
                onChange={(e) => setRascunho((r) => ({ ...r, objetivoImediato: e.target.value }))}
              />
            </Campo>
            <Campo rotulo="Condição física">
              <textarea
                className={classeTextarea}
                value={rascunho.condicaoFisica}
                onChange={(e) => setRascunho((r) => ({ ...r, condicaoFisica: e.target.value }))}
              />
            </Campo>
            <Campo rotulo="Nível de risco">
              <select
                className={classeSelect}
                value={rascunho.nivelRisco}
                onChange={(e) => setRascunho((r) => ({ ...r, nivelRisco: e.target.value as EstadoProtagonista['nivelRisco'] }))}
              >
                <option value="baixo">baixo</option>
                <option value="moderado">moderado</option>
                <option value="alto">alto</option>
                <option value="critico">crítico</option>
              </select>
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo={`Estabilidade do portal (${meta.estabilidadePortal}%)`}>
              <input
                type="range"
                min={0}
                max={100}
                className="w-full accent-ambar"
                value={meta.estabilidadePortal}
                onChange={(e) => setMeta((m) => ({ ...m, estabilidadePortal: Number(e.target.value) }))}
              />
            </Campo>
            <Campo rotulo={`Integridade do núcleo (${meta.integridadeNucleo}%)`}>
              <input
                type="range"
                min={0}
                max={100}
                className="w-full accent-ambar"
                value={meta.integridadeNucleo}
                onChange={(e) => setMeta((m) => ({ ...m, integridadeNucleo: Number(e.target.value) }))}
              />
            </Campo>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditorAberto(false)}
              className="btn-focus rounded border border-metal px-3 py-1.5 text-sm text-marfim-dim hover:text-marfim"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-focus rounded bg-ambar px-4 py-1.5 text-sm font-medium text-carvao hover:bg-ambar-light">
              Salvar
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}

function Cartao({ rotulo, valor, extenso }: { rotulo: string; valor: string; extenso?: boolean }) {
  return (
    <div className="panel rounded border border-metal p-3">
      <p className="field-label">{rotulo}</p>
      <p className={`mt-1 text-marfim ${extenso ? 'text-sm' : 'text-lg font-display'}`}>{valor || '—'}</p>
    </div>
  )
}

function MedidorCartao({ rotulo, valor, inverso }: { rotulo: string; valor: number; inverso?: boolean }) {
  const tom = inverso
    ? valor < 40
      ? 'ferrugem'
      : valor < 70
      ? 'ambar'
      : 'ciano'
    : valor > 80
    ? 'ferrugem'
    : valor > 55
    ? 'ambar'
    : 'ciano'
  return (
    <div className="panel rounded border border-metal p-3">
      <p className="field-label">{rotulo}</p>
      <p className="mt-1 font-display text-lg text-marfim">{valor}%</p>
      <div className="mt-1.5">
        <ProgressBar valor={valor} tom={tom} />
      </div>
    </div>
  )
}

function ContagemCartao({
  rotulo,
  numero,
  tom = 'ciano',
  onClick,
}: {
  rotulo: string
  numero: number
  tom?: 'ciano' | 'ferrugem'
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="btn-focus panel rounded border border-metal p-3 text-left hover:border-ciano/40"
    >
      <p className="field-label">{rotulo}</p>
      <p className={`mt-1 font-display text-2xl ${tom === 'ferrugem' ? 'text-ferrugem-light' : 'text-marfim'}`}>
        {numero}
      </p>
    </button>
  )
}
