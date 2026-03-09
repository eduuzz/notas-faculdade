import React, { useState, useEffect } from 'react';
import { Settings, Save, Download, Upload as UploadIcon, Trash2, AlertCircle, Database, RefreshCw, Bell, Palette, X, Clock } from 'lucide-react';
import { useTheme, ACCENT_PRESETS } from '../../ThemeContext';
import { getNotificationSettings, setNotificationSettings, requestNotificationPermission } from '../../utils/notifications';

export default function SettingsModal({
  user, userName, userCurso,
  settingsNome, setSettingsNome,
  settingsCurso, setSettingsCurso,
  savingSettings, onSave, onClose,
  disciplinas, setDisciplinas, setConfirmState,
  abrirModalReset, toast,
  horarios, onClearHorarios,
}) {
  const { accentColor, setAccentColor } = useTheme();
  const [notifSettings, setNotifSettings] = useState(() => getNotificationSettings());

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleToggleReminders = async () => {
    const newEnabled = !notifSettings.enabled;
    if (newEnabled) {
      const perm = await requestNotificationPermission();
      if (perm === 'denied') {
        toast.error('Permissão de notificações negada no navegador.');
        return;
      }
    }
    const updated = { ...notifSettings, enabled: newEnabled };
    setNotifSettings(updated);
    setNotificationSettings(updated);
  };

  const handleIntervalChange = (days) => {
    const updated = { ...notifSettings, intervalDays: days };
    setNotifSettings(updated);
    setNotificationSettings(updated);
  };

  const handleExport = () => {
    const dados = {
      versao: '1.0',
      exportadoEm: new Date().toISOString(),
      usuario: { nome: userName, email: user?.email, curso: userCurso },
      disciplinas: disciplinas
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-notas-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo: 5MB.');
        return;
      }
      try {
        const texto = await file.text();
        const dados = JSON.parse(texto);
        if (dados.disciplinas && Array.isArray(dados.disciplinas)) {
          setConfirmState({
            title: 'Importar Backup',
            message: `Importar ${dados.disciplinas.length} disciplinas? Isso substituirá os dados atuais.`,
            confirmLabel: 'Importar',
            variant: 'danger',
            onConfirm: () => {
              setDisciplinas(dados.disciplinas);
              toast.success('Dados importados com sucesso!');
              setConfirmState(null);
            },
            onCancel: () => setConfirmState(null)
          });
        } else {
          toast.error('Arquivo inválido. O formato esperado é um backup JSON deste app.');
        }
      } catch (err) {
        toast.error('Erro ao ler o arquivo. Verifique se é um JSON válido.');
      }
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--bg-modal)] border border-[var(--border-input)] rounded-t-xl sm:rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">

        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--text-muted)]/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 sm:py-3 border-b border-[var(--border-input)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-bg10)' }}>
              <Settings size={16} style={{ color: 'var(--accent-400)' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Configurações</h2>
              <p className="text-[var(--text-muted)] text-[11px]">Personalize sua experiência</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4">
          {/* Perfil + Tema lado a lado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">

            {/* Perfil */}
            <div className="p-3 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)]">
              <h4 className="font-medium text-[var(--text-primary)] text-sm mb-2">Perfil</h4>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-0.5">Email</label>
                  <div className="w-full px-2.5 py-1.5 rounded-md bg-[var(--bg-modal)] border border-[var(--border-input)] text-[var(--text-muted)] text-xs truncate">
                    {user?.email}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-0.5">Nome</label>
                  <input type="text" value={settingsNome} onChange={(e) => setSettingsNome(e.target.value.slice(0, 80))} className="w-full px-2.5 py-1.5 rounded-md bg-[var(--bg-modal)] border border-[var(--border-input)] text-[var(--text-primary)] text-xs focus:outline-none transition-colors" style={{ borderColor: undefined }} onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'} onBlur={(e) => e.target.style.borderColor = ''} placeholder="Seu nome" maxLength={80} />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-0.5">Curso</label>
                  <input type="text" value={settingsCurso} onChange={(e) => setSettingsCurso(e.target.value.slice(0, 100))} className="w-full px-2.5 py-1.5 rounded-md bg-[var(--bg-modal)] border border-[var(--border-input)] text-[var(--text-primary)] text-xs focus:outline-none transition-colors" onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'} onBlur={(e) => e.target.style.borderColor = ''} placeholder="Ex: Ciência da Computação" maxLength={100} />
                </div>
              </div>
            </div>

            {/* Tema + Lembretes */}
            <div className="space-y-3">
              {/* Cor do Tema */}
              <div className="p-3 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)]">
                <div className="flex items-center gap-2 mb-2">
                  <Palette size={14} style={{ color: 'var(--accent-400)' }} />
                  <h4 className="font-medium text-[var(--text-primary)] text-sm">Cor do Tema</h4>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(ACCENT_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => setAccentColor(key)}
                      className="w-8 h-8 rounded-lg transition-all hover:scale-105"
                      style={{
                        background: preset[500],
                        boxShadow: accentColor === key ? `0 0 0 2px var(--bg-modal), 0 0 0 3px ${preset[500]}` : 'none',
                        transform: accentColor === key ? 'scale(1.1)' : undefined,
                      }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              {/* Lembretes */}
              <div className="p-3 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={14} style={{ color: 'var(--accent-400)' }} />
                    <h4 className="font-medium text-[var(--text-primary)] text-sm">Lembretes</h4>
                  </div>
                  <button
                    onClick={handleToggleReminders}
                    className="rounded-full transition-all relative"
                    style={{ background: notifSettings.enabled ? 'var(--accent-500)' : '#475569', width: '36px', height: '20px' }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform" style={{ transform: notifSettings.enabled ? 'translateX(18px)' : 'translateX(3px)' }} />
                  </button>
                </div>
                {notifSettings.enabled && (
                  <div className="mt-2">
                    <select
                      value={notifSettings.intervalDays}
                      onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
                      className="w-full px-2.5 py-1 rounded-md bg-[var(--bg-modal)] border border-[var(--border-input)] text-[var(--text-primary)] text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="3">A cada 3 dias</option>
                      <option value="7">A cada 7 dias</option>
                      <option value="14">A cada 14 dias</option>
                      <option value="30">A cada 30 dias</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Backup + Zona de Perigo lado a lado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* Backup */}
            <div className="p-3 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)]">
              <div className="flex items-center gap-2 mb-2">
                <Database size={14} className="text-amber-400" />
                <h4 className="font-medium text-[var(--text-primary)] text-sm">Backup de Dados</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">
                  <Download size={13} />Exportar
                </button>
                <button onClick={handleImport} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all bg-[var(--bg-modal)] border border-[var(--border-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
                  <UploadIcon size={13} />Importar
                </button>
              </div>
            </div>

            {/* Zona de Perigo */}
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={14} className="text-red-400" />
                <h4 className="font-medium text-red-400 text-sm">Zona de Perigo</h4>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { onClose(); abrirModalReset(); }}
                  disabled={disciplinas.length === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={13} />Cadeiras ({disciplinas.length})
                </button>
                <button
                  onClick={() => { onClearHorarios(); toast.success('Horários excluídos.'); }}
                  disabled={!horarios || horarios.length === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Clock size={13} />Horários ({horarios?.length || 0})
                </button>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex gap-2.5 justify-end">
            <button onClick={onClose} className="px-5 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors">
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={savingSettings}
              className="px-5 py-2 rounded-md bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingSettings ? <RefreshCw size={14} className="animate-spin" /> : <><Save size={14} />Salvar</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
