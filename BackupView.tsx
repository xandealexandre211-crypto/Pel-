import React, { useRef, useState } from 'react'
import { useCampanha } from '../../store/CampaignStore'
import { useToast } from '../../store/ToastContext'
import { Campanha } from '../../types'
import { formatarData, novoId, agoraISO } from '../../utils/id'
import ConfirmDialog from '../common/ConfirmDialog'
import { EstadoVazio, Campo, classeInput } from '../common/Primitivos'
import { gerarBlocoContinuidade } from '../../utils/continuidade'

function baixarArquivo(nome: string, conteudo: string, tipo = 'application/json') {
  const blob = new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function camposObrigatoriosPresentes(obj: any): obj is Campanha {
  if (!obj || typeof obj !== 'object') return false
  const chaves = ['id', 'nomeCampanha', 'protagonista', 'itens', 'recursos', 'falhas', 'personagens', 'registrosNarrativos', 'sessoes', 'auditoria']
  return chaves.every((k) => k in obj)
}

export default function BackupView() {
  const { estado, dispatch } = useCampanha()
  const { notificar } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const [confirmarApagarTudo, setConfirmarApagarTudo] = useState(false)
  const [rotuloSnapshot, setRotuloSnapshot] = useState('')
  const [snapshotParaRestaurar, setSnapshotParaRestaurar] = useState<string | null>(null)
  const [erroImportacao, setErroImportacao] = useState<string | null>(null)

  function exportarCompleto() {
    baixarArquivo(`oficina-de-campo-backup-${Date.now()}.json`, JSON.stringify(estado, null, 2))
    notificar('Backup completo exportado.')
  }

  function exportarInventario() {
    baixarArquivo(`inventario-${Date.now()}.json`, JSON.stringify(estado.itens, null, 2))
    notificar('Inventário exportado.')
  }

  function exportarContinuidade() {
    baixarArquivo(`continuidade-${Date.now()}.md`, gerarBlocoContinuidade(estado), 'text/markdown')
    notificar('Continuidade exportada.')
  }

  function acionarImportacao() {
    inputRef.current?.click()
  }

  function aoSelecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setErroImportacao(null)
    const leitor = new FileReader()
    leitor.onload = () => {
      try {
        const parsed = JSON.parse(String(leitor.result))
        if (!camposObrigatoriosPresentes(parsed)) {
          setErroImportacao('O arquivo não contém uma estrutura de campanha válida. Nenhum dado foi substituído.')
          return
        }
        dispatch({ tipo: 'IMPORTAR_CAMPANHA', campanha: parsed })
        notificar('Campanha importada com sucesso.')
      } catch {
        setErroImportacao('Não foi possível ler o JSON. Verifique o arquivo. Nenhum dado foi substituído.')
      }
    }
    leitor.readAsText(arquivo)
    e.target.value = ''
  }

  function criarSnapshot() {
    dispatch({ tipo: 'CRIAR_SNAPSHOT', rotulo: rotuloSnapshot.trim() || `Snapshot de ${formatarData(agoraISO())}` })
    notificar('Snapshot criado.')
    setRotuloSnapshot('')
  }

  function restaurarSnapshot() {
    if (!snapshotParaRestaurar) return
    dispatch({ tipo: 'RESTAURAR_SNAPSHOT', id: snapshotParaRestaurar })
    notificar('Snapshot restaurado.')
    setSnapshotParaRestaurar(null)
  }

  function apagarTudo() {
    dispatch({ tipo: 'RESETAR_CAMPANHA' })
    notificar('Todos os dados foram apagados. Uma nova campanha de exemplo foi criada.')
    setConfirmarApagarTudo(false)
  }

  return (
    <div className="max-w-2xl">
      <p className="field-label">Persistência local</p>
      <h1 className="mb-4 font-display text-2xl font-semibold text-marfim">Backup & Restauração</h1>

      <div className="panel mb-4 rounded border border-metal p-4">
        <p className="field-label mb-2">Exportar</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportarCompleto} className="btn-focus rounded bg-ambar px-3 py-1.5 text-sm font-medium text-carvao hover:bg-ambar-light">
            Exportar campanha completa (JSON)
          </button>
          <button onClick={exportarInventario} className="btn-focus rounded border border-metal px-3 py-1.5 text-sm text-marfim-dim hover:text-marfim">
            Exportar somente inventário
          </button>
          <button onClick={exportarContinuidade} className="btn-focus rounded border border-metal px-3 py-1.5 text-sm text-marfim-dim hover:text-marfim">
            Exportar somente continuidade
          </button>
        </div>
      </div>

      <div className="panel mb-4 rounded border border-metal p-4">
        <p className="field-label mb-2">Importar</p>
        <p className="mb-2 text-sm text-marfim-dim">
          O arquivo é validado antes da substituição. Se houver erro, a campanha atual permanece intacta.
        </p>
        <input ref={inputRef} type="file" accept="application/json" className="hidden" onChange={aoSelecionarArquivo} />
        <button onClick={acionarImportacao} className="btn-focus rounded border border-ciano/50 bg-ciano/10 px-3 py-1.5 text-sm text-ciano-light hover:bg-ciano/20">
          Selecionar arquivo JSON para importar
        </button>
        {erroImportacao && <p className="mt-2 text-sm text-ferrugem-light">{erroImportacao}</p>}
      </div>

      <div className="panel mb-4 rounded border border-metal p-4">
        <p className="field-label mb-2">Snapshots manuais</p>
        <div className="mb-3 flex gap-2">
          <Campo rotulo="Rótulo do snapshot">
            <input className={classeInput} value={rotuloSnapshot} onChange={(e) => setRotuloSnapshot(e.target.value)} placeholder="Ex.: antes do clímax do episódio 5" />
          </Campo>
        </div>
        <button onClick={criarSnapshot} className="btn-focus rounded border border-metal px-3 py-1.5 text-sm text-marfim-dim hover:text-marfim">
          Criar snapshot agora
        </button>

        {estado.snapshots.length === 0 ? (
          <div className="mt-3">
            <EstadoVazio titulo="Nenhum snapshot" descricao="Snapshots guardam uma cópia completa da campanha para restaurar depois." />
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {[...estado.snapshots].reverse().map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 rounded border border-metal/60 px-3 py-2 text-sm">
                <div>
                  <p className="text-marfim">{s.rotulo}</p>
                  <p className="font-mono text-[0.65rem] text-marfim-dim/70">{formatarData(s.data)}</p>
                </div>
                <button onClick={() => setSnapshotParaRestaurar(s.id)} className="btn-focus rounded border border-metal px-2 py-1 text-xs text-marfim-dim hover:text-ambar-light">
                  restaurar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel rounded border border-ferrugem/40 p-4">
        <p className="field-label mb-2 text-ferrugem-light">Zona de risco</p>
        <p className="mb-3 text-sm text-marfim-dim">Apaga toda a campanha atual e reinicia com os dados de exemplo de Caleb Mercer. Exige confirmação dupla.</p>
        <button onClick={() => setConfirmarApagarTudo(true)} className="btn-focus rounded border border-ferrugem/50 bg-ferrugem/10 px-3 py-1.5 text-sm text-ferrugem-light hover:bg-ferrugem/20">
          Apagar todos os dados
        </button>
      </div>

      <ConfirmDialog
        aberto={confirmarApagarTudo}
        titulo="Apagar todos os dados"
        mensagem="Esta ação substitui toda a campanha atual pelos dados de exemplo. Não pode ser desfeita."
        confirmarTexto="Apagar tudo"
        exigirDigitacao="APAGAR"
        onConfirmar={apagarTudo}
        onCancelar={() => setConfirmarApagarTudo(false)}
      />

      <ConfirmDialog
        aberto={!!snapshotParaRestaurar}
        titulo="Restaurar snapshot"
        mensagem="A campanha atual será substituída pelo conteúdo deste snapshot."
        confirmarTexto="Restaurar"
        perigo={false}
        onConfirmar={restaurarSnapshot}
        onCancelar={() => setSnapshotParaRestaurar(null)}
      />
    </div>
  )
}
