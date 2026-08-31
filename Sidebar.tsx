import React from 'react'
import { SecaoAtiva } from '../../types'

const ITENS: { id: SecaoAtiva; rotulo: string; icone: string }[] = [
  { id: 'dashboard', rotulo: 'Painel', icone: '◈' },
  { id: 'inventario', rotulo: 'Inventário', icone: '▤' },
  { id: 'recursos', rotulo: 'Recursos', icone: '≋' },
  { id: 'falhas', rotulo: 'Falhas Técnicas', icone: '⚠' },
  { id: 'personagens', rotulo: 'Personagens', icone: '☍' },
  { id: 'narrativa', rotulo: 'Subtramas & Pistas', icone: '✦' },
  { id: 'diario', rotulo: 'Diário & Continuidade', icone: '▧' },
  { id: 'historico', rotulo: 'Histórico', icone: '⏱' },
  { id: 'backup', rotulo: 'Backup', icone: '⇄' },
]

function AnelLogo() {
  return (
    <svg viewBox="0 0 40 40" className="h-8 w-8 shrink-0" aria-hidden="true">
      <circle cx="20" cy="20" r="15" fill="none" stroke="#6FA8B5" strokeWidth="2.5" strokeDasharray="76 18" strokeLinecap="round" transform="rotate(-40 20 20)" />
      <line x1="6" y1="24" x2="34" y2="18" stroke="#D88A32" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="20" r="3" fill="#D88A32" />
    </svg>
  )
}

export default function Sidebar({
  secaoAtiva,
  aoSelecionar,
  aberta,
  aoFechar,
}: {
  secaoAtiva: SecaoAtiva
  aoSelecionar: (s: SecaoAtiva) => void
  aberta: boolean
  aoFechar: () => void
}) {
  return (
    <>
      {aberta && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={aoFechar} aria-hidden="true" />
      )}
      <aside
        className={`fixed z-40 h-full w-64 shrink-0 border-r border-metal bg-carvao-light transition-transform md:sticky md:top-0 md:z-0 md:translate-x-0 ${
          aberta ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-metal px-4 py-4">
          <AnelLogo />
          <div>
            <p className="font-display text-sm font-semibold leading-tight text-marfim">Oficina de Campo</p>
            <p className="font-mono text-[0.65rem] uppercase tracking-wide text-marfim-dim">Dossiê de campanha</p>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 p-2" aria-label="Seções da campanha">
          {ITENS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                aoSelecionar(item.id)
                aoFechar()
              }}
              className={`btn-focus flex items-center gap-2.5 rounded px-3 py-2 text-left text-sm transition-colors ${
                secaoAtiva === item.id
                  ? 'bg-metal/40 text-ambar-light border border-ambar/30'
                  : 'border border-transparent text-marfim-dim hover:bg-metal/20 hover:text-marfim'
              }`}
              aria-current={secaoAtiva === item.id ? 'page' : undefined}
            >
              <span aria-hidden="true" className="w-4 text-center font-mono">
                {item.icone}
              </span>
              {item.rotulo}
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t border-metal p-3 text-[0.7rem] text-marfim-dim/70">
          Dados salvos localmente neste navegador.
        </div>
      </aside>
    </>
  )
}
