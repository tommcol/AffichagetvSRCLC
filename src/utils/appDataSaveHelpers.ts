import { AppDataPayload } from '../types';

export interface SaveAppDataResult {
  ok: boolean;
  version?: number;
  errorMessage?: string;
  isConflict?: boolean;
}

export const saveAppDataRequest = async (
  payload: { version: number; data: AppDataPayload }
): Promise<SaveAppDataResult> => {
  try {
    const res = await fetch('/api/save-app-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseJson = await res.json().catch(() => null);

    if (res.ok) {
      return {
        ok: true,
        version: typeof responseJson?.version === 'number' ? responseJson.version : undefined,
      };
    }

    const isConflict =
      res.status === 409 || responseJson?.code === 'CONCURRENCY_CONFLICT';

    return {
      ok: false,
      isConflict,
      errorMessage: isConflict
        ? 'Les données ont été modifiées ailleurs. Rechargez les données avant de sauvegarder à nouveau.'
        : (responseJson?.error || (res.status === 401 ? 'Mot de passe invalide' : `Erreur serveur (${res.status})`)),
    };
  } catch (error) {
    return {
      ok: false,
      errorMessage: 'Connexion réseau interrompue',
    };
  }
};
