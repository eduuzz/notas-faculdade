import React, { useState } from 'react';
import { Settings, Save, Download, Upload as UploadIcon, Trash2, AlertCircle, Database, RefreshCw, Bell, Palette } from 'lucide-react';
import { useTheme, ACCENT_PRESETS } from '../../ThemeContext';
import { getNotificationSettings, setNotificationSettings, requestNotificationPermission } from '../../utils/notifications';

export default function SettingsModal({
  user, userName, userCurso,
  settingsNome, setSettingsNome,
  settingsCurso, setSettingsCurso,
  savingSettings, onSave, onClose,
  disciplinas, setDisciplinas, setConfirmState,
  abrirModalReset, toast,
}) {
  const { accentColor, setAccentColor } = useTheme();
  const [notifSettings, setNotifSettings] = useState(() => getNotificationSettings());

  const handleToggleReminders = async () => {
    const newEnabled = !notifSettings.enabled;
    if (newEnabled) {
      const perm = await requestNotificationPermission();
      if (perm === 'denied') {
        toast.error('Permissao de notificacoes negada no navegador.');
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
        toast.error('Arquivo muito grande. Maximo: 5MB.');
        return;
      }
      try {
        const texto = await file.text();
        const dados = JSON.parse(texto);
        if (dados.disciplinas && Array.isArray(dados.disciplinas)) {
          setConfirmState({
            title: 'Importar Backup',
            message: `Importar ${dados.disciplinas.length} disciplinas? Isso substituira os dados atuais.`,
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
          toast.error('Arquivo invalido. O formato esperado e um backup JSON deste app.');
        }
      } catch (err) {
        toast.error('Erro ao ler o arquivo. Verifique se e um JSON valido.');
      }
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--bg-modal)] border border-[var(--border-input)] rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
            <Settings size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Configuracoes</h2>
            <p className="text-[var(--text-secondary)] text-sm">Edite suas informacoes</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-[var(--text-secondary)] block mb-2">Email</label>
            <div className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-muted)]">
              {user?.email}
            </div>
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)] block mb-2">Nome</label>
            <input type="text" value={settingsNome} onChange={(e) => setSettingsNome(e.target.value.slice(0, 80))} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none focus:border-violet-500 transition-colors" placeholder="Seu nome" maxLength={80} />
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)] block mb-2">Curso</label>
            <input type="text" value={settingsCurso} onChange={(e) => setSettingsCurso(e.target.value.slice(0, 100))} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none focus:border-violet-500 transition-colors" placeholder="Ex: Ciencia da Computacao" maxLength={100} />
          </div>
        </div>

        {/* Cor do Tema */}
        <div className="mb-6 p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)]">
          <div className="flex items-center gap-3 mb-3">
            <Palette size={20} style={{ color: 'var(--accent-400)' }} />
            <h4 className="font-medium text-[var(--text-primary)]">Cor do Tema</h4>
          </div>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(ACCENT_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setAccentColor(key)}
                className="w-10 h-10 rounded-xl transition-all hover:scale-105"
                style={{
                  background: preset[500],
                  boxShadow: accentColor === key ? `0 0 0 2px var(--bg-modal), 0 0 0 4px ${preset[500]}` : 'none',
                  transform: accentColor === key ? 'scale(1.1)' : undefined,
                }}
                title={preset.name}
              />
            ))}
          </div>
        </div>

        {/* Lembretes */}
        <div className="mb-6 p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)]">
          <div className="flex items-center gap-3 mb-3">
            <Bell size={20} style={{ color: 'var(--accent-400)' }} />
            <h4 className="font-medium text-[var(--text-primary)]">Lembretes</h4>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[var(--text-secondary)]">Ativar lembretes</span>
            <button
              onClick={handleToggleReminders}
              className={`w-11 h-6 rounded-full transition-all relative ${notifSettings.enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${notifSettings.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {notifSettings.enabled && (
            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-2">Lembrar a cada</label>
              <select
                value={notifSettings.intervalDays}
                onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-modal)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none cursor-pointer"
              >
                <option value="3">3 dias</option>
                <option value="7">7 dias</option>
                <option value="14">14 dias</option>
                <option value="30">30 dias</option>
              </select>
            </div>
          )}
        </div>

        <div className="mb-6 p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)]">
          <div className="flex items-center gap-3 mb-3">
            <Database size={20} className="text-amber-400" />
            <h4 className="font-medium text-[var(--text-primary)]">Backup de Dados</h4>
          </div>
          <p className="text-[var(--text-secondary)] text-sm mb-3">
            Exporte seus dados para backup ou importe de outro dispositivo.
          </p>
          <div className="flex gap-2">
            <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">
              <Download size={16} />Exportar
            </button>
            <button onClick={handleImport} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
              <UploadIcon size={16} />Importar
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle size={20} className="text-red-400" />
            <h4 className="font-medium text-red-400">Zona de Perigo</h4>
          </div>
          <p className="text-[var(--text-secondary)] text-sm mb-3">Acoes irreversiveis. Tenha cuidado!</p>
          <button
            onClick={() => { onClose(); abrirModalReset(); }}
            disabled={disciplinas.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />Excluir Todas as Cadeiras ({disciplinas.length})
          </button>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-hover)] transition-colors">
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={savingSettings}
            className="flex-1 py-3 rounded-xl text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(to right, var(--accent-600), var(--accent-500))' }}
          >
            {savingSettings ? <RefreshCw size={18} className="animate-spin" /> : <><Save size={18} />Salvar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
