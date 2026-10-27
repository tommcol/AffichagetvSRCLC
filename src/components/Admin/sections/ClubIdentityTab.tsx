// ClubIdentityTab — onglet « club_identity » de l'AdminPanel.
// Extrait automatiquement lors du découpage de AdminPanel.tsx : aucune logique modifiée.
// Toutes les données et fonctions nécessaires sont reçues via des props explicites.

import { Upload, Trophy, Trash2, RefreshCw, Building2, Camera, Shield, Share2, Instagram, Facebook, Flame, ChevronRight } from 'lucide-react';
import { isTeamCategoryIgnored } from '../../../services/ffbbService';

export interface ClubIdentityTabProps {
  // Typage permissif lors de l'extraction : chaque identifiant utilisé est passé en prop depuis AdminPanel.
  [key: string]: any;
}

export function ClubIdentityTab(props: ClubIdentityTabProps) {
    const {
    clubSettings,
    ffbbTeams,
    handleLogoFileUpload,
    isUploadingLogo,
    logoFileInputRef,
    onUpdateClubSettings,
    setActiveTab,
    setIsDraggingLogo,
    setSocialForm,
    isDraggingLogo,
  } = props;

  return (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* En-tête de section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white font-bebas tracking-wide flex items-center gap-2">
                      <span>IDENTITÉ & COORDONNÉES DU CLUB</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300">
                        Configuration Centrale
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Centralisez ici le nom officiel, le logo, la salle par défaut et les réseaux de votre club.
                    </p>
                  </div>
                </div>

                {/* Badge d'aperçu rapide */}
                <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-700/50">
                  {clubSettings.logoUrl ? (
                    <img
                      src={clubSettings.logoUrl}
                      alt={clubSettings.shortName}
                      className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-orange-600/20 flex items-center justify-center text-orange-400 font-bold text-xs">
                      {(clubSettings.shortName || 'BC').slice(0, 3)}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">{clubSettings.shortName || clubSettings.name || 'Nom du club'}</div>
                    <div className="text-[10px] text-slate-400">{clubSettings.city || 'Ville'}</div>
                  </div>
                </div>
              </div>

              {/* Grille principale : Coordonnées à gauche, Logo à droite */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Colonne gauche (7 cols) : Infos textuelles & FFBB */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Bloc 1 : Nom et Salle */}
                  <div className="bg-slate-900/70 p-5 rounded-3xl border border-slate-800 space-y-4">
                    <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-orange-400" />
                      <span>Nom & Lieux Officiels</span>
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Nom officiel complet du club :
                        </label>
                        <input
                          type="text"
                          value={clubSettings.name}
                          onChange={(e) => onUpdateClubSettings({ ...clubSettings, name: e.target.value })}
                          placeholder="Ex: Basket Club Val de Loire"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Nom officiel déposé à la FFBB ou en préfecture.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1">
                            Diminutif / Nom d'usage court :
                          </label>
                          <input
                            type="text"
                            value={clubSettings.shortName}
                            onChange={(e) => onUpdateClubSettings({ ...clubSettings, shortName: e.target.value })}
                            placeholder="Ex: BCVL"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none font-bold text-orange-400"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">
                            Utilisé sur les bandeaux TV, scores et hashtags.
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1">
                            Ville principale :
                          </label>
                          <input
                            type="text"
                            value={clubSettings.city}
                            onChange={(e) => onUpdateClubSettings({ ...clubSettings, city: e.target.value })}
                            placeholder="Ex: Ma Ville"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">
                            Sert à identifier les rencontres à domicile.
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Gymnase / Salle principale par défaut :
                        </label>
                        <input
                          type="text"
                          value={clubSettings.gymnasiumDefault}
                          onChange={(e) => onUpdateClubSettings({ ...clubSettings, gymnasiumDefault: e.target.value })}
                          placeholder="Ex: Gymnase intercommunal ou Gymnase municipal"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Lieu pré-rempli par défaut sur les matchs joués à domicile.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bloc 2 : Code FFBB */}
                  <div className="bg-slate-900/70 p-5 rounded-3xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-blue-400" />
                        <span>Filiation & Code FFBB</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveTab('ffbb')}
                        className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>Ouvrir la synchronisation</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Code Club Officiel FFBB :
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={clubSettings.codeFFBB}
                          onChange={(e) => onUpdateClubSettings({ ...clubSettings, codeFFBB: e.target.value.toUpperCase().trim() })}
                          placeholder="Ex: DEMO0000000"
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-blue-500 focus:outline-none uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => setActiveTab('ffbb')}
                          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 shrink-0"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Aller à la synchro</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Code officiel attribué par la fédération (ex: DEMO0000000).
                      </p>
                    </div>

                    {/* Statut rapide des équipes suivies */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-orange-400" />
                        <span className="text-slate-300 font-semibold">Équipes suivies sur la TV :</span>
                        <span className="font-mono font-bold text-orange-400">
                          {ffbbTeams.length - (clubSettings.ignoredTeamCategories || []).filter(c => ffbbTeams.some(t => isTeamCategoryIgnored(t.category, [c]))).length} / {ffbbTeams.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('ffbb')}
                        className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>Choisir les équipes</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Colonne droite (5 cols) : Logo du club (Glisser-Déposer / Upload) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-slate-900/70 p-5 rounded-3xl border border-slate-800 space-y-4">
                    <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Camera className="w-4 h-4 text-orange-400" />
                      <span>Logo Officiel du Club</span>
                    </h4>

                    {/* Zone de Glisser-Déposer */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingLogo(true);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setIsDraggingLogo(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingLogo(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingLogo(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleLogoFileUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                        isDraggingLogo
                          ? 'border-orange-400 bg-orange-950/40 scale-[1.02] shadow-xl shadow-orange-500/20'
                          : 'border-slate-700 hover:border-orange-500/80 bg-slate-950/60'
                      }`}
                    >
                      {clubSettings.logoUrl ? (
                        <div className="space-y-3">
                          <div className="w-28 h-28 mx-auto rounded-2xl bg-slate-900 border border-slate-700/80 p-3 flex items-center justify-center shadow-lg relative group">
                            <img
                              src={clubSettings.logoUrl}
                              alt={clubSettings.name}
                              className="max-w-full max-h-full object-contain"
                            />
                            {isUploadingLogo && (
                              <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 text-orange-400 animate-spin" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 font-bold">
                            Logo actuel du club
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Glissez une nouvelle image ici pour remplacer le logo
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 py-4">
                          <Upload className={`w-10 h-10 mx-auto text-orange-400 transition-transform ${isDraggingLogo ? 'scale-125 animate-bounce' : ''}`} />
                          <div className="text-sm font-bold text-white">
                            Glissez-déposez le logo ici
                          </div>
                          <p className="text-xs text-slate-400">
                            PNG avec transparence recommandé, SVG ou JPG
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <input
                          ref={logoFileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleLogoFileUpload(e.target.files[0]);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-orange-600/20"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingLogo ? 'Téléversement...' : clubSettings.logoUrl ? 'Changer l\'image' : 'Choisir un fichier'}</span>
                        </button>
                        {clubSettings.logoUrl && (
                          <button
                            type="button"
                            onClick={() => onUpdateClubSettings({ ...clubSettings, logoUrl: '' })}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 font-bold text-xs transition-colors"
                            title="Retirer le logo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Champ URL direct alternatif */}
                    <div className="pt-1">
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Ou URL directe du logo (optionnel) :
                      </label>
                      <input
                        type="url"
                        value={clubSettings.logoUrl}
                        onChange={(e) => onUpdateClubSettings({ ...clubSettings, logoUrl: e.target.value })}
                        placeholder="https://.../logo.png"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloc Réseaux Sociaux */}
              <div className="bg-slate-900/70 p-5 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-pink-400" />
                    <span>Réseaux Sociaux du Club</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Insérés automatiquement dans les légendes et affiches partagées
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Instagram */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-400" />
                      <span>Compte Instagram</span>
                    </label>
                    <input
                      type="text"
                      value={clubSettings.instagramHandle || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateClubSettings({ ...clubSettings, instagramHandle: val });
                        setSocialForm((prev) => ({ ...prev, instagramHandle: val }));
                      }}
                      placeholder="@club_basket"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-pink-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500">Exemple : @club_basket</p>
                  </div>

                  {/* Facebook */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Facebook className="w-3.5 h-3.5 text-blue-400" />
                      <span>Page Facebook</span>
                    </label>
                    <input
                      type="text"
                      value={clubSettings.facebookPage || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateClubSettings({ ...clubSettings, facebookPage: val });
                        setSocialForm((prev) => ({ ...prev, facebookPage: val }));
                      }}
                      placeholder="Nom du club"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500">Exemple : Nom du club ou facebook.com/votreclub</p>
                  </div>

                  {/* TikTok */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <span>Compte TikTok</span>
                    </label>
                    <input
                      type="text"
                      value={clubSettings.tiktokHandle || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateClubSettings({ ...clubSettings, tiktokHandle: val });
                        setSocialForm((prev) => ({ ...prev, tiktokHandle: val }));
                      }}
                      placeholder="@club_basket"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-rose-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500">Exemple : @club_basket</p>
                  </div>
                </div>
              </div>
            </div>  );
}