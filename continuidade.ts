import { Campanha } from '../types'
import { formatarData } from './id'

// Gera o bloco de continuidade em português, separando o que é público
// (conhecido/suspeitado pelo protagonista) do que é segredo do narrador.
// Segredos do narrador NUNCA são incluídos aqui, mesmo que estejam marcados
// como revelados na interface — a revelação em cena deve ocorrer na narrativa,
// não vazar por este relatório.
export function gerarBlocoContinuidade(c: Campanha): string {
  const linhas: string[] = []
  const push = (t = '') => linhas.push(t)

  push(`# CONTINUIDADE — ${c.nomeCampanha}`)
  push(`Gerado em ${formatarData(new Date().toISOString())}`)
  push('')

  push('## Fatos canônicos confirmados')
  const ultimasSessoes = [...c.sessoes].sort((a, b) => b.numero - a.numero).slice(0, 3)
  if (ultimasSessoes.length === 0) {
    push('- Nenhuma sessão registrada ainda.')
  } else {
    ultimasSessoes.forEach((s) => {
      if (s.acontecimentosConfirmados.trim()) push(`- (Sessão ${s.numero}) ${s.acontecimentosConfirmados}`)
      if (s.decisoesImportantes.trim()) push(`- (Sessão ${s.numero}) Decisão: ${s.decisoesImportantes}`)
    })
  }
  push('')

  push('## Estado atual do protagonista')
  push(`- Nome: ${c.protagonista.nome}`)
  push(`- Localização: ${c.protagonista.localizacaoAtual}`)
  push(`- Condição física: ${c.protagonista.condicaoFisica}`)
  push(`- Objetivo imediato: ${c.protagonista.objetivoImediato}`)
  push(`- Nível de risco: ${c.protagonista.nivelRisco}`)
  push(`- Estabilidade do portal: ${c.estabilidadePortal}%`)
  push(`- Integridade do núcleo: ${c.integridadeNucleo}%`)
  push('')

  push('## Inventário carregado')
  const carregados = c.itens.filter((i) => !i.arquivado && i.localizacao === 'carregado')
  if (carregados.length === 0) push('- Nada carregado no momento.')
  carregados.forEach((i) => push(`- ${i.nome} (x${i.quantidade}) — estado: ${i.estado}`))
  push('')

  push('## Recursos disponíveis')
  if (c.recursos.length === 0) push('- Nenhum recurso cadastrado.')
  c.recursos.forEach((r) => push(`- ${r.nome}: ${r.valorAtual}${r.valorMaximo !== undefined ? `/${r.valorMaximo}` : ''} ${r.unidade}`))
  push('')

  push('## Equipamentos danificados / condição técnica conhecida')
  const danificados = c.itens.filter((i) => !i.arquivado && ['danificado', 'instavel', 'contaminado', 'inutilizado', 'rastreado'].includes(i.estado))
  if (danificados.length === 0) push('- Nenhum equipamento com problema conhecido.')
  danificados.forEach((i) => push(`- ${i.nome}: ${i.estado}`))
  const falhasAtivas = c.falhas.filter((f) => f.status === 'ativa' || f.status === 'agravada')
  falhasAtivas.forEach((f) => push(`- Falha ${f.gravidade} em ${f.equipamentoNome}: ${f.nomeFalha}`))
  push('')

  push('## NPCs e relações')
  if (c.personagens.length === 0) push('- Nenhum personagem registrado.')
  c.personagens.forEach((p) => {
    push(`- ${p.nome} (${p.funcaoNarrativa || 'função não definida'}) — confiança ${p.confianca}, local: ${p.localizacaoAtual || 'desconhecido'}`)
    if (p.dividaOuPromessa.trim()) push(`  · dívida/promessa: ${p.dividaOuPromessa}`)
    if (p.segredoNivel !== 'segredo_narrador' && p.segredo.trim()) push(`  · conhecido: ${p.segredo}`)
  })
  push('')

  push('## Subtramas percebidas pelo protagonista')
  const subtramasVisiveis = c.registrosNarrativos.filter((r) => r.tipo === 'subtrama' && r.visivelProtagonista)
  if (subtramasVisiveis.length === 0) push('- Nenhuma subtrama percebida ainda.')
  subtramasVisiveis.forEach((r) => push(`- ${r.titulo} [${r.status}]: ${r.descricao}`))
  push('')

  push('## Pistas descobertas')
  const pistasVisiveis = c.registrosNarrativos.filter((r) => r.tipo === 'pista' && r.visivelProtagonista)
  if (pistasVisiveis.length === 0) push('- Nenhuma pista registrada.')
  pistasVisiveis.forEach((r) => push(`- ${r.titulo}: ${r.descricao}`))
  push('')

  push('## Hipóteses do protagonista (suspeitas, não confirmadas)')
  const suspeitas = c.personagens.filter((p) => p.segredoNivel === 'suspeitado')
  const perguntas = c.registrosNarrativos.filter((r) => r.tipo === 'pergunta_sem_resposta' && r.visivelProtagonista)
  if (suspeitas.length === 0 && perguntas.length === 0) push('- Nenhuma hipótese registrada.')
  suspeitas.forEach((p) => push(`- Sobre ${p.nome}: algo suspeito, ainda não confirmado.`))
  perguntas.forEach((r) => push(`- ${r.titulo}: ${r.descricao}`))
  push('')

  push('## Consequências pendentes, promessas e dívidas')
  const pendentes = c.registrosNarrativos.filter(
    (r) => ['consequencia_pendente', 'promessa', 'divida', 'decisao_irreversivel'].includes(r.tipo) && r.visivelProtagonista,
  )
  if (pendentes.length === 0) push('- Nenhuma pendência registrada.')
  pendentes.forEach((r) => push(`- [${r.tipo.replace('_', ' ')}] ${r.titulo}: ${r.descricao}`))
  push('')

  push('## Local e situação exata de retomada')
  const ultima = ultimasSessoes[0]
  push(ultima?.pontoDeRetomada?.trim() ? `- ${ultima.pontoDeRetomada}` : `- ${c.protagonista.localizacaoAtual} — ${c.protagonista.objetivoImediato}`)
  push('')

  push('## Foco obrigatório da próxima cena')
  push(ultima?.subtramasAfetadas?.trim() ? `- ${ultima.subtramasAfetadas}` : '- A definir pelo narrador com base no estado atual acima.')
  push('')

  push('---')
  push('Nota: este bloco não inclui segredos do narrador. Informações classificadas como "segredo do narrador" foram omitidas propositalmente.')

  return linhas.join('\n')
}
