import React from 'react';
import { Settings, Save, Download, Upload as UploadIcon, Trash2, AlertCircle, Database, RefreshCw } from 'lucide-react';

export default function SettingsModal({
  user, userName, userCurso,
  settingsNome, setSettingsNome,
  settingsCurso, setSettingsCurso,
  savingSettings, onSave, onClose,
  disciplinas, setDisciplinas, setConfirmState,
  abrirModalReset, toast,
}) {
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
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--bg-modal)] border border-[var(--border-input)] rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
            <Settings size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Configurações</h2>
            <p className="text-[var(--text-secondary)] text-sm">Edite suas informações</p>
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
            <input type="text" value={settingsCurso} onChange={(e) => setSettingsCurso(e.target.value.slice(0, 100))} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none focus:border-violet-500 transition-colors" placeholder="Ex: Ciência da Computação" maxLength={100} />
          </div>
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
          <p className="text-[var(--text-secondary)] text-sm mb-3">Ações irreversíveis. Tenha cuidado!</p>
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
          <button onClick={onSave} disabled={savingSettings} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {savingSettings ? <RefreshCw size={18} className="animate-spin" /> : <><Save size={18} />Salvar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
