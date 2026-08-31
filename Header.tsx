import React, { useState } from 'react'
import { Campanha } from '../../types'
import { formatarData } from '../../utils/id'

interface Props {
  campanha: Campanha
  aoAbrirMenu: () => void
  onAdicionarItem: () => void
  onRegistrarFalha: () => void
  onAlterarRecurso: () => void
  onNovaSessao: () => void
  onGerarContinuidade: () => void
  onExportarBackup: () => void
}

const ATALHOS: [string, string][] = [
  ['I', 'Adicionar item'],
  ['F', 'Registrar falha'],
  ['R', 'Alterar recurso'],
  ['S', 'Nova sessão'],
  ['G', 'Gerar continuidade'],
  ['B', 'Exportar backup'],
]

export default function Header(props: Props) {
  const [ajudaAberta, setAjudaAberta] = useState(false)
  const { campanha } = props

  return (
    <header className="sticky top-0 z-20 border-b border-metal bg-carvao/95 backdrop-blur px-3 py-2.5 sm:px-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="btn-focus rounded border border-metal p-1.5 text-marfim-dim hover:text-marfim md:hidden"
          onClick={props.aoAbrirMenu}
          aria-label="Abrir menu de navegação"
        >
          ☰
        </button>

        <div className="mr-auto min-w-0">
          <p className="truncate font-display text-sm font-semibold text-marfim">{campanha.nomeCampanha}</p>
          <p className="truncate font-mono text-[0.68rem] text-marfim-dim">
            T{campanha.temporadaAtual} · Ep{campanha.episodioAtual} · atualizado {formatarData(campanha.ultimaAlteracao)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <BotaoComando rotulo="Adicionar item" onClick={props.onAdicionarItem} />
          <BotaoComando rotulo="Registrar falha" onClick={props.onRegistrarFalha} />
          <BotaoComando rotulo="Alterar recurso" onClick={props.onAlterarRecurso} />
          <BotaoComando rotulo="Nova sessão" onClick={props.onNovaSessao} />
          <BotaoComando rotulo="Gerar continuidade" onClick={props.onGerarContinuidade} destaque />
          <BotaoComando rotulo="Exportar backup" onClick={props.onExportarBackup} />
          <button
            className="btn-focus rounded border border-metal p-1.5 text-xs text-marfim-dim hover:text-ciano-light"
            onClick={() => setAjudaAberta((v) => !v)}
            aria-expanded={ajudaAberta}
            aria-label="Atalhos de teclado"
            title="Atalhos de teclado"
          >
            ⌘?
          </button>
        </div>
      </div>

      {ajudaAberta && (
        <div className="mt-2 rounded border border-metal bg-carvao-light p-3 text-xs">
          <p className="field-label mb-2">Atalhos de teclado</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
            {ATALHOS.map(([tecla, desc]) => (
              <div key={tecla} className="flex items-center gap-2 text-marfim-dim">
                <kbd className="rounded border border-metal bg-carvao px-1.5 py-0.5 font-mono text-[0.65rem] text-marfim">
                  {tecla}
                </kbd>
                {desc}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

function BotaoComando({ rotulo, onClick, destaque }: { rotulo: string; onClick: () => void; destaque?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`btn-focus rounded border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
        destaque
          ? 'border-ambar/50 bg-ambar/10 text-ambar-light hover:bg-ambar/20'
          : 'border-metal text-marfim-dim hover:border-ciano/40 hover:text-ciano-light'
      }`}
    >
      {rotulo}
    </button>
  )
}
