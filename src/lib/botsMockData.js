// Mock data para a plataforma de monitoramento de bots
// Esses dados simulam o que viria de endpoints reais no futuro
// (ex: /api/bots/:slug/sessions, /api/bots/:slug/funnel, /api/bots/alerts)
//
// Quando o backend tiver os endpoints, troque os exports daqui por chamadas
// a `api.*` em src/lib/api.js — os componentes não precisam mudar nada.

// ===== Bots mockados (apresentação) =====
// Lista rica e densa para garantir visibilidade imediata sem depender do backend.
// Quando o backend tiver dados reais, troque os imports nos componentes
// (Overview, Ranking, Sessions) por useBots() — a estrutura é compatível.
export const MOCK_BOTS = [
  {
    slug: 'isis',
    name: 'Isis · Assistente Comercial',
    botFunction: 'Atendimento (IA)',
    description: 'IA vendedora consultiva no WhatsApp · Gemini · qualifica leads pra Imersão de Liderança',
    status: 'online',
    versao: '2.1.0',
    responsavel: 'Comercial',
    stack: ['Node.js', 'Gemini', 'whatsapp-web.js', 'Supabase'],
  },
  {
    slug: 'bot_whatsapp',
    name: 'Bot WhatsApp · Grupo Elis',
    botFunction: 'Atendimento WhatsApp',
    description: 'Bot principal de atendimento do grupo · respostas automáticas + roteamento',
    status: 'online',
    versao: '1.4.2',
    responsavel: 'Suporte',
    stack: ['Node.js', 'whatsapp-web.js', 'Express'],
  },
  {
    slug: 'bulkwhatsappcall',
    name: 'BulkWhatsAppCall · Disparo Massa',
    botFunction: 'Envio em massa',
    description: 'Disparador de campanhas com filas, rate-limit e tracking de funil',
    status: 'online',
    versao: '1.0.3',
    responsavel: 'Marketing',
    stack: ['Node.js', 'Redis', 'BullMQ'],
  },
  {
    slug: 'bot-ligacao',
    name: 'Bot Ligação · Reativação',
    botFunction: 'Discagem',
    description: 'Discador automático pra leads frios · integração Twilio',
    status: 'offline',
    versao: '0.9.1',
    responsavel: 'Marketing',
    stack: ['Node.js', 'Twilio'],
  },
  {
    slug: 'whatsapp-bot_pedagogia',
    name: 'Pós-Venda · Pedagogia',
    botFunction: 'Atendimento WhatsApp',
    description: 'Follow-up automático pós-venda de cursos · sincroniza com Sheets',
    status: 'online',
    versao: '1.2.0',
    responsavel: 'Customer Success',
    stack: ['Node.js', 'Google Sheets', 'whatsapp-web.js'],
  },
  {
    slug: 'instagram-direct',
    name: 'Instagram Direct · Lançamentos',
    botFunction: 'Envio em massa',
    description: 'Engajamento via DM Instagram a partir de stories e ads',
    status: 'warning',
    versao: '0.4.7',
    responsavel: 'Marketing',
    stack: ['Python', 'Selenium', 'Supabase'],
  },
]

// ===== Funil agregado por slug =====
// Estrutura: cada slug tem seu funil de 4 etapas
export const MOCK_FUNNELS = {
  'isis': {
    contatados: 1240, entregues: 1198, visualizados: 982, respondidos: 412,
  },
  'bot_whatsapp': {
    contatados: 860, entregues: 840, visualizados: 720, respondidos: 380,
  },
  'bulkwhatsappcall': {
    contatados: 2100, entregues: 2050, visualizados: 1480, respondidos: 290,
  },
  'bot-ligacao': {
    contatados: 540, entregues: 510, visualizados: 320, respondidos: 88,
  },
  'whatsapp-bot_pedagogia': {
    contatados: 480, entregues: 475, visualizados: 430, respondidos: 295,
  },
  'instagram-direct': {
    contatados: 320, entregues: 280, visualizados: 210, respondidos: 64,
  },
}

// Funil default para slugs sem mock
export const FUNNEL_DEFAULT = {
  contatados: 120, entregues: 115, visualizados: 90, respondidos: 32,
}

export function getFunnelFor(slug) {
  return MOCK_FUNNELS[slug] || FUNNEL_DEFAULT
}

// ===== SESSÕES (execuções) =====
// status: 'rodando' | 'finalizada' | 'caiu'
// motivo_fim: 'concluida_normal' | 'parada_manual' | 'queda_conexao' | 'erro_sistema' | 'timeout' | null
export const MOCK_SESSIONS = [
  { id: 's-01', bot_slug: 'isis',                   inicio: '2026-06-12 07:00', fim: null,                 duracao_min: 320, status: 'rodando',    motivo_fim: null,                contatados: 380,  entregues: 370,  visualizados: 310, respondidos: 142 },
  { id: 's-02', bot_slug: 'bot_whatsapp',           inicio: '2026-06-12 06:30', fim: null,                 duracao_min: 350, status: 'rodando',    motivo_fim: null,                contatados: 540,  entregues: 525,  visualizados: 460, respondidos: 240 },
  { id: 's-03', bot_slug: 'bulkwhatsappcall',       inicio: '2026-06-11 14:00', fim: '2026-06-11 17:45',   duracao_min: 225, status: 'finalizada', motivo_fim: 'concluida_normal',  contatados: 1250, entregues: 1220, visualizados: 860, respondidos: 125 },
  { id: 's-04', bot_slug: 'isis',                   inicio: '2026-06-11 08:30', fim: '2026-06-11 11:20',   duracao_min: 170, status: 'finalizada', motivo_fim: 'concluida_normal',  contatados: 320,  entregues: 310,  visualizados: 260, respondidos: 98 },
  { id: 's-05', bot_slug: 'bot-ligacao',            inicio: '2026-06-10 09:15', fim: '2026-06-10 09:42',   duracao_min: 27,  status: 'caiu',       motivo_fim: 'queda_conexao',     contatados: 88,   entregues: 80,   visualizados: 42,  respondidos: 9 },
  { id: 's-06', bot_slug: 'whatsapp-bot_pedagogia', inicio: '2026-06-10 10:00', fim: '2026-06-10 14:30',   duracao_min: 270, status: 'finalizada', motivo_fim: 'concluida_normal',  contatados: 480,  entregues: 475,  visualizados: 430, respondidos: 295 },
  { id: 's-07', bot_slug: 'bot-ligacao',            inicio: '2026-06-09 19:45', fim: '2026-06-09 20:18',   duracao_min: 33,  status: 'caiu',       motivo_fim: 'timeout',           contatados: 64,   entregues: 50,   visualizados: 38,  respondidos: 12 },
  { id: 's-08', bot_slug: 'bulkwhatsappcall',       inicio: '2026-06-09 13:00', fim: '2026-06-09 18:20',   duracao_min: 320, status: 'finalizada', motivo_fim: 'concluida_normal',  contatados: 850,  entregues: 830,  visualizados: 620, respondidos: 165 },
  { id: 's-09', bot_slug: 'bot-ligacao',            inicio: '2026-06-09 10:30', fim: '2026-06-09 10:38',   duracao_min: 8,   status: 'caiu',       motivo_fim: 'erro_sistema',      contatados: 12,   entregues: 8,    visualizados: 3,   respondidos: 0 },
  { id: 's-10', bot_slug: 'bot_whatsapp',           inicio: '2026-06-09 06:30', fim: '2026-06-09 18:00',   duracao_min: 690, status: 'finalizada', motivo_fim: 'parada_manual',     contatados: 320,  entregues: 315,  visualizados: 260, respondidos: 140 },
  { id: 's-11', bot_slug: 'whatsapp-bot_pedagogia', inicio: '2026-06-08 09:00', fim: '2026-06-08 12:15',   duracao_min: 195, status: 'finalizada', motivo_fim: 'concluida_normal',  contatados: 240,  entregues: 238,  visualizados: 220, respondidos: 160 },
  { id: 's-12', bot_slug: 'isis',                   inicio: '2026-06-08 18:00', fim: '2026-06-08 18:05',   duracao_min: 5,   status: 'caiu',       motivo_fim: 'erro_sistema',      contatados: 4,    entregues: 2,    visualizados: 1,   respondidos: 0 },
]

export const MOTIVO_LABEL = {
  concluida_normal: 'Concluída normalmente',
  parada_manual:    'Parada manual',
  queda_conexao:    'Queda de conexão',
  erro_sistema:     'Erro de sistema',
  timeout:          'Timeout',
}

// ===== ALERTAS ATIVOS =====
export const MOCK_ALERTS = [
  { id: 'a-1', tipo: 'danger',  titulo: 'Bot "Reativação Lead Frio" offline há 1 dia',           detalhe: 'Última queda: queda de conexão em 10/06 09:42' },
  { id: 'a-2', tipo: 'warning', titulo: 'Instagram Direct: 3 quedas nos últimos 5 dias',          detalhe: 'Recorrência alta — investigar root cause' },
  { id: 'a-3', tipo: 'warning', titulo: 'Promo Black Friday: taxa de resposta caiu 18%',          detalhe: 'Comparado à semana anterior' },
  { id: 'a-4', tipo: 'info',    titulo: 'Pós-Venda lidera ranking pela 4ª semana',                detalhe: '61.5% de taxa de resposta — replicar abordagem' },
]

// ===== LOGS / EVENTOS (alimenta a aba Logs quando não há bot selecionado) =====
export const MOCK_LOGS = [
  { ts: '12/06 10:23:14', nivel: 'info',  bot: 'isis',                  texto: 'Sessão s-01 iniciada · whatsapp-web.js conectado' },
  { ts: '12/06 10:23:18', nivel: 'ok',    bot: 'isis',                  texto: 'QR autenticado · número +55 11 9****-4127' },
  { ts: '12/06 10:24:02', nivel: 'info',  bot: 'isis',                  texto: 'Enviada msg para +55 11 9****-2341 (lead Imersão)' },
  { ts: '12/06 10:24:05', nivel: 'ok',    bot: 'isis',                  texto: 'msg entregue · ✓✓' },
  { ts: '12/06 10:24:11', nivel: 'ok',    bot: 'isis',                  texto: 'msg visualizada · ✓✓ azul' },
  { ts: '12/06 10:25:00', nivel: 'info',  bot: 'bot_whatsapp',          texto: 'Resposta recebida de +55 11 9****-8819' },
  { ts: '12/06 10:25:34', nivel: 'warn',  bot: 'bot-ligacao',           texto: 'Lentidão de resposta detectada (>3s)' },
  { ts: '12/06 10:26:12', nivel: 'info',  bot: 'bulkwhatsappcall',      texto: 'Enviada msg para batch de 50 contatos' },
  { ts: '12/06 10:26:48', nivel: 'ok',    bot: 'bulkwhatsappcall',      texto: '47/50 entregues, 3 com número inválido' },
  { ts: '12/06 10:27:01', nivel: 'error', bot: 'bot-ligacao',           texto: 'Falha ao conectar · tentando reconexão (2/5)' },
  { ts: '12/06 10:27:30', nivel: 'error', bot: 'bot-ligacao',           texto: 'Reconexão falhou · sessão marcada como caída' },
  { ts: '12/06 10:28:00', nivel: 'info',  bot: 'whatsapp-bot_pedagogia',texto: 'Sessão pós-venda concluída · 12 follow-ups enviados' },
  { ts: '12/06 10:28:14', nivel: 'ok',    bot: 'bot_whatsapp',          texto: 'Lead qualificado: +55 11 9****-3344 marcou reunião' },
  { ts: '12/06 10:29:00', nivel: 'info',  bot: 'isis',                  texto: 'Recebida msg de retorno · regra de auto-resposta ativada' },
  { ts: '12/06 10:29:48', nivel: 'warn',  bot: 'sistema',               texto: 'Uso de memória do worker-2 em 78%' },
]

// ===== HEATMAP 7 dias × 24h (volume de envios estimado) =====
function gerarHeatmap() {
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const matriz = dias.map((d, di) => {
    return Array.from({ length: 24 }, (_, h) => {
      let base = 0
      const isWeekday = di < 5
      if (h >= 9 && h <= 11) base = isWeekday ? 80 + Math.random() * 50 : 15 + Math.random() * 20
      else if (h >= 14 && h <= 18) base = isWeekday ? 60 + Math.random() * 40 : 12 + Math.random() * 15
      else if (h >= 7 && h <= 19) base = isWeekday ? 25 + Math.random() * 30 : 8 + Math.random() * 12
      else base = Math.random() * 5
      return Math.round(base)
    })
  })
  return { dias, matriz }
}

export const HEATMAP = gerarHeatmap()

// ===== HISTÓRICO 7 dias (envios x respostas) =====
export const HISTORICO_7D = [
  { dia: 'Seg', enviados: 820,  respondidos: 180 },
  { dia: 'Ter', enviados: 940,  respondidos: 240 },
  { dia: 'Qua', enviados: 1100, respondidos: 310 },
  { dia: 'Qui', enviados: 980,  respondidos: 290 },
  { dia: 'Sex', enviados: 1320, respondidos: 420 },
  { dia: 'Sáb', enviados: 760,  respondidos: 200 },
  { dia: 'Dom', enviados: 620,  respondidos: 165 },
]

// ===== DISTRIBUIÇÃO DE ERROS =====
export const ERROS_DISTRIBUICAO = [
  { motivo: 'Queda de conexão', total: 8, cor: '#dc2626' },
  { motivo: 'Erro de sistema',  total: 4, cor: '#ea580c' },
  { motivo: 'Timeout',          total: 3, cor: '#d97706' },
  { motivo: 'Rate limit',       total: 2, cor: '#ca8a04' },
  { motivo: 'Outros',           total: 1, cor: '#737373' },
]
