import React, { useState } from 'react'

interface Props {
  aberto: boolean
  titulo: string
  mensagem: string
  confirmarTexto?: string
  exigirDigitacao?: string // se definido, usuário precisa digitar essa palavra para confirmar
  perigo?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export default function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  confirmarTexto = 'Confirmar',
  exigirDigitacao,
  perigo = true,
  onConfirmar,
  onCancelar,
}: Props) {
  const [digitado, setDigitado] = useState('')

  if (!aberto) return null

  const bloqueado = !!exigirDigitacao && digitado.trim() !== exigirDigitacao

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onCancelar} />
      <div className="relative w-full max-w-sm rounded border border-ferrugem/40 bg-carvao-light panel p-5">
        <h3 className="font-display text-base font-semibold text-marfim">{titulo}</h3>
        <p className="mt-2 text-sm text-marfim-dim">{mensagem}</p>
        {exigirDigitacao && (
          <div className="mt-3">
            <label className="field-label mb-1 block">
              Digite "{exigirDigitacao}" para confirmar
            </label>
            <input
              className="w-full rounded border border-metal bg-carvao px-3 py-1.5 text-sm text-marfim btn-focus"
              value={digitado}
              onChange={(e) => setDigitado(e.target.value)}
              autoFocus
            />
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancelar}
            className="btn-focus rounded border border-metal px-3 py-1.5 text-sm text-marfim-dim hover:text-marfim"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (!bloqueado) onConfirmar()
            }}
            disabled={bloqueado}
            className={`btn-focus rounded px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
              perigo ? 'bg-ferrugem text-marfim hover:bg-ferrugem-light' : 'bg-ambar text-carvao hover:bg-ambar-light'
            }`}
          >
            {confirmarTexto}
          </button>
        </div>
      </div>
    </div>
  )
}
