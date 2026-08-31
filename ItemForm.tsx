import React, { useState } from 'react'
import { Item, CategoriaItem, Localizacao, EstadoItem } from '../../types'
import { Campo, classeInput, classeSelect, classeTextarea } from '../common/Primitivos'

const CATEGORIAS: CategoriaItem[] = ['equipamento', 'objeto_base', 'consumivel', 'narrativo', 'experimental']
const LOCALIZACOES: Localizacao[] = ['carregado', 'laboratorio', 'veiculo', 'base', 'outra_realidade', 'desconhecida']
const ESTADOS: EstadoItem[] = [
  'intacto',
  'danificado',
  'improvisado',
  'instavel',
  'contaminado',
  'descarregado',
  'rastreado',
  'inutilizado',
  'perdido',
  'destruido',
  'roubado',
  'esgotado',
]

export type RascunhoItem = Omit<Item, 'id' | 'historico' | 'arquivado'>

export function rascunhoVazio(sessaoAtual: number): RascunhoItem {
  return {
    nome: '',
    categoria: 'objeto_base',
    descricao: '',
    quantidade: 1,
    pesoOuEspaco: 1,
    localizacao: 'carregado',
    estado: 'intacto',
    origem: '',
    funcaoConhecida: '',
    limitacoesConhecidas: '',
    riscosConhecidos: '',
    informacoesDesconhecidas: '',
    tags: [],
    observacoes: '',
    sessaoObtido: sessaoAtual,
    dataObtido: new Date().toISOString(),
  }
}

export default function ItemForm({
  inicial,
  onSalvar,
  onCancelar,
}: {
  inicial: RascunhoItem
  onSalvar: (r: RascunhoItem) => void
  onCancelar: () => void
}) {
  const [r, setR] = useState<RascunhoItem>(inicial)
  const [tagsTexto, setTagsTexto] = useState(inicial.tags.join(', '))

  function alterar<K extends keyof RascunhoItem>(campo: K, valor: RascunhoItem[K]) {
    setR((prev) => ({ ...prev, [campo]: valor }))
  }

  function submeter(e: React.FormEvent) {
    e.preventDefault()
    if (!r.nome.trim()) return
    onSalvar({
      ...r,
      tags: tagsTexto
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    })
  }

  return (
    <form onSubmit={submeter}>
      <Campo rotulo="Nome do item">
        <input
          className={classeInput}
          value={r.nome}
          onChange={(e) => alterar('nome', e.target.value)}
          required
          autoFocus
        />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Categoria">
          <select className={classeSelect} value={r.categoria} onChange={(e) => alterar('categoria', e.target.value as CategoriaItem)}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c.replace('_', ' ')}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Estado de conservação">
          <select className={classeSelect} value={r.estado} onChange={(e) => alterar('estado', e.target.value as EstadoItem)}>
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo rotulo="Descrição">
        <textarea className={classeTextarea} value={r.descricao} onChange={(e) => alterar('descricao', e.target.value)} />
      </Campo>

      <div className="grid grid-cols-3 gap-3">
        <Campo rotulo="Quantidade">
          <input
            type="number"
            min={0}
            className={classeInput}
            value={r.quantidade}
            onChange={(e) => alterar('quantidade', Math.max(0, Number(e.target.value)))}
          />
        </Campo>
        <Campo rotulo="Peso/espaço">
          <input
            type="number"
            min={0}
            className={classeInput}
            value={r.pesoOuEspaco}
            onChange={(e) => alterar('pesoOuEspaco', Math.max(0, Number(e.target.value)))}
          />
        </Campo>
        <Campo rotulo="Localização">
          <select className={classeSelect} value={r.localizacao} onChange={(e) => alterar('localizacao', e.target.value as Localizacao)}>
            {LOCALIZACOES.map((l) => (
              <option key={l} value={l}>
                {l.replace('_', ' ')}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Carga atual (opcional)">
          <input
            type="number"
            className={classeInput}
            value={r.cargaAtual ?? ''}
            onChange={(e) => alterar('cargaAtual', e.target.value === '' ? undefined : Number(e.target.value))}
          />
        </Campo>
        <Campo rotulo="Carga máxima (opcional)">
          <input
            type="number"
            className={classeInput}
            value={r.cargaMaxima ?? ''}
            onChange={(e) => alterar('cargaMaxima', e.target.value === '' ? undefined : Number(e.target.value))}
          />
        </Campo>
      </div>

      <Campo rotulo="Origem">
        <input className={classeInput} value={r.origem} onChange={(e) => alterar('origem', e.target.value)} />
      </Campo>
      <Campo rotulo="Função conhecida">
        <textarea className={classeTextarea} value={r.funcaoConhecida} onChange={(e) => alterar('funcaoConhecida', e.target.value)} />
      </Campo>
      <Campo rotulo="Limitações conhecidas">
        <textarea className={classeTextarea} value={r.limitacoesConhecidas} onChange={(e) => alterar('limitacoesConhecidas', e.target.value)} />
      </Campo>
      <Campo rotulo="Riscos conhecidos">
        <textarea className={classeTextarea} value={r.riscosConhecidos} onChange={(e) => alterar('riscosConhecidos', e.target.value)} />
      </Campo>
      <Campo rotulo="Informações desconhecidas">
        <textarea
          className={classeTextarea}
          value={r.informacoesDesconhecidas}
          onChange={(e) => alterar('informacoesDesconhecidas', e.target.value)}
        />
      </Campo>
      <Campo rotulo="Tags (separadas por vírgula)">
        <input className={classeInput} value={tagsTexto} onChange={(e) => setTagsTexto(e.target.value)} />
      </Campo>
      <Campo rotulo="Observações pessoais">
        <textarea className={classeTextarea} value={r.observacoes} onChange={(e) => alterar('observacoes', e.target.value)} />
      </Campo>
      <Campo rotulo="Sessão em que foi obtido">
        <input
          type="number"
          min={0}
          className={classeInput}
          value={r.sessaoObtido}
          onChange={(e) => alterar('sessaoObtido', Number(e.target.value))}
        />
      </Campo>

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancelar} className="btn-focus rounded border border-metal px-3 py-1.5 text-sm text-marfim-dim hover:text-marfim">
          Cancelar
        </button>
        <button type="submit" className="btn-focus rounded bg-ambar px-4 py-1.5 text-sm font-medium text-carvao hover:bg-ambar-light">
          Salvar item
        </button>
      </div>
    </form>
  )
}
