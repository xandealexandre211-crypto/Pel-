import React, { useEffect, useRef, useState } from 'react'
import { CampaignProvider, useCampanha } from './store/CampaignStore'
import { ToastProvider, useToast } from './store/ToastContext'
import { SecaoAtiva } from './types'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import Dashboard from './components/Dashboard/Dashboard'
import InventoryView, { InventoryViewHandle } from './components/Inventory/InventoryView'
import ResourcesView, { ResourcesViewHandle } from './components/Resources/ResourcesView'
import FailuresView, { FailuresViewHandle } from './components/Failures/FailuresView'
import CharactersView from './components/Characters/CharactersView'
import NarrativeView from './components/Narrative/NarrativeView'
import JournalView, { JournalViewHandle } from './components/Journal/JournalView'
import HistoryView from './components/History/HistoryView'
import BackupView from './components/Backup/BackupView'

function Shell() {
  const { estado } = useCampanha()
  const { notificar } = useToast()

  const [secaoAtiva, setSecaoAtiva] = useState<SecaoAtiva>('dashboard')
  const [menuAberto, setMenuAberto] = useState(false)

  const inventarioRef = useRef<InventoryViewHandle>(null)
  const recursosRef = useRef<ResourcesViewHandle>(null)
  const falhasRef = useRef<FailuresViewHandle>(null)
  const diarioRef = useRef<JournalViewHandle>(null)

  function irPara(s: SecaoAtiva) {
    setSecaoAtiva(s)
  }

  function comandoAdicionarItem() {
    setSecaoAtiva('inventario')
    window.setTimeout(() => inventarioRef.current?.abrirNovoItem(), 0)
  }

  function comandoRegistrarFalha() {
    setSecaoAtiva('falhas')
    window.setTimeout(() => falhasRef.current?.abrirRegistro(), 0)
  }

  function comandoAlterarRecurso() {
    setSecaoAtiva('recursos')
    window.setTimeout(() => recursosRef.current?.abrirAlteracaoRapida(), 0)
  }

  function comandoNovaSessao() {
    setSecaoAtiva('diario')
    window.setTimeout(() => diarioRef.current?.abrirNovaSessao(), 0)
  }

  function comandoGerarContinuidade() {
    setSecaoAtiva('diario')
    window.setTimeout(() => diarioRef.current?.abrirContinuidade(), 0)
  }

  function comandoExportarBackup() {
    const blob = new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `oficina-de-campo-backup-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    notificar('Backup exportado.')
  }

  // Atalhos de teclado documentados no cabeçalho (I, F, R, S, G, B).
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null
      const emCampoDeTexto = alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)
      if (emCampoDeTexto || e.metaKey || e.ctrlKey || e.altKey) return
      switch (e.key.toLowerCase()) {
        case 'i':
          comandoAdicionarItem()
          break
        case 'f':
          comandoRegistrarFalha()
          break
        case 'r':
          comandoAlterarRecurso()
          break
        case 's':
          comandoNovaSessao()
          break
        case 'g':
          comandoGerarContinuidade()
          break
        case 'b':
          comandoExportarBackup()
          break
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado])

  return (
    <div className="flex min-h-screen bg-carvao bg-grid bg-fixed">
      <Sidebar secaoAtiva={secaoAtiva} aoSelecionar={setSecaoAtiva} aberta={menuAberto} aoFechar={() => setMenuAberto(false)} />
      <div className="flex min-h-screen w-full flex-col">
        <Header
          campanha={estado}
          aoAbrirMenu={() => setMenuAberto(true)}
          onAdicionarItem={comandoAdicionarItem}
          onRegistrarFalha={comandoRegistrarFalha}
          onAlterarRecurso={comandoAlterarRecurso}
          onNovaSessao={comandoNovaSessao}
          onGerarContinuidade={comandoGerarContinuidade}
          onExportarBackup={comandoExportarBackup}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-5 sm:px-6">
          {secaoAtiva === 'dashboard' && <Dashboard onExportar={comandoGerarContinuidade} irPara={irPara} />}
          {secaoAtiva === 'inventario' && <InventoryView ref={inventarioRef} />}
          {secaoAtiva === 'recursos' && <ResourcesView ref={recursosRef} />}
          {secaoAtiva === 'falhas' && <FailuresView ref={falhasRef} />}
          {secaoAtiva === 'personagens' && <CharactersView />}
          {secaoAtiva === 'narrativa' && <NarrativeView />}
          {secaoAtiva === 'diario' && <JournalView ref={diarioRef} />}
          {secaoAtiva === 'historico' && <HistoryView />}
          {secaoAtiva === 'backup' && <BackupView />}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <CampaignProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </CampaignProvider>
  )
}
