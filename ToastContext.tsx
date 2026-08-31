import React, { createContext, useCallback, useContext, useState } from 'react'
import { Toast } from '../components/common/Primitivos'

interface ContextoToast {
  notificar: (mensagem: string, tipo?: 'sucesso' | 'erro') => void
}

const Contexto = createContext<ContextoToast | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null)

  const notificar = useCallback((mensagem: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setToast({ mensagem, tipo })
    window.setTimeout(() => setToast(null), 2600)
  }, [])

  return (
    <Contexto.Provider value={{ notificar }}>
      {children}
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} />}
    </Contexto.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useToast precisa estar dentro de ToastProvider')
  return ctx
}
