import { ActiveMatchAlert } from '../types';

const getAlertDeduplicationKey = (alert: ActiveMatchAlert): string => {
  if ((alert.triggeredBy === 'ffbb' || alert.triggeredBy === 'telegram') && alert.matchId) {
    return `match:${alert.matchId}`;
  }

  if (alert.triggeredBy === 'ffbb' || alert.triggeredBy === 'telegram') {
    return [
      alert.team || '',
      alert.opponent || '',
      alert.isWin ? 'win' : 'loss',
      alert.ourScore ?? '',
      alert.opponentScore ?? '',
    ]
      .join('|')
      .toLowerCase();
  }

  return `id:${alert.id}`;
};

export const filterActiveAlerts = (
  alerts: unknown,
  now = Date.now()
): ActiveMatchAlert[] => {
  if (!Array.isArray(alerts)) return [];

  const seen = new Set<string>();
  const valid: ActiveMatchAlert[] = [];

  for (const item of alerts) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof (item as ActiveMatchAlert).id !== 'string' ||
      typeof (item as ActiveMatchAlert).expiresAt !== 'number' ||
      (item as ActiveMatchAlert).expiresAt <= now
    ) {
      continue;
    }

    const alert = item as ActiveMatchAlert;
    const key = getAlertDeduplicationKey(alert);
    if (seen.has(key)) continue;

    seen.add(key);
    valid.push(alert);
  }

  return valid;
};

export const mergeActiveAlert = (
  alerts: ActiveMatchAlert[],
  alert: ActiveMatchAlert
): ActiveMatchAlert[] => [
  alert,
  ...alerts.filter((item) => item.id !== alert.id),
];

export const removeActiveAlert = (
  alerts: ActiveMatchAlert[],
  id: string
): ActiveMatchAlert[] => alerts.filter((alert) => alert.id !== id);

export const hasSameActiveAlerts = (
  previous: ActiveMatchAlert[],
  next: ActiveMatchAlert[]
): boolean =>
  previous.length === next.length &&
  previous.every((alert, index) => alert.id === next[index]?.id);

export const addAlertRequest = async (alert: ActiveMatchAlert): Promise<boolean> => {
  try {
    const response = await fetch('/api/add-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const removeAlertRequest = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `/api/delete-alert?id=${encodeURIComponent(id)}`,
      { method: 'POST' }
    );
    return response.ok;
  } catch {
    return false;
  }
};
