// Modelo de dados central da campanha "Oficina de Campo"

export type ID = string

export type Localizacao =
  | 'carregado'
  | 'laboratorio'
  | 'veiculo'
  | 'base'
  | 'outra_realidade'
  | 'desconhecida'

export type EstadoItem =
  | 'intacto'
  | 'danificado'
  | 'improvisado'
  | 'instavel'
  | 'contaminado'
  | 'descarregado'
  | 'rastreado'
  | 'inutilizado'
  | 'perdido'
  | 'destruido'
  | 'roubado'
  | 'esgotado'

export type CategoriaItem =
  | 'equipamento'
  | 'objeto_base'
  | 'consumivel'
  | 'narrativo'
  | 'experimental'

export interface HistoricoEntrada {
  id: ID
  data: string // ISO
  descricao: string
  valorAnterior?: string
  valorNovo?: string
}

export interface Item {
  id: ID
  nome: string
  categoria: CategoriaItem
  descricao: string
  quantidade: number
  pesoOuEspaco: number
  localizacao: Localizacao
  estado: EstadoItem
  cargaAtual?: number
  cargaMaxima?: number
  origem: string
  funcaoConhecida: string
  limitacoesConhecidas: string
  riscosConhecidos: string
  informacoesDesconhecidas: string
  tags: string[]
  observacoes: string
  sessaoObtido: number
  dataObtido: string
  arquivado: boolean
  historico: HistoricoEntrada[]
}

export type CorAlerta = 'ciano' | 'ambar' | 'ferrugem'

export interface Recurso {
  id: ID
  nome: string
  valorAtual: number
  valorMaximo?: number
  unidade: string
  descricao: string
  corAlerta: CorAlerta
  historico: HistoricoEntrada[]
}

export type GravidadeFalha = 'menor' | 'moderada' | 'grave' | 'catastrofica'
export type StatusFalha = 'ativa' | 'contida' | 'reparada' | 'agravada' | 'permanente'
export type CausaFalha = 'equipamento' | 'jogador' | 'regra_desconhecida' | 'terceiros' | 'imprevisivel'

export interface FalhaTecnica {
  id: ID
  equipamentoId: ID | null
  equipamentoNome: string
  nomeFalha: string
  gravidade: GravidadeFalha
  descricao: string
  sintomas: string
  causa: CausaFalha
  causaDetalhe: string
  dataDescoberta: string
  recursoExigidoReparo: string
  tempoEstimadoReparo: string
  riscoPiora: string
  status: StatusFalha
  consequenciaAssociada: string
  geradaAleatoriamente: boolean
  sessaoOrigem: number
  historico: HistoricoEntrada[]
}

export type NivelConhecimento = 'conhecido' | 'suspeitado' | 'segredo_narrador'

export interface Personagem {
  id: ID
  nome: string
  funcaoNarrativa: string
  localizacaoAtual: string
  realidadeOrigem: string
  relacaoComProtagonista: string
  objetivoConhecido: string
  confianca: number // 0-100
  dividaOuPromessa: string
  segredo: string
  segredoNivel: NivelConhecimento
  segredoRevelado: boolean
  estadoAtual: string
  ultimaInteracao: string
  sessaoIntroduzido: number
  historico: HistoricoEntrada[]
}

export type TipoRegistroNarrativo =
  | 'subtrama'
  | 'pista'
  | 'pergunta_sem_resposta'
  | 'dilema_moral'
  | 'consequencia_pendente'
  | 'promessa'
  | 'divida'
  | 'decisao_irreversivel'

export type StatusRegistroNarrativo =
  | 'nao_iniciada'
  | 'ativa'
  | 'pausada'
  | 'resolvida'
  | 'perdida'
  | 'transformada'
  | 'desconhecida'

export interface RegistroNarrativo {
  id: ID
  tipo: TipoRegistroNarrativo
  titulo: string
  descricao: string
  status: StatusRegistroNarrativo
  personagensEnvolvidos: ID[]
  episodioOrigem: number
  ultimaAtualizacao: string
  proximaConsequenciaPossivel: string
  conexoes: ID[] // ids de outros RegistroNarrativo
  visivelProtagonista: boolean // segredos do narrador podem ficar ocultos
  historico: HistoricoEntrada[]
}

export interface Sessao {
  id: ID
  numero: number
  temporada: number
  episodio: number
  dataReal: string
  localHistoria: string
  resumo: string
  decisoesImportantes: string
  acontecimentosConfirmados: string
  consequenciasImediatas: string
  novasPistas: string
  alteracoesInventario: string
  alteracoesRecursos: string
  falhasOcorridas: string
  subtramasAfetadas: string
  pontoDeRetomada: string
}

export type TipoEventoAuditoria =
  | 'inventario'
  | 'recursos'
  | 'falhas'
  | 'personagens'
  | 'narrativa'
  | 'sessao'
  | 'sistema'

export interface EventoAuditoria {
  id: ID
  dataHora: string
  tipo: TipoEventoAuditoria
  objetoAlterado: string
  valorAnterior: string
  valorNovo: string
  motivo: string
  sessaoAssociada: number | null
}

export interface EstadoProtagonista {
  nome: string
  condicaoFisica: string
  localizacaoAtual: string
  objetivoImediato: string
  nivelRisco: 'baixo' | 'moderado' | 'alto' | 'critico'
}

export interface Campanha {
  id: ID
  nomeCampanha: string
  temporadaAtual: number
  episodioAtual: number
  protagonista: EstadoProtagonista
  estabilidadePortal: number // 0-100
  integridadeNucleo: number // 0-100
  ultimaAlteracao: string
  itens: Item[]
  recursos: Recurso[]
  falhas: FalhaTecnica[]
  personagens: Personagem[]
  registrosNarrativos: RegistroNarrativo[]
  sessoes: Sessao[]
  auditoria: EventoAuditoria[]
  snapshots: { id: ID; data: string; rotulo: string; campanha: string }[]
}

export type SecaoAtiva =
  | 'dashboard'
  | 'inventario'
  | 'recursos'
  | 'falhas'
  | 'personagens'
  | 'narrativa'
  | 'diario'
  | 'historico'
  | 'backup'
