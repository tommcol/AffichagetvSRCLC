import { ActiveMatchAlert } from '../types';

export const filterActiveAlerts = (
  alerts: unknown,
  now = Date.now()
): ActiveMatchAlert[] => {
  if (!Array.isArray(alerts)) return [];

  return alerts.filter(
    (alert): alert is ActiveMatchAlert =>
      !!alert &&
      typeof alert === 'object' &&
      typeof (alert as ActiveMatchAlert).id === 'string' &&
      typeof (alert as ActiveMatchAlert).expiresAt === 'number' &&
      (alert as ActiveMatchAlert).expiresAt > now
  );
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
