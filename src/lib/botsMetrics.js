// Helpers de métrica para a plataforma de bots
// Centraliza cálculos de score e formatadores reaproveitados em várias abas.

// ===== Score de desempenho =====
// Fórmula equilibrada: 50% taxa de resposta + 30% taxa de visualização + 20% volume normalizado
// Recompensa eficiência (resposta) E escala (volume), evitando que um bot com 10 envios e 9 respostas
// fique acima de um que entrega 400 respostas em 1000 contatos.
export function calcularScore(funnel, maxVolume = 1) {
  if (!funnel || !funnel.contatados) return 0
  const taxaResp = funnel.respondidos / funnel.contatados
  const taxaVis  = funnel.entregues ? funnel.visualizados / funnel.entregues : 0
  const volNorm  = funnel.contatados / Math.max(maxVolume, 1)
  const score    = (0.5 * taxaResp + 0.3 * taxaVis + 0.2 * volNorm) * 100
  return Math.round(score * 10) / 10
}

// Determina o volume máximo entre vários funis (pra normalizar volume no score)
export function maxVolume(funnels) {
  if (!funnels || funnels.length === 0) return 1
  return Math.max(...funnels.map((f) => f?.contatados || 0), 1)
}

// ===== Formatadores =====
export function pct(num, den) {
  if (!den) return '0%'
  return ((num / den) * 100).toFixed(1) + '%'
}

export function fmt(n) {
  return (n ?? 0).toLocaleString('pt-BR')
}

export function formatarDuracao(min) {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

// Agrega vários funis num funil global (soma das etapas)
export function agregarFunis(funnels) {
  return funnels.reduce(
    (acc, f) => ({
      contatados:   acc.contatados   + (f?.contatados   || 0),
      entregues:    acc.entregues    + (f?.entregues    || 0),
      visualizados: acc.visualizados + (f?.visualizados || 0),
      respondidos:  acc.respondidos  + (f?.respondidos  || 0),
    }),
    { contatados: 0, entregues: 0, visualizados: 0, respondidos: 0 }
  )
}
