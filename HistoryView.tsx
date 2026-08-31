import React, { useMemo, useState } from 'react'
import { useCampanha } from '../../store/CampaignStore'
import { TipoEventoAuditoria } from '../../types'
import { formatarData } from '../../utils/id'
import { EstadoVazio, classeSelect } from '../common/Primitivos'

const TIPOS: (TipoEventoAuditoria | 'todos')[] = ['todos', 'inventario', 'recursos', 'falhas', 'personagens', 'narrativa', 'sessao', 'sistema']

export default function HistoryView() {
  const { estado } = useCampanha()
  const [filtro, setFiltro] = useState<TipoEventoAuditoria | 'todos'>('todos')

  const eventos = useMemo(() => {
    const lista = filtro === 'todos' ? estado.auditoria : estado.auditoria.filter((e) => e.tipo === filtro)
    return [...lista].sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
  }, [estado.auditoria, filtro])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field-label">Auditoria</p>
          <h1 className="font-display text-2xl font-semibold text-marfim">Histórico Global</h1>
        </div>
        <select className={`${classeSelect} w-auto`} value={filtro} onChange={(e) => setFiltro(e.target.value as any)}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t === 'todos' ? 'Todos os tipos' : t}
            </option>
          ))}
        </select>
      </div>

      {eventos.length === 0 ? (
        <EstadoVazio titulo="Nenhum evento registrado" descricao="As alterações feitas no sistema aparecerão aqui automaticamente." />
      ) : (
        <div className="relative space-y-0 border-l border-metal pl-4">
          {eventos.map((e) => (
            <div key={e.id} className="relative pb-4">
              <span className="absolute -left-[1.15rem] top-1 h-2 w-2 rounded-full bg-ciano" aria-hidden="true" />
              <p className="font-mono text-[0.68rem] text-marfim-dim/70">{formatarData(e.dataHora)} · {e.tipo}</p>
              <p className="mt-0.5 text-sm text-marfim">{e.objetoAlterado}</p>
              <p className="text-sm text-marfim-dim">{e.valorNovo}</p>
              {e.motivo && <p className="text-xs text-marfim-dim/70">{e.motivo}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
