import React, { useState } from 'react'
import { useCampanha } from '../../store/CampaignStore'
import { useToast } from '../../store/ToastContext'
import { Sessao } from '../../types'
import { novoId, formatarData } from '../../utils/id'
import Drawer from '../common/Drawer'
import ConfirmDialog from '../common/ConfirmDialog'
import { Campo, EstadoVazio, classeInput, classeTextarea } from '../common/Primitivos'
import { gerarBlocoContinuidade } from '../../utils/continuidade'

type Rascunho = Omit<Sessao, 'id'>

function rascunhoVazio(temporada: number, proximoNumero: number): Rascunho {
  return {
    numero: proximoNumero,
    temporada,
    episodio: proximoNumero,
    dataReal: new Date().toISOString().slice(0, 10),
    localHistoria: '',
    resumo: '',
    decisoesImportantes: '',
    acontecimentosConfirmados: '',
    consequenciasImediatas: '',
    novasPistas: '',
    alteracoesInventario: '',
    alteracoesRecursos: '',
    falhasOcorridas: '',
    subtramasAfetadas: '',
    pontoDeRetomada: '',
  }
}

export interface JournalViewHandle {
  abrirNovaSessao: () => void
  abrirContinuidade: () => void
}

const JournalView = React.forwardRef<JournalViewHandle>((_props, ref) => {
  const { estado, dispatch } = useCampanha()
  const { notificar } = useToast()

  const [drawerAberto, setDrawerAberto] = useState(false)
  const [editando, setEditando] = useState<Sessao | null>(null)
  const [rascunho, setRascunho] = useState<Rascunho>(rascunhoVazio(estado.temporadaAtual, estado.sessoes.length + 1))
  const [paraExcluir, setParaExcluir] = useState<Sessao | null>(null)
  const [continuidadeAberta, setContinuidadeAberta] = useState(false)
  const [textoContinuidade, setTextoContinuidade] = useState('')
  const [copiado, setCopiado] = useState(false)

  React.useImperativeHandle(ref, () => ({
    abrirNovaSessao: () => abrirNovo(),
    abrirContinuidade: () => gerarContinuidade(),
  }))

  function abrirNovo() {
    setEditando(null)
    setRascunho(rascunhoVazio(estado.temporadaAtual, estado.sessoes.length + 1))
    setDrawerAberto(true)
  }

  function abrirEdicao(s: Sessao) {
    setEditando(s)
    setRascunho(s)
    setDrawerAberto(true)
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (editando) {
      dispatch({ tipo: 'UPDATE_SESSAO', id: editando.id, alteracoes: rascunho })
      notificar(`Sessão ${rascunho.numero} atualizada.`)
    } else {
      const nova: Sessao = { ...rascunho, id: novoId('sessao') }
      dispatch({ tipo: 'ADD_SESSAO', sessao: nova })
      notificar(`Sessão ${rascunho.numero} registrada no diário.`)
    }
    setDrawerAberto(false)
  }

  function excluirConfirmado() {
    if (!paraExcluir) return
    dispatch({ tipo: 'DELETE_SESSAO', id: paraExcluir.id })
    notificar(`Sessão ${paraExcluir.numero} removida.`)
    setParaExcluir(null)
  }

  function gerarContinuidade() {
    const texto = gerarBlocoContinuidade(estado)
    setTextoContinuidade(texto)
    setContinuidadeAberta(true)
    setCopiado(false)
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoContinuidade)
      setCopiado(true)
      notificar('Bloco de continuidade copiado.')
    } catch {
      notificar('Não foi possível copiar automaticamente. Selecione o texto manualmente.', 'erro')
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field-label">Diário de sessões</p>
          <h1 className="font-display text-2xl font-semibold text-marfim">Diário & Continuidade</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={gerarContinuidade} className="btn-focus rounded border border-ambar/50 bg-ambar/10 px-3 py-1.5 text-sm font-medium text-ambar-light hover:bg-ambar/20">
            Gerar bloco de continuidade
          </button>
          <button onClick={abrirNovo} className="btn-focus rounded bg-ambar px-3 py-1.5 text-sm font-medium text-carvao hover:bg-ambar-light">
            + Nova sessão
          </button>
        </div>
      </div>

      {estado.sessoes.length === 0 ? (
        <EstadoVazio titulo="Nenhuma sessão registrada" descricao="Registre a primeira sessão para começar a manter continuidade entre encontros." />
      ) : (
        <div className="space-y-2.5">
          {[...estado.sessoes]
            .sort((a, b) => b.numero - a.numero)
            .map((s) => (
              <button
                key={s.id}
                onClick={() => abrirEdicao(s)}
                className="btn-focus panel block w-full rounded border border-metal p-3.5 text-left"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-sm font-semibold text-marfim">
                    Sessão {s.numero} — T{s.temporada}Ep{s.episodio}
                  </p>
                  <span className="font-mono text-xs text-marfim-dim">{s.dataReal}</span>
                </div>
                {s.resumo && <p className="mt-1 line-clamp-2 text-sm text-marfim-dim">{s.resumo}</p>}
                <div
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation()
                    setParaExcluir(s)
                  }}
                  className="mt-2 inline-block text-xs text-marfim-dim/70 hover:text-ferrugem-light"
                >
                  excluir sessão
                </div>
              </button>
            ))}
        </div>
      )}

      <Drawer aberto={drawerAberto} titulo={editando ? `Editar sessão ${editando.numero}` : 'Nova sessão'} largura="lg" onFechar={() => setDrawerAberto(false)}>
        <form onSubmit={salvar}>
          <div className="grid grid-cols-3 gap-3">
            <Campo rotulo="Número da sessão">
              <input type="number" className={classeInput} value={rascunho.numero} onChange={(e) => setRascunho((p) => ({ ...p, numero: Number(e.target.value) }))} />
            </Campo>
            <Campo rotulo="Temporada">
              <input type="number" className={classeInput} value={rascunho.temporada} onChange={(e) => setRascunho((p) => ({ ...p, temporada: Number(e.target.value) }))} />
            </Campo>
            <Campo rotulo="Episódio">
              <input type="number" className={classeInput} value={rascunho.episodio} onChange={(e) => setRascunho((p) => ({ ...p, episodio: Number(e.target.value) }))} />
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Data real da sessão">
              <input type="date" className={classeInput} value={rascunho.dataReal} onChange={(e) => setRascunho((p) => ({ ...p, dataReal: e.target.value }))} />
            </Campo>
            <Campo rotulo="Local da história">
              <input className={classeInput} value={rascunho.localHistoria} onChange={(e) => setRascunho((p) => ({ ...p, localHistoria: e.target.value }))} />
            </Campo>
          </div>
          <Campo rotulo="Resumo escrito pelo usuário">
            <textarea className={classeTextarea} value={rascunho.resumo} onChange={(e) => setRascunho((p) => ({ ...p, resumo: e.target.value }))} />
          </Campo>
          <Campo rotulo="Decisões importantes">
            <textarea className={classeTextarea} value={rascunho.decisoesImportantes} onChange={(e) => setRascunho((p) => ({ ...p, decisoesImportantes: e.target.value }))} />
          </Campo>
          <Campo rotulo="Acontecimentos confirmados">
            <textarea className={classeTextarea} value={rascunho.acontecimentosConfirmados} onChange={(e) => setRascunho((p) => ({ ...p, acontecimentosConfirmados: e.target.value }))} />
          </Campo>
          <Campo rotulo="Consequências imediatas">
            <textarea className={classeTextarea} value={rascunho.consequenciasImediatas} onChange={(e) => setRascunho((p) => ({ ...p, consequenciasImediatas: e.target.value }))} />
          </Campo>
          <Campo rotulo="Novas pistas">
            <textarea className={classeTextarea} value={rascunho.novasPistas} onChange={(e) => setRascunho((p) => ({ ...p, novasPistas: e.target.value }))} />
          </Campo>
          <Campo rotulo="Alterações no inventário">
            <textarea className={classeTextarea} value={rascunho.alteracoesInventario} onChange={(e) => setRascunho((p) => ({ ...p, alteracoesInventario: e.target.value }))} />
          </Campo>
          <Campo rotulo="Alterações nos recursos">
            <textarea className={classeTextarea} value={rascunho.alteracoesRecursos} onChange={(e) => setRascunho((p) => ({ ...p, alteracoesRecursos: e.target.value }))} />
          </Campo>
          <Campo rotulo="Falhas técnicas ocorridas">
            <textarea className={classeTextarea} value={rascunho.falhasOcorridas} onChange={(e) => setRascunho((p) => ({ ...p, falhasOcorridas: e.target.value }))} />
          </Campo>
          <Campo rotulo="Subtramas afetadas">
            <textarea className={classeTextarea} value={rascunho.subtramasAfetadas} onChange={(e) => setRascunho((p) => ({ ...p, subtramasAfetadas: e.target.value }))} />
          </Campo>
          <Campo rotulo="Ponto exato de retomada">
            <textarea className={classeTextarea} value={rascunho.pontoDeRetomada} onChange={(e) => setRascunho((p) => ({ ...p, pontoDeRetomada: e.target.value }))} />
          </Campo>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setDrawerAberto(false)} className="btn-focus rounded border border-metal px-3 py-1.5 text-sm text-marfim-dim hover:text-marfim">
              Cancelar
            </button>
            <button type="submit" className="btn-focus rounded bg-ambar px-4 py-1.5 text-sm font-medium text-carvao hover:bg-ambar-light">
              Salvar sessão
            </button>
          </div>
        </form>
      </Drawer>

      <Drawer aberto={continuidadeAberta} titulo="Bloco de continuidade" subtitulo="Pronto para copiar e colar na próxima sessão com a IA narradora" largura="lg" onFechar={() => setContinuidadeAberta(false)}>
        <textarea readOnly className={`${classeTextarea} min-h-[60vh] font-mono text-xs`} value={textoContinuidade} />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setContinuidadeAberta(false)} className="btn-focus rounded border border-metal px-3 py-1.5 text-sm text-marfim-dim hover:text-marfim">
            Fechar
          </button>
          <button onClick={copiar} className="btn-focus rounded bg-ambar px-4 py-1.5 text-sm font-medium text-carvao hover:bg-ambar-light">
            {copiado ? 'Copiado ✓' : 'Copiar texto'}
          </button>
        </div>
      </Drawer>

      <ConfirmDialog
        aberto={!!paraExcluir}
        titulo="Excluir sessão"
        mensagem={`Remover a sessão ${paraExcluir?.numero} do diário?`}
        confirmarTexto="Excluir"
        onConfirmar={excluirConfirmado}
        onCancelar={() => setParaExcluir(null)}
      />
    </div>
  )
})

JournalView.displayName = 'JournalView'
export default JournalView
