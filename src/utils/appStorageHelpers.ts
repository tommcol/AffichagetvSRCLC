import type { ActiveMatchAlert, AppDataPayload, BirthdayItem, FFBBTeamItem } from '../types';

const getStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof localStorage !== 'undefined') return localStorage;
  return null;
};

const readJson = <T>(key: string): T | null => {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown): void => {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage may be unavailable or full; callers already have server persistence.
  }
};

export const getOfflineAppData = (): AppDataPayload | null =>
  readJson<AppDataPayload>('src_app_data_offline_cache');

export const setOfflineAppData = (data: AppDataPayload): void => {
  writeJson('src_app_data_offline_cache', data);
};

export const getMemberPoolCache = (): BirthdayItem[] | null => {
  const pool = readJson<BirthdayItem[]>('club_all_members_pool');
  return Array.isArray(pool) && pool.length > 0 ? pool : null;
};

export const setMemberPoolCache = (members: BirthdayItem[]): void => {
  writeJson('club_all_members_pool', members);
};

export const getFfbbTeamsCache = (): FFBBTeamItem[] | null => {
  const teams = readJson<FFBBTeamItem[]>('ffbb_club_teams_cache');
  return Array.isArray(teams) && teams.length > 0 && Boolean(teams[0]?.name) ? teams : null;
};

export const setFfbbTeamsCache = (teams: FFBBTeamItem[]): void => {
  writeJson('ffbb_club_teams_cache', teams);
};

export const getActiveAlertsCache = (): ActiveMatchAlert[] => {
  const alerts = readJson<ActiveMatchAlert[]>('src_active_alerts_cache');
  if (!Array.isArray(alerts)) return [];

  const now = Date.now();
  return alerts.filter((alert) => alert && alert.expiresAt > now);
};

export const setActiveAlertsCache = (alerts: ActiveMatchAlert[]): void => {
  writeJson('src_active_alerts_cache', alerts);
};
