import React, { useEffect } from 'react'

interface Props {
  aberto: boolean
  titulo: string
  subtitulo?: string
  onFechar: () => void
  children: React.ReactNode
  largura?: 'md' | 'lg'
}

export default function Drawer({ aberto, titulo, subtitulo, onFechar, children, largura = 'md' }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
    }
    if (aberto) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={titulo}>
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
        onClick={onFechar}
        aria-hidden="true"
      />
      <div
        className={`relative h-full w-full ${largura === 'lg' ? 'max-w-2xl' : 'max-w-md'} overflow-y-auto bg-carvao-light border-l border-metal panel animate-[slideIn_0.18s_ease-out]`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-metal bg-carvao-light px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-marfim">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-sm text-marfim-dim">{subtitulo}</p>}
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar painel"
            className="btn-focus rounded border border-metal p-1.5 text-marfim-dim hover:border-ambar hover:text-ambar"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
