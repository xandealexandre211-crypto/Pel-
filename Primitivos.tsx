import React from 'react'

export function Badge({
  children,
  tom = 'metal',
}: {
  children: React.ReactNode
  tom?: 'metal' | 'ambar' | 'ciano' | 'ferrugem'
}) {
  const mapa: Record<string, string> = {
    metal: 'border-metal-light text-marfim-dim',
    ambar: 'border-ambar/50 text-ambar-light bg-ambar/10',
    ciano: 'border-ciano/50 text-ciano-light bg-ciano/10',
    ferrugem: 'border-ferrugem/50 text-ferrugem-light bg-ferrugem/10',
  }
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wide ${mapa[tom]}`}>
      {children}
    </span>
  )
}

export function ProgressBar({
  valor,
  maximo = 100,
  tom = 'ciano',
}: {
  valor: number
  maximo?: number
  tom?: 'ciano' | 'ambar' | 'ferrugem'
}) {
  const pct = Math.max(0, Math.min(100, (valor / (maximo || 100)) * 100))
  const cor = tom === 'ambar' ? 'bg-ambar' : tom === 'ferrugem' ? 'bg-ferrugem' : 'bg-ciano'
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-carvao">
      <div className={`h-full ${cor} transition-[width] duration-300`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function EstadoVazio({ titulo, descricao, acao }: { titulo: string; descricao: string; acao?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded border border-dashed border-metal py-14 text-center">
      <p className="font-display text-sm font-medium text-marfim">{titulo}</p>
      <p className="max-w-sm text-sm text-marfim-dim">{descricao}</p>
      {acao}
    </div>
  )
}

export function Campo({
  rotulo,
  children,
  hint,
}: {
  rotulo: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <label className="mb-3 block">
      <span className="field-label mb-1 block">{rotulo}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-marfim-dim/70">{hint}</span>}
    </label>
  )
}

export const classeInput =
  'w-full rounded border border-metal bg-carvao px-3 py-1.5 text-sm text-marfim placeholder:text-marfim-dim/50 btn-focus'
export const classeSelect = classeInput
export const classeTextarea = `${classeInput} resize-y min-h-[4.5rem]`

export function Toast({ mensagem, tipo }: { mensagem: string; tipo: 'sucesso' | 'erro' }) {
  return (
    <div
      role="status"
      className={`fixed bottom-4 right-4 z-50 rounded border px-4 py-2.5 text-sm shadow-panel ${
        tipo === 'sucesso' ? 'border-ciano/40 bg-carvao-light text-ciano-light' : 'border-ferrugem/40 bg-carvao-light text-ferrugem-light'
      }`}
    >
      {mensagem}
    </div>
  )
}
