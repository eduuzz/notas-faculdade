import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import { getFreshToken } from './useNotas'
import {
  CheckCircle2, XCircle, Loader2, BookOpen, ArrowLeft, Save,
  Search, ChevronDown, ChevronRight, SaveAll, AlertTriangle
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
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Voltar</span>
            </button>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BookOpen size={20} className="text-indigo-400 flex-shrink-0" />
              <h1 className="text-lg font-semibold truncate">Lançador de Notas</h1>
            </div>

            {/* Dirty count + save all */}
            <div className="flex items-center gap-2">
              {dirtyCount > 0 && (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertTriangle size={13} />
                  <span className="hidden sm:inline">{dirtyCount} não salva{dirtyCount > 1 ? 's' : ''}</span>
                  <span className="sm:hidden">{dirtyCount}</span>
                </span>
              )}
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
