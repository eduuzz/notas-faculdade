import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import { getFreshToken } from './useNotas'
import {
  CheckCircle2, XCircle, Loader2, BookOpen, Save,
  Search, ChevronDown, ChevronRight, SaveAll, AlertTriangle,
  RefreshCw, X, ArrowRightLeft, Plus, Eye, EyeOff
} from 'lucide-react'

/* ── Status helpers ── */
const STATUS_OPTIONS = [
  { value: 'EM_CURSO',     label: 'Em Curso',   cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { value: 'APROVADA',     label: 'Aprovada',   cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { value: 'REPROVADA',    label: 'Reprovada',  cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  { value: 'NAO_INICIADA', label: 'Pendente',   cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
]

const LEGACY_MAP = {
  aprovado: 'APROVADA', reprovado: 'REPROVADA', cursando: 'EM_CURSO',
}

function normalizeStatus(s) {
  return LEGACY_MAP[s] || s || 'NAO_INICIADA'
}

function getStatusInfo(status) {
  const norm = normalizeStatus(status)
  return STATUS_OPTIONS.find(o => o.value === norm) || STATUS_OPTIONS[3]
}

/* ── Reusable components ── */
function StatusBadge({ status }) {
  const s = getStatusInfo(status)
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  )
}

function StatusSelect({ value, onChange }) {
  const info = getStatusInfo(value)
  return (
    <select
      value={normalizeStatus(value)}
      onChange={e => onChange(e.target.value)}
      className={`text-[11px] font-medium px-2 py-1 rounded-lg border cursor-pointer outline-none transition-colors ${info.cls} bg-transparent`}
    >
      {STATUS_OPTIONS.map(o => (
        <option key={o.value} value={o.value} className="bg-zinc-900 text-white">{o.label}</option>
      ))}
    </select>
  )
}

function NotaInput({ value, onChange, onKeyDown, placeholder = '—', disabled, inputRef }) {
  return (
    <input
      ref={inputRef}
      type="number"
      step="0.1"
      min="0"
      max="10"
      disabled={disabled}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm text-center tabular-nums
                 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40
                 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    />
  )
}

function SmallInput({ value, onChange, onKeyDown, type = 'number', placeholder, min, max, step, className = '' }) {
  return (
    <input
      type={type}
      step={step}
      min={min}
      max={max}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={`w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm text-center tabular-nums
                 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors ${className}`}
    />
  )
}

/* ── Main component ── */
export default function LancadorNotas() {
  const { user, loading: authLoading } = useAuth()
  const [disciplinas, setDisciplinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [drafts, setDrafts] = useState({})
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [collapsedSemesters, setCollapsedSemesters] = useState({})
  const [savingAll, setSavingAll] = useState(false)
  const [syncModal, setSyncModal] = useState(false)
  const [syncRA, setSyncRA] = useState('')
  const [syncSenha, setSyncSenha] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')
  const [syncResults, setSyncResults] = useState(null) // { novas, alteradas, semMudanca }
  const [syncError, setSyncError] = useState('')
  const inputRefs = useRef({})

  // Warn on exit with unsaved changes
  const dirtyCount = useMemo(() => {
    return disciplinas.filter(d => isDirtyCheck(d, drafts)).length
  }, [disciplinas, drafts])

  useEffect(() => {
    const handler = (e) => {
      if (dirtyCount > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirtyCount])

  // Load disciplines
  useEffect(() => {
    if (!user || !supabase) {
      if (!user) setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('disciplinas')
      .select('*')
      .eq('user_id', user.id)
      .order('periodo', { ascending: true })
      .then(({ data, error }) => {
        if (data) setDisciplinas(data)
        setLoading(false)
      })
  }, [user?.id])

  // Draft helpers
  const getDraft = useCallback((disc) => {
    const d = drafts[disc.id]
    return {
      ga:        d?.ga        ?? (disc.ga        !== null && disc.ga        !== undefined ? String(disc.ga)        : ''),
      gb:        d?.gb        ?? (disc.gb        !== null && disc.gb        !== undefined ? String(disc.gb)        : ''),
      notaFinal: d?.notaFinal ?? (disc.notaFinal !== null && disc.notaFinal !== undefined ? String(disc.notaFinal) : ''),
      status:    d?.status    ?? normalizeStatus(disc.status),
      periodo:   d?.periodo   ?? (disc.periodo  !== null && disc.periodo  !== undefined ? String(disc.periodo)  : ''),
      creditos:  d?.creditos  ?? (disc.creditos !== null && disc.creditos !== undefined ? String(disc.creditos) : ''),
      notaMinima: d?.notaMinima ?? (disc.notaMinima !== null && disc.notaMinima !== undefined ? String(disc.notaMinima) : '6'),
    }
  }, [drafts])

  const setDraft = useCallback((id, field, value) => {
    setDrafts(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }))
  }, [])

  const calcMedia = (ga, gb) => {
    const a = parseFloat(ga)
    const b = parseFloat(gb)
    if (!isNaN(a) && !isNaN(b)) return ((a + b) / 2).toFixed(1)
    return null
  }

  // Save single discipline
  const salvar = useCallback(async (disc) => {
    const d = getDraft(disc)
    const ga        = d.ga        !== '' ? parseFloat(d.ga)        : null
    const gb        = d.gb        !== '' ? parseFloat(d.gb)        : null
    const notaFinal = d.notaFinal !== '' ? parseFloat(d.notaFinal) : null
    const periodo   = d.periodo   !== '' ? parseInt(d.periodo)     : disc.periodo
    const creditos  = d.creditos  !== '' ? parseInt(d.creditos)    : disc.creditos
    const notaMinima = d.notaMinima !== '' ? parseFloat(d.notaMinima) : 6

    const updates = {
      ga, gb, notaFinal, periodo, creditos, notaMinima,
      updated_at: new Date().toISOString(),
    }

    // Auto-calc status from grades if status wasn't manually changed
    const statusManuallyChanged = drafts[disc.id]?.status !== undefined && drafts[disc.id].status !== normalizeStatus(disc.status)
    if (statusManuallyChanged) {
      updates.status = d.status
    } else {
      const media = notaFinal ?? (ga !== null && gb !== null ? (ga + gb) / 2 : null)
      if (media !== null) {
        updates.status = media >= notaMinima ? 'APROVADA' : 'REPROVADA'
      }
    }

    setSaving(prev => ({ ...prev, [disc.id]: 'saving' }))
    try {
      const token = await getFreshToken(supabase)
      const res = await fetch(
        `${supabase.supabaseUrl}/rest/v1/disciplinas?id=eq.${disc.id}&user_id=eq.${user.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabase.supabaseKey,
            'Authorization': `Bearer ${token}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(updates),
        }
      )
      if (!res.ok) throw new Error(await res.text())
      const [updated] = await res.json()
      setDisciplinas(prev => prev.map(dd => dd.id === disc.id ? { ...dd, ...updated } : dd))
      setDrafts(prev => { const n = { ...prev }; delete n[disc.id]; return n })
      setSaving(prev => ({ ...prev, [disc.id]: 'ok' }))
      setTimeout(() => setSaving(prev => ({ ...prev, [disc.id]: undefined })), 2000)
      return true
    } catch (e) {
      console.error(e)
      setSaving(prev => ({ ...prev, [disc.id]: 'err' }))
      setTimeout(() => setSaving(prev => ({ ...prev, [disc.id]: undefined })), 3000)
      return false
    }
  }, [drafts, user, getDraft])

  // Save all dirty
  const salvarTudo = useCallback(async () => {
    const dirtyDiscs = disciplinas.filter(d => isDirtyCheck(d, drafts))
    if (dirtyDiscs.length === 0) return
    setSavingAll(true)
    const results = await Promise.allSettled(dirtyDiscs.map(d => salvar(d)))
    setSavingAll(false)
    const ok = results.filter(r => r.status === 'fulfilled' && r.value).length
    const fail = dirtyDiscs.length - ok
    if (fail > 0) {
      console.warn(`[LancadorNotas] ${fail} disciplinas falharam ao salvar`)
    }
  }, [disciplinas, drafts, salvar])

  // Sync with portal
  const sincronizar = useCallback(async () => {
    if (!syncRA.trim() || !syncSenha) return
    setSyncing(true)
    setSyncError('')
    setSyncResults(null)
    setSyncStatus('Conectando ao servidor...')

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    try {
      const token = supabase ? await getFreshToken(supabase) : null
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      // Wake up server
      for (let i = 1; i <= 3; i++) {
        try {
          const r = await fetch(`${apiUrl}/api/health`, { signal: AbortSignal.timeout(15000), mode: 'cors' })
          if (r.ok) break
        } catch {
          if (i === 3) throw new Error('WAKE_FAIL')
          setSyncStatus('Servidor inicializando...')
          await new Promise(r => setTimeout(r, 2000))
        }
      }

      setSyncStatus('Buscando dados do portal...')
      const res = await fetch(`${apiUrl}/api/portal/historico`, {
        method: 'POST', headers,
        body: JSON.stringify({ ra: syncRA.trim(), senha: syncSenha }),
        signal: AbortSignal.timeout(180000),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || err.error || `Erro HTTP ${res.status}`)
      }

      const { data: portalDiscs } = await res.json()
      if (!portalDiscs?.length) throw new Error('Nenhuma disciplina encontrada no portal.')

      // Filter out metadata entries
      const reais = portalDiscs.filter(d => {
        const nome = (d.nome || '').toLowerCase()
        const codigo = d.codigo || ''
        if (nome.includes('<i>') || nome.includes('</i>')) return false
        if (nome.startsWith('total ch') || codigo.toLowerCase() === 'totchintegralizada') return false
        if (codigo === '-1' || codigo.toLowerCase() === 'totaismodalidade') return false
        if (nome.startsWith('modalidade:')) return false
        if (!codigo.trim() || !d.nome?.trim()) return false
        return true
      })

      // Deduplicate (keep best entry per name)
      const porNome = {}
      for (const d of reais) {
        const key = d.nome.toLowerCase().trim()
        if (!porNome[key]) porNome[key] = []
        porNome[key].push(d)
      }
      const dedup = []
      for (const entries of Object.values(porNome)) {
        const cursadas = entries.filter(e => e.semestreCursado)
        if (cursadas.length > 0) {
          const aprovadas = cursadas.filter(e => e.status === 'APROVADA')
          const comNota = aprovadas.filter(e => e.notaFinal != null)
          const best = comNota[0] || aprovadas[0] || cursadas.find(e => e.status === 'EM_CURSO') || cursadas[cursadas.length - 1]
          dedup.push(best)
        } else {
          dedup.push(entries[0])
        }
      }

      // Compare with local disciplines
      setSyncStatus('Comparando com suas disciplinas...')
      const novas = []
      const alteradas = []
      let semMudanca = 0

      for (const pd of dedup) {
        const local = disciplinas.find(d => d.nome?.toLowerCase().trim() === pd.nome?.toLowerCase().trim())
        if (!local) {
          novas.push(pd)
        } else {
          const mudancas = []
          if (pd.notaFinal != null && pd.notaFinal !== local.notaFinal) mudancas.push({ campo: 'Nota Final', de: local.notaFinal, para: pd.notaFinal })
          if (pd.ga != null && pd.ga !== local.ga) mudancas.push({ campo: 'GA', de: local.ga, para: pd.ga })
          if (pd.gb != null && pd.gb !== local.gb) mudancas.push({ campo: 'GB', de: local.gb, para: pd.gb })
          if (pd.status && pd.status !== normalizeStatus(local.status)) mudancas.push({ campo: 'Status', de: normalizeStatus(local.status), para: pd.status })
          if (pd.faltas != null && pd.faltas !== local.faltas) mudancas.push({ campo: 'Faltas', de: local.faltas, para: pd.faltas })
          if (mudancas.length > 0) {
            alteradas.push({ local, portal: pd, mudancas })
          } else {
            semMudanca++
          }
        }
      }

      setSyncResults({ novas, alteradas, semMudanca, totalPortal: dedup.length })
      setSyncStatus('')
    } catch (err) {
      const msg = err.message || ''
      if (msg === 'WAKE_FAIL') setSyncError('Servidor indisponível. Tente novamente em 30s.')
      else if (msg.includes('401') || msg.includes('Login') || msg.includes('Credenciais')) setSyncError('RA ou senha incorretos.')
      else if (msg.includes('timeout') || msg.includes('aborted')) setSyncError('Tempo esgotado. O portal pode estar lento.')
      else if (msg.includes('Nenhuma')) setSyncError(msg)
      else setSyncError(`Erro: ${msg}`)
    } finally {
      setSyncing(false)
    }
  }, [syncRA, syncSenha, disciplinas])

  // Apply a portal change as draft
  const aplicarMudanca = useCallback((localId, campo, valor) => {
    const fieldMap = { 'Nota Final': 'notaFinal', 'GA': 'ga', 'GB': 'gb', 'Status': 'status' }
    const field = fieldMap[campo]
    if (field) setDraft(localId, field, String(valor ?? ''))
  }, [setDraft])

  const aplicarTodas = useCallback(() => {
    if (!syncResults) return
    for (const { local, mudancas } of syncResults.alteradas) {
      for (const m of mudancas) {
        aplicarMudanca(local.id, m.campo, m.para)
      }
    }
  }, [syncResults, aplicarMudanca])

  // Keyboard navigation: Tab/Enter between inputs
  const handleKeyDown = useCallback((e, discId, field, discIndex, fields) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const disc = disciplinas.find(d => d.id === discId)
      if (disc && isDirtyCheck(disc, drafts)) {
        salvar(disc)
      }
      return
    }
    // Tab is handled natively, no custom logic needed
  }, [disciplinas, drafts, salvar])

  // Filter + search + group
  const filtros = [
    { key: 'all',          label: 'Todas' },
    { key: 'EM_CURSO',     label: 'Em Curso' },
    { key: 'APROVADA',     label: 'Aprovadas' },
    { key: 'REPROVADA',    label: 'Reprovadas' },
    { key: 'NAO_INICIADA', label: 'Pendentes' },
  ]

  const discsFiltradas = useMemo(() => {
    return disciplinas.filter(d => {
      const matchStatus = filter === 'all' || normalizeStatus(d.status) === filter
      const matchSearch = !search || d.nome?.toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchSearch
    })
  }, [disciplinas, filter, search])

  const grouped = useMemo(() => {
    const map = {}
    discsFiltradas.forEach(d => {
      const sem = d.periodo || 0
      if (!map[sem]) map[sem] = []
      map[sem].push(d)
    })
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([sem, discs]) => ({ sem: Number(sem), discs }))
  }, [discsFiltradas])

  const toggleSemester = (sem) => {
    setCollapsedSemesters(prev => ({ ...prev, [sem]: !prev[sem] }))
  }

  // Loading / auth states
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    )
  }

  if (!user) {
    window.location.href = '/'
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-3">
          {/* Top row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BookOpen size={20} className="text-indigo-400 flex-shrink-0" />
              <h1 className="text-lg font-semibold truncate">Lançador de Notas</h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {dirtyCount > 0 && (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertTriangle size={13} />
                  <span className="hidden sm:inline">{dirtyCount} não salva{dirtyCount > 1 ? 's' : ''}</span>
                  <span className="sm:hidden">{dirtyCount}</span>
                </span>
              )}
              <button
                onClick={() => { setSyncModal(true); setSyncResults(null); setSyncError('') }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                           bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20"
              >
                <RefreshCw size={14} />
                <span className="hidden sm:inline">Sincronizar Portal</span>
              </button>
              <button
                onClick={salvarTudo}
                disabled={dirtyCount === 0 || savingAll}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  dirtyCount > 0
                    ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                {savingAll ? <Loader2 size={14} className="animate-spin" /> : <SaveAll size={14} />}
                <span className="hidden sm:inline">Salvar Tudo</span>
              </button>
            </div>
          </div>

          {/* Search + filters */}
          <div className="flex items-center gap-3 mt-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar disciplina..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-sm text-white
                           placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              {filtros.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filter === f.key
                      ? 'bg-indigo-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div className="mt-2 text-[11px] text-zinc-500">
            {discsFiltradas.length} disciplina{discsFiltradas.length !== 1 ? 's' : ''}
            {search && ` para "${search}"`}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {discsFiltradas.length === 0 ? (
          <div className="text-center text-zinc-500 py-20">
            {search ? `Nenhuma disciplina encontrada para "${search}".` : 'Nenhuma disciplina encontrada.'}
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ sem, discs }) => {
              const collapsed = collapsedSemesters[sem]
              const semDirty = discs.filter(d => isDirtyCheck(d, drafts)).length

              return (
                <div key={sem}>
                  {/* Semester header */}
                  <button
                    onClick={() => toggleSemester(sem)}
                    className="flex items-center gap-2 w-full text-left mb-2 group"
                  >
                    {collapsed
                      ? <ChevronRight size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
                      : <ChevronDown size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
                    }
                    <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">
                      {sem > 0 ? `${sem}º Semestre` : 'Sem semestre'}
                    </span>
                    <span className="text-[11px] text-zinc-600">{discs.length} disciplina{discs.length !== 1 ? 's' : ''}</span>
                    {semDirty > 0 && (
                      <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                        {semDirty} alterada{semDirty > 1 ? 's' : ''}
                      </span>
                    )}
                  </button>

                  {!collapsed && (
                    <div className="space-y-2">
                      {/* Desktop header */}
                      <div className="hidden lg:grid grid-cols-[1fr_100px_72px_72px_72px_72px_72px_72px_44px] gap-2 px-4 py-1 text-[10px] text-zinc-500 uppercase tracking-wider">
                        <span>Disciplina</span>
                        <span className="text-center">Status</span>
                        <span className="text-center">GA</span>
                        <span className="text-center">GB</span>
                        <span className="text-center">Final</span>
                        <span className="text-center">Media</span>
                        <span className="text-center">Sem.</span>
                        <span className="text-center">Cred.</span>
                        <span />
                      </div>

                      {discs.map((disc, idx) => (
                        <DisciplinaRow
                          key={disc.id}
                          disc={disc}
                          draft={getDraft(disc)}
                          dirty={isDirtyCheck(disc, drafts)}
                          saveState={saving[disc.id]}
                          onDraft={(field, val) => setDraft(disc.id, field, val)}
                          onSave={() => salvar(disc)}
                          onKeyDown={(e, field) => handleKeyDown(e, disc.id, field, idx)}
                          calcMedia={calcMedia}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <p className="text-xs text-zinc-500 leading-relaxed">
            <strong className="text-zinc-400">Como usar:</strong> Edite as notas diretamente nos campos.
            Pressione <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400 text-[10px]">Enter</kbd> para salvar a linha,
            ou <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400 text-[10px]">Tab</kbd> para ir ao próximo campo.
            Use "Salvar Tudo" para salvar todas as alterações de uma vez.
            <br/>
            <strong className="text-zinc-400">Média</strong> = (GA + GB) / 2 · O status é atualizado automaticamente com base na nota mínima, ou pode ser alterado manualmente.
          </p>
        </div>
      </div>

      {/* ── Sync Modal ── */}
      {syncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <RefreshCw size={18} className="text-cyan-400" />
                <h2 className="text-base font-semibold">Sincronizar com Portal</h2>
              </div>
              <button onClick={() => setSyncModal(false)} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Login fields */}
              {!syncResults && (
                <>
                  <p className="text-xs text-zinc-400">
                    Busca as disciplinas no portal UNISINOS e compara com as que você já tem cadastradas.
                    Mostra o que mudou para você revisar antes de aplicar.
                  </p>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">RA (login do portal)</label>
                    <input
                      type="text"
                      value={syncRA}
                      onChange={e => setSyncRA(e.target.value)}
                      placeholder="Ex: 1234567"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Senha do portal</label>
                    <input
                      type="password"
                      value={syncSenha}
                      onChange={e => setSyncSenha(e.target.value)}
                      placeholder="Sua senha"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  {syncError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                      {syncError}
                    </div>
                  )}

                  {syncStatus && (
                    <div className="flex items-center gap-2 text-sm text-cyan-400">
                      <Loader2 size={14} className="animate-spin" />
                      {syncStatus}
                    </div>
                  )}

                  <button
                    onClick={sincronizar}
                    disabled={syncing || !syncRA.trim() || !syncSenha}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      syncing || !syncRA.trim() || !syncSenha
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        : 'bg-cyan-500 text-white hover:bg-cyan-400'
                    }`}
                  >
                    {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    {syncing ? 'Buscando...' : 'Buscar e Comparar'}
                  </button>
                </>
              )}

              {/* Results */}
              {syncResults && (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-lg font-bold text-emerald-400">{syncResults.semMudanca}</div>
                      <div className="text-[10px] text-zinc-400">Iguais</div>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="text-lg font-bold text-amber-400">{syncResults.alteradas.length}</div>
                      <div className="text-[10px] text-zinc-400">Com diferenças</div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="text-lg font-bold text-blue-400">{syncResults.novas.length}</div>
                      <div className="text-[10px] text-zinc-400">Novas no portal</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500">
                    {syncResults.totalPortal} disciplinas no portal · {disciplinas.length} cadastradas localmente
                  </p>

                  {/* Changed disciplines */}
                  {syncResults.alteradas.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-1.5">
                          <ArrowRightLeft size={14} /> Diferenças encontradas
                        </h3>
                        <button
                          onClick={() => { aplicarTodas(); setSyncModal(false) }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                        >
                          Aplicar todas
                        </button>
                      </div>
                      <div className="space-y-2">
                        {syncResults.alteradas.map(({ local, portal, mudancas }, i) => (
                          <div key={i} className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                            <p className="text-sm font-medium text-white truncate mb-2">{local.nome}</p>
                            {mudancas.map((m, j) => (
                              <div key={j} className="flex items-center justify-between text-xs mb-1 last:mb-0">
                                <span className="text-zinc-400 w-16">{m.campo}</span>
                                <div className="flex items-center gap-2 flex-1 justify-end">
                                  <span className="text-red-400/70 line-through">{m.de ?? '—'}</span>
                                  <span className="text-zinc-600">→</span>
                                  <span className="text-emerald-400 font-medium">{m.para ?? '—'}</span>
                                  <button
                                    onClick={() => { aplicarMudanca(local.id, m.campo, m.para); setSyncModal(false) }}
                                    className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors"
                                  >
                                    Aplicar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New disciplines */}
                  {syncResults.novas.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-1.5 mb-2">
                        <Plus size={14} /> Novas no portal (não cadastradas)
                      </h3>
                      <div className="space-y-1">
                        {syncResults.novas.map((d, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm">
                            <div className="min-w-0 flex-1">
                              <span className="text-white truncate block">{d.nome}</span>
                              <span className="text-[10px] text-zinc-500">{d.periodo ? `${d.periodo}º sem` : ''} · {d.status || 'Pendente'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2">
                        Para adicionar disciplinas novas, use a importação na tela principal.
                      </p>
                    </div>
                  )}

                  {syncResults.alteradas.length === 0 && syncResults.novas.length === 0 && (
                    <div className="text-center py-4 text-sm text-emerald-400">
                      <CheckCircle2 size={24} className="mx-auto mb-2" />
                      Tudo sincronizado! Nenhuma diferença encontrada.
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setSyncResults(null)}
                      className="flex-1 px-3 py-2 rounded-lg text-sm bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
                    >
                      Buscar novamente
                    </button>
                    <button
                      onClick={() => setSyncModal(false)}
                      className="flex-1 px-3 py-2 rounded-lg text-sm bg-cyan-500 text-white hover:bg-cyan-400 transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Discipline row (responsive) ── */
function DisciplinaRow({ disc, draft, dirty, saveState, onDraft, onSave, onKeyDown, calcMedia }) {
  const media = calcMedia(draft.ga, draft.gb)
  const mediaVal = media ? parseFloat(media) : null
  const minima = parseFloat(draft.notaMinima) || 6
  const aprovado = mediaVal !== null && mediaVal >= minima

  const SaveIcon = () => {
    if (saveState === 'saving') return <Loader2 size={16} className="animate-spin text-indigo-400" />
    if (saveState === 'ok') return <CheckCircle2 size={16} className="text-emerald-400" />
    if (saveState === 'err') return <XCircle size={16} className="text-red-400" />
    return (
      <button
        onClick={onSave}
        disabled={!dirty}
        title={dirty ? 'Salvar (Enter)' : 'Sem alterações'}
        className={`p-1.5 rounded-lg transition-colors ${
          dirty ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
        }`}
      >
        <Save size={14} />
      </button>
    )
  }

  return (
    <>
      {/* ── Desktop layout ── */}
      <div className={`hidden lg:grid grid-cols-[1fr_100px_72px_72px_72px_72px_72px_72px_44px] gap-2 items-center px-4 py-2.5 rounded-xl border transition-colors
        ${dirty ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{disc.nome}</p>
          <p className="text-[10px] text-zinc-500">Min: {draft.notaMinima || '6'}</p>
        </div>
        <div className="flex justify-center">
          <StatusSelect value={draft.status} onChange={v => onDraft('status', v)} />
        </div>
        <NotaInput value={draft.ga} onChange={v => onDraft('ga', v)} onKeyDown={e => onKeyDown(e, 'ga')} />
        <NotaInput value={draft.gb} onChange={v => onDraft('gb', v)} onKeyDown={e => onKeyDown(e, 'gb')} />
        <NotaInput value={draft.notaFinal} onChange={v => onDraft('notaFinal', v)} onKeyDown={e => onKeyDown(e, 'notaFinal')} placeholder="Auto" />
        <div className="text-center">
          {media
            ? <span className={`text-sm font-bold tabular-nums ${aprovado ? 'text-emerald-400' : 'text-red-400'}`}>{media}</span>
            : <span className="text-zinc-600 text-sm">—</span>}
        </div>
        <SmallInput value={draft.periodo} onChange={v => onDraft('periodo', v)} onKeyDown={e => onKeyDown(e, 'periodo')} placeholder="—" min="1" max="20" step="1" />
        <SmallInput value={draft.creditos} onChange={v => onDraft('creditos', v)} onKeyDown={e => onKeyDown(e, 'creditos')} placeholder="—" min="0" max="30" step="1" />
        <div className="flex items-center justify-center"><SaveIcon /></div>
      </div>

      {/* ── Mobile layout ── */}
      <div className={`lg:hidden px-4 py-3 rounded-xl border transition-colors
        ${dirty ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-zinc-900 border-zinc-800'}`}
      >
        {/* Name + status + save */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{disc.nome}</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusSelect value={draft.status} onChange={v => onDraft('status', v)} />
              {media && (
                <span className={`text-sm font-bold tabular-nums ${aprovado ? 'text-emerald-400' : 'text-red-400'}`}>
                  Média: {media}
                </span>
              )}
            </div>
          </div>
          <SaveIcon />
        </div>

        {/* Grade inputs */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase mb-1 block">GA</label>
            <NotaInput value={draft.ga} onChange={v => onDraft('ga', v)} onKeyDown={e => onKeyDown(e, 'ga')} />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase mb-1 block">GB</label>
            <NotaInput value={draft.gb} onChange={v => onDraft('gb', v)} onKeyDown={e => onKeyDown(e, 'gb')} />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Final</label>
            <NotaInput value={draft.notaFinal} onChange={v => onDraft('notaFinal', v)} onKeyDown={e => onKeyDown(e, 'notaFinal')} placeholder="Auto" />
          </div>
        </div>

        {/* Extra fields */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Semestre</label>
            <SmallInput value={draft.periodo} onChange={v => onDraft('periodo', v)} placeholder="—" min="1" max="20" step="1" />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Créditos</label>
            <SmallInput value={draft.creditos} onChange={v => onDraft('creditos', v)} placeholder="—" min="0" max="30" step="1" />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Nota Min.</label>
            <SmallInput value={draft.notaMinima} onChange={v => onDraft('notaMinima', v)} placeholder="6" min="0" max="10" step="0.5" />
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Pure dirty check ── */
function isDirtyCheck(disc, drafts) {
  const d = drafts[disc.id]
  if (!d) return false
  return (
    (d.ga        !== undefined && d.ga        !== String(disc.ga        ?? '')) ||
    (d.gb        !== undefined && d.gb        !== String(disc.gb        ?? '')) ||
    (d.notaFinal !== undefined && d.notaFinal !== String(disc.notaFinal ?? '')) ||
    (d.status    !== undefined && d.status    !== normalizeStatus(disc.status)) ||
    (d.periodo   !== undefined && d.periodo   !== String(disc.periodo   ?? '')) ||
    (d.creditos  !== undefined && d.creditos  !== String(disc.creditos  ?? '')) ||
    (d.notaMinima !== undefined && d.notaMinima !== String(disc.notaMinima ?? '6'))
  )
}
