import { useEffect, useState } from 'react'
import { X, Save, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'

export default function ConfigBotModal({ bot, onClose, onSaved }) {
  const [cwd, setCwd] = useState('')
  const [command, setCommand] = useState('')
  const [argsText, setArgsText] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setError(null)
    api.getBotConfig(bot.slug).then((cfg) => {
      setCwd(cfg.cwd || '')
      setCommand(cfg.command || '')
      setArgsText(Array.isArray(cfg.args) ? cfg.args.join(' ') : '')
    }).catch(() => {})
  }, [bot.slug])

  const save = async () => {
    setBusy(true); setError(null)
    try {
      const args = argsText.trim() ? argsText.trim().split(/\s+/) : []
      await api.saveBotConfig(bot.slug, { cwd: cwd.trim(), command: command.trim(), args })
      onSaved?.()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm(`Remover configuracao de "${bot.name}"?`)) return
    setBusy(true); setError(null)
    try {
      await api.deleteBotConfig(bot.slug)
      onSaved?.()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-b-none md:rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="font-semibold">Configurar: {bot.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Define o comando que o Start vai executar</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Diretorio (cwd)
            </label>
            <input
              className="input font-mono text-sm"
              placeholder="C:\Users\grupo\Desktop\bot-whatsapp"
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Pasta onde o comando sera executado. Use caminho absoluto.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Comando
            </label>
            <input
              className="input font-mono text-sm"
              placeholder="node"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Executavel direto: <code className="bg-slate-100 px-1 rounded">node</code>, <code className="bg-slate-100 px-1 rounded">python</code>, ou caminho de .exe/.bat. Sem cmd/powershell.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Argumentos (separados por espaco)
            </label>
            <input
              className="input font-mono text-sm"
              placeholder="index.js --port 3030"
              value={argsText}
              onChange={(e) => setArgsText(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {bot.runInstructions?.length > 0 && (
            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2">
              <div className="font-medium mb-1">Dica do vault:</div>
              <pre className="font-mono whitespace-pre-wrap overflow-x-auto text-[11px]">
                {bot.runInstructions[0]}
              </pre>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 p-4 border-t border-slate-200 sticky bottom-0 bg-white">
          <button onClick={remove} disabled={busy} className="btn-ghost text-rose-600">
            <Trash2 size={14} /> Remover
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={busy} className="btn-secondary">Cancelar</button>
            <button onClick={save} disabled={busy || !cwd || !command} className="btn-primary">
              <Save size={14} /> Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
