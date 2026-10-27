// SocialTab — onglet « social » de l'AdminPanel.
// Extrait automatiquement lors du découpage de AdminPanel.tsx : aucune logique modifiée.
// Toutes les données et fonctions nécessaires sont reçues via des props explicites.

import { Bot, Check, Send, Instagram, Facebook, Smartphone, Flame, Settings, Pencil } from 'lucide-react';
import { ClubSettings } from '../../../types';
import { VisualExporterModal } from '../../VisualExporterModal';

export interface SocialTabProps {
  // Typage permissif lors de l'extraction : chaque identifiant utilisé est passé en prop depuis AdminPanel.
  [key: string]: any;
}

export function SocialTab(props: SocialTabProps) {
    const {
    birthdays,
    clubSettings,
    handleTestSocialWebhook,
    matches,
    onUpdateClubSettings,
    onUpdateVisualTemplates,
    results,
    setActiveTab,
    setSocialForm,
    setSocialSaveSuccess,
    socialForm,
    socialWebhookStatus,
    visualTemplates,
    isOpen,
    onClose,
  } = props;

  return (
            <div className="space-y-6">
              {/* Studio Graphique & Exporteur Visuel Réseaux Sociaux Intégré Directement */}
              <VisualExporterModal
                isOpen={true}
                onClose={() => {}}
                type="matches"
                matches={matches}
                results={results}
                birthdays={birthdays}
                clubSettings={clubSettings}
                visualTemplates={visualTemplates}
                onUpdateVisualTemplates={onUpdateVisualTemplates}
                embeddedInTab={true}
              />

              {/* Configuration du fournisseur IA : les clés restent exclusivement dans les secrets Cloudflare */}
              <div className="bg-slate-800/60 p-6 rounded-3xl border border-orange-500/30 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">FOURNISSEUR IA DES LÉGENDES</h4>
                    <p className="text-xs text-slate-400">Choisissez le modèle utilisé pour les légendes et la réécriture de textes.</p>
                  </div>
                </div>
                <label className="block space-y-2">
                  <span className="text-xs font-bold text-slate-300">Intelligence artificielle</span>
                  <select
                    value={clubSettings.aiProvider || 'gemini'}
                    onChange={(e) => onUpdateClubSettings({ ...clubSettings, aiProvider: e.target.value as ClubSettings['aiProvider'] })}
                    className="w-full max-w-xl px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-orange-500 focus:outline-none"
                  >
                    <option value="mistral">Mistral — Mistral Small</option>
                    <option value="openai">ChatGPT — GPT-4o mini</option>
                    <option value="claude">Claude — Haiku</option>
                    <option value="gemini">Gemini — Gemini 2.5 Flash</option>
                  </select>
                </label>
                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-2 text-xs text-slate-300">
                  <p className="font-bold text-orange-300">Clé API sécurisée côté serveur</p>
                  <p>Pour activer le fournisseur choisi, ajoutez sa clé dans Cloudflare : Workers & Pages → affichage-tv-club → Settings → Variables and Secrets → Add secret. Ne collez pas la clé ici et ne l'enregistrez pas dans les réglages du club.</p>
                  <p className="font-mono text-[11px] text-slate-400">Mistral : MISTRAL_API_KEY · ChatGPT : OPENAI_API_KEY · Claude : ANTHROPIC_API_KEY · Gemini : GEMINI_API_KEY</p>
                  <p className="text-amber-300">Chaque installation Cloudflare possède ses propres secrets. Les clés ne sont jamais envoyées au navigateur. Un seul secret est nécessaire pour le fournisseur sélectionné.</p>
                </div>
              </div>

              {/* Account Settings & Webhook Section */}
              <div className="bg-slate-800/60 p-6 rounded-3xl border border-slate-700/60 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                      COMPTES SOCIAUX OFFICIELS DU CLUB & PASSERELLE WEBHOOK
                    </h4>
                    <p className="text-xs text-slate-400">
                      Vos comptes officiels renseignés dans Identité du Club sont automatiquement utilisés pour générer les légendes et publications.
                    </p>
                  </div>
                </div>

                {/* Récapitulatif des comptes officiels avec lien vers Identité du Club */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Comptes officiels actuels (Identité du Club) :
                    </span>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-pink-400 bg-pink-950/40 px-3 py-1 rounded-xl border border-pink-500/20">
                        <Instagram className="w-4 h-4" />
                        <span className="text-white">{clubSettings.instagramHandle || '@non_renseigné'}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-400 bg-rose-950/40 px-3 py-1 rounded-xl border border-rose-500/20">
                        <Flame className="w-4 h-4" />
                        <span className="text-white">{clubSettings.tiktokHandle || '@non_renseigné'}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-blue-400 bg-blue-950/40 px-3 py-1 rounded-xl border border-blue-500/20">
                        <Facebook className="w-4 h-4" />
                        <span className="text-white">{clubSettings.facebookPage || 'Non renseignée'}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('club_identity')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all shrink-0 self-start md:self-auto shadow-sm"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Modifier dans Identité du Club</span>
                  </button>
                </div>

                {/* Configuration Webhook Automatisation */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-orange-400" />
                        <span>URL Webhook Automatisation (Optionnel : Make, Zapier, n8n, Meta Graph)</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Appelée lors du déclenchement automatique</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={socialForm.socialWebhookUrl}
                        onChange={(e) => setSocialForm({ ...socialForm, socialWebhookUrl: e.target.value })}
                        placeholder="https://hook.eu1.make.com/xxxx ou https://hooks.zapier.com/hooks/catch/xxxx"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-orange-500 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleTestSocialWebhook}
                        disabled={socialWebhookStatus.loading}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5 text-orange-400" />
                        <span>{socialWebhookStatus.loading ? 'Envoi...' : 'Tester le Webhook'}</span>
                      </button>
                    </div>

                    {socialWebhookStatus.message && (
                      <p className={`text-xs mt-1.5 font-medium ${socialWebhookStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {socialWebhookStatus.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateClubSettings({
                          ...clubSettings,
                          socialWebhookUrl: socialForm.socialWebhookUrl,
                        });
                        setSocialSaveSuccess(true);
                        setTimeout(() => setSocialSaveSuccess(false), 3000);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/20 transition-all hover:scale-105 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Enregistrer l'URL Webhook</span>
                    </button>
                  </div>
              </div>

              {/* Mobile Share Sheet Notice */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-slate-200">📱 Partage direct depuis smartphone ou tablette :</span>
                  <p>
                    En ouvrant le Studio Graphique depuis votre téléphone (iPhone Safari ou Android Chrome), le bouton <strong>"Partager directement (Mobile)"</strong> utilise la feuille de partage native de votre OS. Vous pouvez envoyer l'affiche et la légende directement dans l'application Instagram, TikTok ou Facebook installée sur votre appareil !
                  </p>
                </div>
              </div>
            </div>  );
}