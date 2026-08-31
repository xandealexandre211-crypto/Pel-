import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import {
  Campanha,
  Item,
  Recurso,
  FalhaTecnica,
  Personagem,
  RegistroNarrativo,
  Sessao,
  EventoAuditoria,
  TipoEventoAuditoria,
  EstadoProtagonista,
} from '../types'
import { criarCampanhaExemplo } from '../data/seed'
import { novoId, agoraISO } from '../utils/id'

const CHAVE_STORAGE = 'oficina-de-campo:v1'

function registrarEvento(
  tipo: TipoEventoAuditoria,
  objetoAlterado: string,
  valorAnterior: string,
  valorNovo: string,
  motivo = '',
  sessaoAssociada: number | null = null,
): EventoAuditoria {
  return {
    id: novoId('aud'),
    dataHora: agoraISO(),
    tipo,
    objetoAlterado,
    valorAnterior,
    valorNovo,
    motivo,
    sessaoAssociada,
  }
}

function comHistorico<T extends { historico: { id: string; data: string; descricao: string }[] }>(
  obj: T,
  descricao: string,
): T {
  return {
    ...obj,
    historico: [...obj.historico, { id: novoId('hist'), data: agoraISO(), descricao }],
  }
}

type Acao =
  | { tipo: 'ADD_ITEM'; item: Item }
  | { tipo: 'UPDATE_ITEM'; id: string; alteracoes: Partial<Item>; descricao: string }
  | { tipo: 'DELETE_ITEM'; id: string }
  | { tipo: 'ARCHIVE_ITEM'; id: string; arquivar: boolean }
  | { tipo: 'DUPLICATE_ITEM'; id: string }
  | { tipo: 'SET_ITENS'; itens: Item[] }
  | { tipo: 'ADD_RECURSO'; recurso: Recurso }
  | { tipo: 'UPDATE_RECURSO'; id: string; alteracoes: Partial<Recurso>; descricao: string }
  | { tipo: 'DELETE_RECURSO'; id: string }
  | { tipo: 'ADD_FALHA'; falha: FalhaTecnica }
  | { tipo: 'UPDATE_FALHA'; id: string; alteracoes: Partial<FalhaTecnica>; descricao: string }
  | { tipo: 'DELETE_FALHA'; id: string }
  | { tipo: 'ADD_PERSONAGEM'; personagem: Personagem }
  | { tipo: 'UPDATE_PERSONAGEM'; id: string; alteracoes: Partial<Personagem>; descricao: string }
  | { tipo: 'DELETE_PERSONAGEM'; id: string }
  | { tipo: 'ADD_NARRATIVA'; registro: RegistroNarrativo }
  | { tipo: 'UPDATE_NARRATIVA'; id: string; alteracoes: Partial<RegistroNarrativo>; descricao: string }
  | { tipo: 'DELETE_NARRATIVA'; id: string }
  | { tipo: 'ADD_SESSAO'; sessao: Sessao }
  | { tipo: 'UPDATE_SESSAO'; id: string; alteracoes: Partial<Sessao> }
  | { tipo: 'DELETE_SESSAO'; id: string }
  | { tipo: 'UPDATE_PROTAGONISTA'; alteracoes: Partial<EstadoProtagonista> }
  | { tipo: 'UPDATE_META'; alteracoes: Partial<Pick<Campanha, 'nomeCampanha' | 'temporadaAtual' | 'episodioAtual' | 'estabilidadePortal' | 'integridadeNucleo'>> }
  | { tipo: 'ADD_EVENTO'; evento: EventoAuditoria }
  | { tipo: 'IMPORTAR_CAMPANHA'; campanha: Campanha }
  | { tipo: 'RESETAR_CAMPANHA' }
  | { tipo: 'CRIAR_SNAPSHOT'; rotulo: string }
  | { tipo: 'RESTAURAR_SNAPSHOT'; id: string }

function tocarUltimaAlteracao(c: Campanha): Campanha {
  return { ...c, ultimaAlteracao: agoraISO() }
}

function reducer(estado: Campanha, acao: Acao): Campanha {
  switch (acao.tipo) {
    case 'ADD_ITEM':
      return tocarUltimaAlteracao({
        ...estado,
        itens: [...estado.itens, acao.item],
        auditoria: [
          ...estado.auditoria,
          registrarEvento('inventario', acao.item.nome, '—', 'Item criado'),
        ],
      })
    case 'SET_ITENS':
      return tocarUltimaAlteracao({ ...estado, itens: acao.itens })
    case 'UPDATE_ITEM': {
      const anterior = estado.itens.find((i) => i.id === acao.id)
      const itens = estado.itens.map((i) =>
        i.id === acao.id ? comHistorico({ ...i, ...acao.alteracoes }, acao.descricao) : i,
      )
      return tocarUltimaAlteracao({
        ...estado,
        itens,
        auditoria: [
          ...estado.auditoria,
          registrarEvento('inventario', anterior?.nome ?? acao.id, '—', acao.descricao),
        ],
      })
    }
    case 'DELETE_ITEM': {
      const anterior = estado.itens.find((i) => i.id === acao.id)
      return tocarUltimaAlteracao({
        ...estado,
        itens: estado.itens.filter((i) => i.id !== acao.id),
        auditoria: [
          ...estado.auditoria,
          registrarEvento('inventario', anterior?.nome ?? acao.id, 'existia', 'excluído'),
        ],
      })
    }
    case 'ARCHIVE_ITEM': {
      const itens = estado.itens.map((i) =>
        i.id === acao.id
          ? comHistorico({ ...i, arquivado: acao.arquivar }, acao.arquivar ? 'Item arquivado' : 'Item restaurado')
          : i,
      )
      return tocarUltimaAlteracao({ ...estado, itens })
    }
    case 'DUPLICATE_ITEM': {
      const original = estado.itens.find((i) => i.id === acao.id)
      if (!original) return estado
      const copia: Item = {
        ...original,
        id: novoId('item'),
        nome: `${original.nome} (cópia)`,
        historico: [{ id: novoId('hist'), data: agoraISO(), descricao: 'Duplicado a partir de outro item' }],
      }
      return tocarUltimaAlteracao({
        ...estado,
        itens: [...estado.itens, copia],
        auditoria: [...estado.auditoria, registrarEvento('inventario', copia.nome, '—', 'Item duplicado')],
      })
    }
    case 'ADD_RECURSO':
      return tocarUltimaAlteracao({
        ...estado,
        recursos: [...estado.recursos, acao.recurso],
        auditoria: [...estado.auditoria, registrarEvento('recursos', acao.recurso.nome, '—', 'Recurso criado')],
      })
    case 'UPDATE_RECURSO': {
      const anterior = estado.recursos.find((r) => r.id === acao.id)
      const recursos = estado.recursos.map((r) =>
        r.id === acao.id ? comHistorico({ ...r, ...acao.alteracoes }, acao.descricao) : r,
      )
      return tocarUltimaAlteracao({
        ...estado,
        recursos,
        auditoria: [
          ...estado.auditoria,
          registrarEvento(
            'recursos',
            anterior?.nome ?? acao.id,
            String(anterior?.valorAtual ?? ''),
            String(acao.alteracoes.valorAtual ?? anterior?.valorAtual ?? ''),
            acao.descricao,
          ),
        ],
      })
    }
    case 'DELETE_RECURSO':
      return tocarUltimaAlteracao({ ...estado, recursos: estado.recursos.filter((r) => r.id !== acao.id) })
    case 'ADD_FALHA':
      return tocarUltimaAlteracao({
        ...estado,
        falhas: [...estado.falhas, acao.falha],
        auditoria: [
          ...estado.auditoria,
          registrarEvento('falhas', acao.falha.nomeFalha, '—', `Falha ${acao.falha.gravidade} registrada`),
        ],
      })
    case 'UPDATE_FALHA': {
      const anterior = estado.falhas.find((f) => f.id === acao.id)
      const falhas = estado.falhas.map((f) =>
        f.id === acao.id ? comHistorico({ ...f, ...acao.alteracoes }, acao.descricao) : f,
      )
      return tocarUltimaAlteracao({
        ...estado,
        falhas,
        auditoria: [
          ...estado.auditoria,
          registrarEvento('falhas', anterior?.nomeFalha ?? acao.id, '—', acao.descricao),
        ],
      })
    }
    case 'DELETE_FALHA':
      return tocarUltimaAlteracao({ ...estado, falhas: estado.falhas.filter((f) => f.id !== acao.id) })
    case 'ADD_PERSONAGEM':
      return tocarUltimaAlteracao({
        ...estado,
        personagens: [...estado.personagens, acao.personagem],
        auditoria: [
          ...estado.auditoria,
          registrarEvento('personagens', acao.personagem.nome, '—', 'Personagem criado'),
        ],
      })
    case 'UPDATE_PERSONAGEM': {
      const anterior = estado.personagens.find((p) => p.id === acao.id)
      const personagens = estado.personagens.map((p) =>
        p.id === acao.id ? comHistorico({ ...p, ...acao.alteracoes }, acao.descricao) : p,
      )
      return tocarUltimaAlteracao({
        ...estado,
        personagens,
        auditoria: [
          ...estado.auditoria,
          registrarEvento('personagens', anterior?.nome ?? acao.id, '—', acao.descricao),
        ],
      })
    }
    case 'DELETE_PERSONAGEM':
      return tocarUltimaAlteracao({ ...estado, personagens: estado.personagens.filter((p) => p.id !== acao.id) })
    case 'ADD_NARRATIVA':
      return tocarUltimaAlteracao({
        ...estado,
        registrosNarrativos: [...estado.registrosNarrativos, acao.registro],
        auditoria: [
          ...estado.auditoria,
          registrarEvento('narrativa', acao.registro.titulo, '—', `${acao.registro.tipo} criado(a)`),
        ],
      })
    case 'UPDATE_NARRATIVA': {
      const anterior = estado.registrosNarrativos.find((r) => r.id === acao.id)
      const registrosNarrativos = estado.registrosNarrativos.map((r) =>
        r.id === acao.id ? comHistorico({ ...r, ...acao.alteracoes }, acao.descricao) : r,
      )
      return tocarUltimaAlteracao({
        ...estado,
        registrosNarrativos,
        auditoria: [
          ...estado.auditoria,
          registrarEvento('narrativa', anterior?.titulo ?? acao.id, '—', acao.descricao),
        ],
      })
    }
    case 'DELETE_NARRATIVA':
      return tocarUltimaAlteracao({
        ...estado,
        registrosNarrativos: estado.registrosNarrativos.filter((r) => r.id !== acao.id),
      })
    case 'ADD_SESSAO':
      return tocarUltimaAlteracao({
        ...estado,
        sessoes: [...estado.sessoes, acao.sessao],
        auditoria: [
          ...estado.auditoria,
          registrarEvento('sessao', `Sessão ${acao.sessao.numero}`, '—', 'Sessão registrada', '', acao.sessao.numero),
        ],
      })
    case 'UPDATE_SESSAO':
      return tocarUltimaAlteracao({
        ...estado,
        sessoes: estado.sessoes.map((s) => (s.id === acao.id ? { ...s, ...acao.alteracoes } : s)),
      })
    case 'DELETE_SESSAO':
      return tocarUltimaAlteracao({ ...estado, sessoes: estado.sessoes.filter((s) => s.id !== acao.id) })
    case 'UPDATE_PROTAGONISTA':
      return tocarUltimaAlteracao({
        ...estado,
        protagonista: { ...estado.protagonista, ...acao.alteracoes },
        auditoria: [
          ...estado.auditoria,
          registrarEvento('personagens', estado.protagonista.nome, '—', 'Estado do protagonista atualizado'),
        ],
      })
    case 'UPDATE_META':
      return tocarUltimaAlteracao({ ...estado, ...acao.alteracoes })
    case 'ADD_EVENTO':
      return { ...estado, auditoria: [...estado.auditoria, acao.evento] }
    case 'IMPORTAR_CAMPANHA':
      return acao.campanha
    case 'RESETAR_CAMPANHA':
      return criarCampanhaExemplo()
    case 'CRIAR_SNAPSHOT': {
      const snap = {
        id: novoId('snap'),
        data: agoraISO(),
        rotulo: acao.rotulo,
        campanha: JSON.stringify(estado),
      }
      return { ...estado, snapshots: [...estado.snapshots, snap] }
    }
    case 'RESTAURAR_SNAPSHOT': {
      const snap = estado.snapshots.find((s) => s.id === acao.id)
      if (!snap) return estado
      try {
        const restaurada = JSON.parse(snap.campanha) as Campanha
        return { ...restaurada, snapshots: estado.snapshots }
      } catch {
        return estado
      }
    }
    default:
      return estado
  }
}

function carregarInicial(): Campanha {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE)
    if (bruto) {
      const parsed = JSON.parse(bruto) as Campanha
      if (parsed && parsed.id) return parsed
    }
  } catch {
    // dados corrompidos — cai para o exemplo
  }
  return criarCampanhaExemplo()
}

interface ContextoCampanha {
  estado: Campanha
  dispatch: React.Dispatch<Acao>
  ultimoItensSnapshot: React.MutableRefObject<Item[] | null>
  salvarSnapshotItens: () => void
  desfazerItens: () => boolean
}

const Contexto = createContext<ContextoCampanha | null>(null)

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, undefined, carregarInicial)
  const ultimoItensSnapshot = useRef<Item[] | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado))
    } catch {
      // localStorage cheio ou indisponível — a sessão continua em memória
    }
  }, [estado])

  const salvarSnapshotItens = () => {
    ultimoItensSnapshot.current = estado.itens
  }

  const desfazerItens = (): boolean => {
    if (!ultimoItensSnapshot.current) return false
    dispatch({ tipo: 'SET_ITENS', itens: ultimoItensSnapshot.current })
    ultimoItensSnapshot.current = null
    return true
  }

  const valor = useMemo(
    () => ({ estado, dispatch, ultimoItensSnapshot, salvarSnapshotItens, desfazerItens }),
    [estado],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useCampanha() {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useCampanha precisa estar dentro de CampaignProvider')
  return ctx
}
