export const CATEGORIES = ['Web App', 'Bot', 'Dashboard', 'Automação', 'Desktop', 'Outro']

// TODO(human): classificar a categoria de uma aplicação
//
// Recebe o objeto `app` parseado do vault:
//   {
//     slug:         string   ex: 'Gerenciador', 'Bot_WhatsApp', 'bot-ligacao'
//     name:         string
//     description:  string | null    1º parágrafo do README
//     status:       string | null    linha após '## Status' no README
//     components:   Array<{ layer, technology }>   da tabela '## Stack'
//     todos:        Array<...>
//     links:        Array<{ url, kind }>   kind: repo/prod/database/sheet/other
//     related:      string[]    wikilinks pra outros projetos
//     files:        { readme, architecture, tasks, decisions, bugs, context, logs }
//   }
//
// Retorne UMA string entre CATEGORIES acima.
//
// Heurísticas que você pode considerar (combine como quiser):
//   - slug/name contém 'Bot' / 'WhatsApp' / 'Call' / 'liga' → provavelmente Bot
//   - slug/name contém 'Dashboard' → Dashboard
//   - components tem alguma linha cujo technology inclui 'Electron' → Desktop
//   - components tem 'React' + 'Supabase' e sem 'Electron' → Web App
//   - description menciona 'automação' / 'planilha' / 'fluxo' / 'trigger' → Automação
//   - se nada bater, retorne 'Outro'
//
// Casos do seu vault (referência rápida):
//   'Gerenciador'        → ?  (HTML+JS+Supabase, hospedado em GitHub Pages)
//   'Bot_WhatsApp'       → ?  (Node + whatsapp-web.js + webhook)
//   'BulkWhatsAppCall'   → ?  (Electron desktop pra ligações WhatsApp)
//   'bot-ligacao'        → ?  (Electron cockpit pra discagem manual)
//   'centro-terapeutico' → ?  (React + Vite + Supabase)
//   'Dashboard_T10'      → ?  (hub de dashboards via iframe)
//   'Isis'               → ?  (IA SDR no WhatsApp)
//
// Sem resposta certa — você define o critério.
export function classifyCategory(app) {
  // sua implementação aqui
  return 'Outro'
}
