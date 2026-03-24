import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import { getFreshToken } from './useNotas'
import { CheckCircle2, XCircle, Loader2, BookOpen, ArrowLeft, Save } from 'lucide-react'

function StatusBadge({ status }) {
  const map = {
    aprovado:   { label: 'Aprovado',   cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    reprovado:  { label: 'Reprovado',  cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
    cursando:   { label: 'Cursando',   cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    pendente:   { label: 'Pendente',   cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
    dispensado: { label: 'Dispensado', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  }
  const s = map[status] || map.pendente
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  )
}

function NotaInput({ value, onChange, placeholder = '—', disabled }) {
  return (
    <input
      type="number"
      step="0.1"
      min="0"
      max="10"
      disabled={disabled}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-20 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm text-center tabular-nums
                 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40
                 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    />
  )
}

export default function LancadorNotas() {
  const { user, loading: authLoading } = useAuth()
  const [disciplinas, setDisciplinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})   // { [id]: 'saving' | 'ok' | 'err' }
  const [drafts, setDrafts] = useState({})   // { [id]: { ga, gb, notaFinal } }
  const [filter, setFilter] = useState('all')

  // Carrega disciplinas
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
        console.log('[LancadorNotas] disciplinas:', data?.length, 'erro:', error)
        if (error) console.error('[LancadorNotas] erro Supabase:', error)
        if (data) setDisciplinas(data)
        setLoading(false)
      })
  }, [user?.id])

  // Draft helpers
  const getDraft = (disc) => {
    const d = drafts[disc.id]
    return {
      ga:        d?.ga        ?? (disc.ga        !== null && disc.ga        !== undefined ? String(disc.ga)        : ''),
      gb:        d?.gb        ?? (disc.gb        !== null && disc.gb        !== undefined ? String(disc.gb)        : ''),
      notaFinal: d?.notaFinal ?? (disc.notaFinal !== null && disc.notaFinal !== undefined ? String(disc.notaFinal) : ''),
    }
  }

  const setDraft = (id, field, value) => {
    setDrafts(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }))
  }

  const isDirty = (disc) => {
    const d = drafts[disc.id]
    if (!d) return false
    return (
      (d.ga        !== undefined && d.ga        !== String(disc.ga        ?? '')) ||
      (d.gb        !== undefined && d.gb        !== String(disc.gb        ?? '')) ||
      (d.notaFinal !== undefined && d.notaFinal !== String(disc.notaFinal ?? ''))
    )
  }

  const calcMedia = (ga, gb) => {
    const a = parseFloat(ga)
    const b = parseFloat(gb)
    if (!isNaN(a) && !isNaN(b)) return ((a + b) / 2).toFixed(1)
    return null
  }

  // Salva via fetch direto (mesmo workaround do useNotas)
  const salvar = useCallback(async (disc) => {
    const d = getDraft(disc)
    const ga        = d.ga        !== '' ? parseFloat(d.ga)        : null
    const gb        = d.gb        !== '' ? parseFloat(d.gb)        : null
    const notaFinal = d.notaFinal !== '' ? parseFloat(d.notaFinal) : null

    const updates = {
      ga, gb, notaFinal,
      updated_at: new Date().toISOString(),
    }

    // Calcula status
    const media = notaFinal ?? (ga !== null && gb !== null ? (ga + gb) / 2 : null)
    if (media !== null) {
      const minima = disc.notaMinima ?? 6
      updates.status = media >= minima ? 'aprovado' : 'reprovado'
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
      // Atualiza local
      setDisciplinas(prev => prev.map(d => d.id === disc.id ? { ...d, ...updated } : d))
      setDrafts(prev => { const n = { ...prev }; delete n[disc.id]; return n })
      setSaving(prev => ({ ...prev, [disc.id]: 'ok' }))
      setTimeout(() => setSaving(prev => ({ ...prev, [disc.id]: undefined })), 2000)
    } catch (e) {
      console.error(e)
      setSaving(prev => ({ ...prev, [disc.id]: 'err' }))
      setTimeout(() => setSaving(prev => ({ ...prev, [disc.id]: undefined })), 3000)
    }
  }, [drafts, user])

  // Filtros
  const filtros = [
    { key: 'all',      label: 'Todas' },
    { key: 'cursando', label: 'Em Curso' },
    { key: 'aprovado', label: 'Aprovadas' },
    { key: 'reprovado',label: 'Reprovadas' },
    { key: 'pendente', label: 'Pendentes' },
  ]

  const discsFiltradas = disciplinas.filter(d =>
    filter === 'all' ? true : d.status === filter
  )

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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
          <div className="flex items-center gap-2 flex-1">
            <BookOpen size={20} className="text-indigo-400" />
            <h1 className="text-lg font-semibold">Lançador de Notas</h1>
            <span className="text-xs text-zinc-500 ml-1">{discsFiltradas.length} disciplinas</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="max-w-4xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
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

      {/* Tabela */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {discsFiltradas.length === 0 ? (
          <div className="text-center text-zinc-500 py-20">Nenhuma disciplina encontrada.</div>
        ) : (
          <div className="space-y-2">
            {/* Header da tabela */}
            <div className="grid grid-cols-[1fr_auto_80px_80px_80px_80px_44px] gap-3 px-4 py-2 text-[11px] text-zinc-500 uppercase tracking-wider">
              <span>Disciplina</span>
              <span>Status</span>
              <span className="text-center">GA</span>
              <span className="text-center">GB</span>
              <span className="text-center">Final</span>
              <span className="text-center">Média</span>
              <span />
            </div>

            {discsFiltradas.map(disc => {
              const draft = getDraft(disc)
              const dirty = isDirty(disc)
              const saveState = saving[disc.id]
              const media = calcMedia(draft.ga || disc.ga, draft.gb || disc.gb)
              const mediaVal = media ? parseFloat(media) : null
              const minima = disc.notaMinima ?? 6
              const aprovado = mediaVal !== null && mediaVal >= minima

              return (
                <div
                  key={disc.id}
                  className={`grid grid-cols-[1fr_auto_80px_80px_80px_80px_44px] gap-3 items-center px-4 py-3 rounded-xl border transition-colors
                    ${dirty
                      ? 'bg-indigo-500/5 border-indigo-500/30'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                >
                  {/* Nome */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{disc.nome}</p>
                    <p className="text-[11px] text-zinc-500">{disc.periodo}º sem · {disc.creditos} créd.</p>
                  </div>

                  {/* Status */}
                  <StatusBadge status={disc.status} />

                  {/* GA */}
                  <NotaInput
                    value={draft.ga}
                    onChange={v => setDraft(disc.id, 'ga', v)}
                  />

                  {/* GB */}
                  <NotaInput
                    value={draft.gb}
                    onChange={v => setDraft(disc.id, 'gb', v)}
                  />

                  {/* Nota Final */}
                  <NotaInput
                    value={draft.notaFinal}
                    onChange={v => setDraft(disc.id, 'notaFinal', v)}
                    placeholder="Auto"
                  />

                  {/* Média calculada */}
                  <div className="text-center">
                    {media ? (
                      <span className={`text-sm font-bold tabular-nums ${aprovado ? 'text-emerald-400' : 'text-red-400'}`}>
                        {media}
                      </span>
                    ) : (
                      <span className="text-zinc-600 text-sm">—</span>
                    )}
                  </div>

                  {/* Botão salvar */}
                  <div className="flex items-center justify-center">
                    {saveState === 'saving' && (
                      <Loader2 size={18} className="animate-spin text-indigo-400" />
                    )}
                    {saveState === 'ok' && (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    )}
                    {saveState === 'err' && (
                      <XCircle size={18} className="text-red-400" />
                    )}
                    {!saveState && (
                      <button
                        onClick={() => salvar(disc)}
                        disabled={!dirty}
                        title={dirty ? 'Salvar notas' : 'Sem alterações'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          dirty
                            ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}
                      >
                        <Save size={15} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Legenda */}
        <p className="text-xs text-zinc-600 text-center mt-8">
          Média = (GA + GB) / 2 · Mínimo para aprovação: 6.0 · Alterações são salvas individualmente por disciplina.
        </p>
      </div>
    </div>
  )
}
