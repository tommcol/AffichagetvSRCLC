import { useState, useEffect, useMemo } from 'react';
import { ActiveMatchAlert, TeamVisualItem, VisualTemplatesConfig } from '../../../types';
import { getEffectiveTitleConfig } from '../../slides/MatchAlertSlide';

// Tout ce qui concerne l'onglet Telegram de l'administration :
// statut du bot, connexion / déconnexion, simulateur de message.
// Code déplacé tel quel depuis AdminPanel.tsx, sans changement de comportement.
interface UseTelegramAdminParams {
  activeTab: string;
  teamVisuals: TeamVisualItem[];
  visualTemplates: VisualTemplatesConfig;
  onAddAlert: (alert: ActiveMatchAlert) => void;
}

export function useTelegramAdmin({ activeTab, teamVisuals, visualTemplates, onAddAlert }: UseTelegramAdminParams) {
  // Telegram Bot State
  const [telegramStatus, setTelegramStatus] = useState<{
    hasSecretToken: boolean;
    connected: boolean;
    webhookUrl?: string | null;
    botUsername?: string | null;
    botName?: string | null;
    lastError?: string | null;
    pendingUpdateCount?: number;
    message?: string;
    lastMessage?: {
      receivedAt: number;
      text: string | null;
      team?: string;
      isWin?: boolean;
      score?: string;
      success: boolean;
      error?: string;
    } | null;
  } | null>(null);
  const [telegramStatusLoading, setTelegramStatusLoading] = useState<boolean>(false);
  const [telegramConnecting, setTelegramConnecting] = useState<boolean>(false);
  const [telegramDisconnecting, setTelegramDisconnecting] = useState<boolean>(false);
  const [telegramActionMsg, setTelegramActionMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [adminPasswordPrompt, setAdminPasswordPrompt] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [savedAdminPassword, setSavedAdminPassword] = useState<string>(() => {
    try {
      return sessionStorage.getItem('club_admin_password') || '';
    } catch (e) {
      return '';
    }
  });

  // Dernier message réel reçu depuis le webhook Telegram
  const effectiveLastTelegramMessage = useMemo(() => {
    return telegramStatus?.lastMessage || null;
  }, [telegramStatus?.lastMessage]);

  const formatTelegramDate = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return '';
    }
  };

  // Telegram Simulator State
  const [telegramSimText, setTelegramSimText] = useState<string>('Victoire Seniors 1 82-74');
  const [telegramSimResponse, setTelegramSimResponse] = useState<string | null>(null);
  const [telegramSimFeedback, setTelegramSimFeedback] = useState<{
    success: boolean;
    message: string;
    suggestions?: string[];
    isAmbiguous?: boolean;
  } | null>(null);
  const [telegramSimLoading, setTelegramSimLoading] = useState<boolean>(false);

  // Simulate Telegram Message
  const handleTestTelegramMessage = async () => {
    if (!telegramSimText.trim()) return;
    setTelegramSimLoading(true);
    setTelegramSimResponse(null);
    setTelegramSimFeedback(null);

    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageText: telegramSimText }),
      });
      const data = await res.json();
      if (data.success && data.alert) {
        // Look up matching visual in team visuals
        const teamMatch = teamVisuals.find((tv) =>
          tv.teamName.toLowerCase().includes(data.alert.team.toLowerCase()) ||
          tv.shortAliases.some((alias) => data.alert.team.toLowerCase().includes(alias.toLowerCase()))
        );

        const commonBank = data.alert.isWin ? visualTemplates.commonVictoryVisuals : visualTemplates.commonDefeatVisuals;
        if (commonBank && commonBank.length > 0) {
          const randomIndex = Math.floor(Math.random() * commonBank.length);
          data.alert.customImageUrl = commonBank[randomIndex];
        } else if (teamMatch) {
          data.alert.customImageUrl = data.alert.isWin ? teamMatch.winVisualUrl : teamMatch.lossVisualUrl;
        }

        if (data.alert.customImageUrl) {
          data.alert.titleConfig = getEffectiveTitleConfig(
            data.alert.customImageUrl,
            data.alert.isWin,
            visualTemplates
          );
        }

        onAddAlert(data.alert);
        const confirmMsg = data.confirmationMessage || `Visuel ${data.alert.isWin ? 'VICTOIRE' : 'DÉFAITE'} pour ${data.alert.team} injecté dans la boucle TV pendant 1 heure !`;
        setTelegramSimResponse(confirmMsg);
        setTelegramSimFeedback({
          success: true,
          message: confirmMsg,
        });
      } else {
        const errorMsg = data.error || 'Équipe non reconnue : aucune alerte créée.';
        setTelegramSimResponse(errorMsg);
        setTelegramSimFeedback({
          success: false,
          message: errorMsg,
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
          isAmbiguous: Boolean(data.isAmbiguous),
        });
      }
    } catch (e) {
      console.error(e);
      const connErrMsg = 'Erreur de connexion au serveur API';
      setTelegramSimResponse(connErrMsg);
      setTelegramSimFeedback({
        success: false,
        message: connErrMsg,
      });
    } finally {
      setTelegramSimLoading(false);
    }
  };

  // Telegram Bot Operations
  const fetchTelegramStatus = async () => {
    setTelegramStatusLoading(true);
    try {
      const res = await fetch('/api/telegram/status');
      if (res.ok) {
        const data = await res.json();
        setTelegramStatus(data);
      }
    } catch (err) {
      console.error('Erreur chargement statut Telegram:', err);
    } finally {
      setTelegramStatusLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'telegram') {
      fetchTelegramStatus();
      const interval = setInterval(() => {
        fetchTelegramStatus();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleConnectTelegram = async (customPassword?: string) => {
    setTelegramConnecting(true);
    setTelegramActionMsg(null);
    const passwordToSend = customPassword !== undefined ? customPassword : savedAdminPassword;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (passwordToSend) {
        headers['x-admin-password'] = passwordToSend;
      }

      const res = await fetch('/api/telegram/connect', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          adminPassword: passwordToSend,
          customDomain: typeof window !== 'undefined' ? window.location.host : undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        setAdminPasswordPrompt(true);
        setTelegramActionMsg({
          type: 'error',
          text: data.error || 'Action protégée : mot de passe administrateur requis pour connecter le bot.',
        });
        return;
      }

      if (data.success && data.connected) {
        if (passwordToSend) {
          setSavedAdminPassword(passwordToSend);
          try { sessionStorage.setItem('club_admin_password', passwordToSend); } catch (e) {}
        }
        setAdminPasswordPrompt(false);
        setAdminPasswordInput('');
        setTelegramActionMsg({
          type: 'success',
          text: `Bot connecté avec succès ! (@${data.botUsername || 'bot'}). Le webhook est configuré et sécurisé par signature secrète.`,
        });
        await fetchTelegramStatus();
      } else {
        setTelegramActionMsg({
          type: 'error',
          text: data.error || 'Échec de la connexion du bot Telegram.',
        });
      }
    } catch (err: any) {
      setTelegramActionMsg({
        type: 'error',
        text: `Erreur de connexion : ${err.message || 'serveur inaccessible'}`,
      });
    } finally {
      setTelegramConnecting(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    if (!confirm('Voulez-vous vraiment déconnecter le webhook Telegram ? Le bot ne recevra plus les alertes de victoires / défaites en direct.')) {
      return;
    }
    setTelegramDisconnecting(true);
    setTelegramActionMsg(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (savedAdminPassword) {
        headers['x-admin-password'] = savedAdminPassword;
      }

      const res = await fetch('/api/telegram/disconnect', {
        method: 'POST',
        headers,
        body: JSON.stringify({ adminPassword: savedAdminPassword }),
      });

      const data = await res.json();
      if (res.status === 401) {
        setAdminPasswordPrompt(true);
        setTelegramActionMsg({
          type: 'error',
          text: data.error || 'Action protégée : mot de passe administrateur requis.',
        });
        return;
      }

      if (data.success) {
        setTelegramActionMsg({
          type: 'info',
          text: 'Webhook Telegram déconnecté avec succès.',
        });
        await fetchTelegramStatus();
      } else {
        setTelegramActionMsg({
          type: 'error',
          text: data.error || 'Erreur lors de la déconnexion.',
        });
      }
    } catch (err: any) {
      setTelegramActionMsg({
        type: 'error',
        text: `Erreur : ${err.message || 'serveur inaccessible'}`,
      });
    } finally {
      setTelegramDisconnecting(false);
    }
  };

  return {
    telegramStatus,
    telegramStatusLoading,
    telegramConnecting,
    telegramDisconnecting,
    telegramActionMsg,
    setTelegramActionMsg,
    adminPasswordPrompt,
    setAdminPasswordPrompt,
    adminPasswordInput,
    setAdminPasswordInput,
    effectiveLastTelegramMessage,
    formatTelegramDate,
    telegramSimText,
    setTelegramSimText,
    telegramSimFeedback,
    telegramSimLoading,
    handleTestTelegramMessage,
    fetchTelegramStatus,
    handleConnectTelegram,
    handleDisconnectTelegram,
  };
}
