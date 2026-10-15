// TelegramTab — onglet « telegram » de l'AdminPanel.
// Extrait automatiquement lors du découpage de AdminPanel.tsx : aucune logique modifiée.
// Toutes les données et fonctions nécessaires sont reçues via des props explicites.

import { X, Trash2, RefreshCw, CheckCircle2, AlertCircle, Bot, MessageSquare, Check, Send, Shield, ShieldCheck, Loader2, Unlink, Lock } from 'lucide-react';

export interface TelegramTabProps {
  // Typage permissif lors de l'extraction : chaque identifiant utilisé est passé en prop depuis AdminPanel.
  [key: string]: any;
}

export function TelegramTab(props: TelegramTabProps) {
  const {
    w,
    distance,
    score,
    telegramStatusLoading,
    telegramStatus,
    effectiveLastTelegramMessage,
    fetchTelegramStatus,
    title,
    formatTelegramDate,
    d,
    activeAlerts,
    team,
    isWin,
    onRemoveAlert,
    telegramActionMsg,
    setTelegramActionMsg,
    adminPasswordPrompt,
    adminPasswordInput,
    setAdminPasswordInput,
    handleConnectTelegram,
    telegramConnecting,
    setAdminPasswordPrompt,
    handleDisconnectTelegram,
    telegramDisconnecting,
    setTelegramSimText,
    telegramSimText,
    handleTestTelegramMessage,
    telegramSimLoading,
    telegramSimFeedback,
  } = props;

  return (
            <div className="space-y-6">
              {/* Telegram Info Banner */}
              <div className="bg-sky-950/40 border border-sky-500/30 p-5 rounded-3xl">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <Bot className="w-4 h-4" />
                  <span>Commande à distance par smartphone</span>
                </div>
                <h3 className="text-xl font-black text-white font-bebas tracking-wide">
                  DÉCLENCHER UNE VICTOIRE OU DÉFAITE VIA TELEGRAM
                </h3>
                <p className="text-xs text-slate-300 max-w-3xl mt-1">
                  Au coup de sifflet final sur le terrain, vous pouvez envoyer un simple message Telegram depuis votre smartphone. 
                  L'application analyse automatiquement votre message (équipe, score, résultat) et injecte immédiatement l'affiche dans la boucle TV pendant 1 heure.
                </p>
              </div>

              {/* Telegram Connection & Status Card */}
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white font-bebas tracking-wide flex items-center gap-2">
                        <span>LIAISON SERVEUR DU BOT TELEGRAM</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Gestion sécurisée du webhook sans divulgation du secret TELEGRAM_BOT_TOKEN
                      </p>
                    </div>
                  </div>

                  {/* Connection indicator */}
                  <div className="flex items-center gap-2">
                    {telegramStatusLoading ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                        <span>Vérification du statut...</span>
                      </div>
                    ) : !telegramStatus?.connected ? (
                      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>Bot non connecté</span>
                      </div>
                    ) : effectiveLastTelegramMessage && effectiveLastTelegramMessage.success === false ? (
                      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-xs font-bold text-red-300 shadow-md shadow-red-500/10">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        <span>Le message n'a pas été traité</span>
                      </div>
                    ) : effectiveLastTelegramMessage && effectiveLastTelegramMessage.success !== false ? (
                      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300 shadow-md shadow-emerald-500/10">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span>Bot opérationnel</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-xs font-bold text-sky-300 shadow-md shadow-sky-500/10">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                        </span>
                        <span>Configuration active — en attente du premier message</span>
                      </div>
                    )}

                    <button
                      onClick={fetchTelegramStatus}
                      disabled={telegramStatusLoading}
                      title="Actualiser le statut auprès de Telegram"
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 ${telegramStatusLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Status details / Informational feedback */}
                {telegramStatus?.connected ? (
                  <div className="space-y-4">
                    {/* Bot info grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Identifiant du Bot
                        </div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Bot className="w-4 h-4 text-sky-400" />
                          <span>@{telegramStatus.botUsername || 'SRC Bot'}</span>
                        </div>
                        {telegramStatus.botName && (
                          <div className="text-xs text-slate-400 mt-0.5">{telegramStatus.botName}</div>
                        )}
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Sécurité des Requêtes
                        </div>
                        <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Signature Secrète Active</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Certifié par X-Telegram-Bot-Api-Secret-Token
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          État des Messages
                        </div>
                        <div className="text-sm font-bold text-white">
                          {effectiveLastTelegramMessage && effectiveLastTelegramMessage.success !== false
                            ? 'Dernier message validé'
                            : effectiveLastTelegramMessage && effectiveLastTelegramMessage.success === false
                            ? "Le message n'a pas été traité"
                            : 'En attente du premier message'}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {effectiveLastTelegramMessage?.receivedAt
                            ? `Reçu le ${formatTelegramDate(effectiveLastTelegramMessage.receivedAt)}`
                            : "Aucun message reçu pour l'instant"}
                        </div>
                      </div>
                    </div>

                    {/* Bloc d'état dynamique : visible uniquement tant que l'alerte Telegram est active */}
                    {(() => {
                      const latestTelegramAlert = activeAlerts.find(
                        (alert) => alert.triggeredBy === 'telegram'
                      );

                      if (!effectiveLastTelegramMessage || effectiveLastTelegramMessage.success === false || !latestTelegramAlert) {
                        return null;
                      }

                      return (
                        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
                            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>Dernier message reçu le {formatTelegramDate(effectiveLastTelegramMessage.receivedAt)}</span>
                            </div>
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 w-fit">
                              Actif dans la boucle TV
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
                            <div className="space-y-1">
                              <div className="text-slate-400">Message reçu depuis le smartphone :</div>
                              <div className="font-mono font-bold text-white text-sm bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800 inline-block">
                                "{effectiveLastTelegramMessage.text}"
                              </div>
                            </div>
                            {effectiveLastTelegramMessage.team && (
                              <div className="text-left sm:text-right space-y-1">
                                <span className="text-slate-400">Équipe & résultat détectés :</span>
                                <div className="font-bold text-emerald-300 text-sm">
                                  {effectiveLastTelegramMessage.team} • {effectiveLastTelegramMessage.isWin ? 'Victoire 🏆' : 'Défaite 🏀'}
                                  {effectiveLastTelegramMessage.score ? ` (${effectiveLastTelegramMessage.score})` : ''}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="text-xs text-slate-400">
                              Cette alerte est actuellement diffusée dans la boucle TV.
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveAlert(latestTelegramAlert.id)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                              title="Supprimer l'alerte Telegram de la boucle TV"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Supprimer l'alerte de la TV
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <p className="flex items-start gap-2 text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        Le bot Telegram n'est pas connecté. Cliquez sur le bouton <strong>« Connecter le bot »</strong> ci-dessous pour initialiser automatiquement la liaison webhook avec Telegram.
                      </span>
                    </p>
                  </div>
                )}

                {/* Last error from Telegram if any */}
                {telegramStatus?.lastError && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Dernier message Telegram : {telegramStatus.lastError}</span>
                  </div>
                )}

                {/* Action message feedback */}
                {telegramActionMsg && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 border ${
                      telegramActionMsg.type === 'success'
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : telegramActionMsg.type === 'error'
                        ? 'bg-red-950/40 border-red-500/40 text-red-300'
                        : 'bg-sky-950/40 border-sky-500/40 text-sky-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {telegramActionMsg.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span>{telegramActionMsg.text}</span>
                    </div>
                    <button
                      onClick={() => setTelegramActionMsg(null)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Password prompt box if protected */}
                {adminPasswordPrompt && (
                  <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-3">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                      <Lock className="w-4 h-4" />
                      <span>Action protégée : Mot de passe administrateur requis</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      La modification du webhook nécessite le mot de passe configuré dans Cloudflare (variable d'environnement <code>ADMIN_PASSWORD</code>).
                    </p>
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="password"
                        value={adminPasswordInput}
                        onChange={(e) => setAdminPasswordInput(e.target.value)}
                        placeholder="Mot de passe admin Cloudflare..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleConnectTelegram(adminPasswordInput)}
                      />
                      <button
                        onClick={() => handleConnectTelegram(adminPasswordInput)}
                        disabled={telegramConnecting || !adminPasswordInput.trim()}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {telegramConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Valider et connecter</span>
                      </button>
                      <button
                        onClick={() => setAdminPasswordPrompt(false)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => handleConnectTelegram()}
                    disabled={telegramConnecting}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-sky-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    {telegramConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Connexion en cours...</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4" />
                        <span>{telegramStatus?.connected ? 'Reconnecter le bot' : 'Connecter le bot'}</span>
                      </>
                    )}
                  </button>

                  {telegramStatus?.connected && (
                    <button
                      onClick={handleDisconnectTelegram}
                      disabled={telegramDisconnecting}
                      className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-red-950/40 text-slate-300 hover:text-red-300 border border-slate-800 hover:border-red-500/40 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {telegramDisconnecting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Déconnexion...</span>
                        </>
                      ) : (
                        <>
                          <Unlink className="w-3.5 h-3.5 text-red-400" />
                          <span>Déconnecter le bot</span>
                        </>
                      )}
                    </button>
                  )}

                  <div className="text-xs text-slate-500 ml-auto flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span>Le token n'est jamais affiché ni renvoyé au navigateur</span>
                  </div>
                </div>
              </div>

              {/* Exemples de messages à envoyer au bot */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4" />
                  <span>Format des commandes par smartphone</span>
                </div>
                <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                  EXEMPLES DE MESSAGES À ENVOYER AU BOT
                </h4>
                <p className="text-xs text-slate-400">
                  Depuis votre smartphone sur Telegram, envoyez directement un message dans la conversation du bot au coup de sifflet final :
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Victoire avec score</span>
                    <div className="text-xs font-mono font-bold text-emerald-400 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      Victoire Seniors 1 82-74
                    </div>
                    <p className="text-[11px] text-slate-400">Affiche victoire + score exact</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Défaite avec score</span>
                    <div className="text-xs font-mono font-bold text-rose-400 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      Defaite U15 54-60
                    </div>
                    <p className="text-[11px] text-slate-400">Affiche défaite + score exact</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Victoire par alias</span>
                    <div className="text-xs font-mono font-bold text-emerald-400 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      Victoire SG1
                    </div>
                    <p className="text-[11px] text-slate-400">Reconnaissance de l'équipe SG1</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Équipe féminine</span>
                    <div className="text-xs font-mono font-bold text-sky-400 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      Victoire SF1 71-65
                    </div>
                    <p className="text-[11px] text-slate-400">Seniors Filles 1 reconnues</p>
                  </div>
                </div>
              </div>

              {/* Interactive Telegram Test Simulator */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-sky-400" />
                  <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                    SIMULATEUR DE MESSAGE TELEGRAM EN DIRECT
                  </h4>
                </div>
                <p className="text-xs text-slate-400">
                  Testez immédiatement ce qui se passe quand vous envoyez un message Telegram depuis votre smartphone.
                </p>

                {/* Preset sample buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">Exemples rapides :</span>
                  <button
                    onClick={() => setTelegramSimText('Victoire Seniors 1 88-75')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    Victoire Seniors 1 88-75
                  </button>
                  <button
                    onClick={() => setTelegramSimText('Victoire U9 Garçons 24-18')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    Victoire U9 Garçons 24-18
                  </button>
                  <button
                    onClick={() => setTelegramSimText('Victoire U9 Mixte 24-18')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    Victoire U9 Mixte 24-18
                  </button>
                  <button
                    onClick={() => setTelegramSimText('Défaite U18 62-68')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    Défaite U18 62-68
                  </button>
                  <button
                    onClick={() => setTelegramSimText('Victoire U13F1 42-36')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    Victoire U13F1 42-36
                  </button>
                  <button
                    onClick={() => setTelegramSimText('Victoire SF1 71-65')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    Victoire SF1 71-65
                  </button>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={telegramSimText}
                    onChange={(e) => setTelegramSimText(e.target.value)}
                    placeholder="Tapez un message ex: Victoire Seniors 1 82-74..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleTestTelegramMessage()}
                  />
                  <button
                    onClick={handleTestTelegramMessage}
                    disabled={telegramSimLoading}
                    className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-sky-600/20 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{telegramSimLoading ? 'Analyse...' : 'Tester l\'envoi'}</span>
                  </button>
                </div>

                {/* Result feedback */}
                {telegramSimFeedback && (
                  telegramSimFeedback.success ? (
                    <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-sm flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold">{telegramSimFeedback.message}</p>
                        <p className="text-xs text-emerald-400/80">
                          Le visuel de l'équipe a été injecté dans la rotation TV pour une durée de 1 heure. Vous pouvez le voir dans l'onglet "Alertes 1h en cours" ou en basculant sur la TV !
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-sm space-y-2.5">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-300">
                            {telegramSimFeedback.isAmbiguous
                              ? 'Nom d\'équipe ambigu : aucune alerte créée'
                              : 'Nom d\'équipe non reconnu : aucune alerte créée'}
                          </p>
                          <p className="text-xs text-amber-200/90 mt-0.5">
                            {telegramSimFeedback.message}
                          </p>
                        </div>
                      </div>

                      {telegramSimFeedback.suggestions && telegramSimFeedback.suggestions.length > 0 && (
                        <div className="pt-2 border-t border-amber-500/20 pl-8">
                          <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                            Équipes configurées les plus proches (cliquez pour tester) :
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {telegramSimFeedback.suggestions.map((sug) => (
                              <button
                                key={sug}
                                onClick={() => {
                                  setTelegramSimText(`Victoire ${sug} 82-74`);
                                }}
                                className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-bold transition-all hover:scale-105"
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>  );
}