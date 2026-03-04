const STORAGE_KEYS = {
  enabled: 'reminders_enabled',
  interval: 'reminders_interval_days',
  lastCheck: 'reminders_last_check',
  lastNotesUpdate: 'reminders_last_notes_update',
};

export function getNotificationSettings() {
  return {
    enabled: localStorage.getItem(STORAGE_KEYS.enabled) !== 'false',
    intervalDays: parseInt(localStorage.getItem(STORAGE_KEYS.interval) || '7', 10),
  };
}

export function setNotificationSettings({ enabled, intervalDays }) {
  localStorage.setItem(STORAGE_KEYS.enabled, String(enabled));
  if (intervalDays) localStorage.setItem(STORAGE_KEYS.interval, String(intervalDays));
}

export function markNotesUpdated() {
  localStorage.setItem(STORAGE_KEYS.lastNotesUpdate, new Date().toISOString());
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
}

function showNotification(title, body) {
  if (Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  });
}

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
}

function isNearSemesterEnd() {
  const month = new Date().getMonth(); // 0-indexed
  // Jun (5) ou Dez (11) = últimas semanas do semestre
  return month === 5 || month === 11;
}

export function checkReminders(disciplinas, toast) {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  const lastCheck = localStorage.getItem(STORAGE_KEYS.lastCheck);
  if (lastCheck && daysSince(lastCheck) < 1) return; // máximo 1 check por dia
  localStorage.setItem(STORAGE_KEYS.lastCheck, new Date().toISOString());

  const lastUpdate = localStorage.getItem(STORAGE_KEYS.lastNotesUpdate);
  const daysSinceUpdate = daysSince(lastUpdate);

  // Lembrete de atualizar notas
  if (daysSinceUpdate >= settings.intervalDays) {
    const emCurso = disciplinas.filter(d => d.status === 'EM_CURSO').length;
    if (emCurso > 0) {
      const msg = `Voce tem ${emCurso} cadeira${emCurso > 1 ? 's' : ''} em curso. Verifique se ha notas novas!`;
      if (toast) toast.info(msg);
      showNotification('Atualizar Notas', msg);
    }
  }

  // Alerta de fim de semestre
  if (isNearSemesterEnd()) {
    const pendentes = disciplinas.filter(d => d.status === 'EM_CURSO' && d.notaFinal === null).length;
    if (pendentes > 0) {
      const msg = `Fim do semestre se aproxima! ${pendentes} cadeira${pendentes > 1 ? 's' : ''} ainda sem nota final.`;
      if (toast) toast.warning(msg);
      showNotification('Fim do Semestre', msg);
    }
  }
}
