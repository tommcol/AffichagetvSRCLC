import React, { useState, useEffect } from 'react';
import { Clock, Radio, Maximize2, Settings, Play, Pause, ChevronRight } from 'lucide-react';
import { ClubSettings, CategoryConfig, SlideCategory } from '../types';

interface HeaderTVProps {
  clubSettings: ClubSettings;
  categories: CategoryConfig[];
  currentCategory: SlideCategory;
  progressPercent: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSelectCategory: (cat: SlideCategory) => void;
  onOpenAdmin: () => void;
  onToggleFullscreen: () => void;
  notificationActive: boolean;
}

export const HeaderTV: React.FC<HeaderTVProps> = ({
  clubSettings,
  categories,
  currentCategory,
  progressPercent,
  isPlaying,
  onTogglePlay,
  onSelectCategory,
  onOpenAdmin,
  onToggleFullscreen,
  notificationActive,
}) => {
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDateStr(
        now.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeCategoryConfig = categories.find((c) => c.id === currentCategory);

  return (
    <header className="relative z-30 bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-md px-6 py-3 shadow-2xl">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Club Brand & Live Pulse */}
        <div className="flex items-center gap-4">
          <div className="relative group flex items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-0.5 shadow-lg shadow-orange-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center overflow-hidden">
              {clubSettings.logoUrl ? (
                <img
                  src={clubSettings.logoUrl}
                  alt={clubSettings.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-2xl font-black text-orange-500 font-bebas">BC</span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase font-bebas leading-none">
                {clubSettings.name}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                DIFFUSION TV EN DIRECT
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              FFBB N° {clubSettings.codeFFBB} • {clubSettings.gymnasiumDefault}
            </p>
          </div>
        </div>

        {/* Center: Active Category Pill & Categories Tabs for TV */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          {categories
            .filter((c) => c.enabled)
            .map((cat) => {
              const isActive = cat.id === currentCategory;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  id={`cat-nav-${cat.id}`}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-105'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{cat.shortLabel}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-orange-600/60 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cat.durationSeconds}s
                  </span>
                </button>
              );
            })}
        </div>

        {/* Right: Clock & Quick Kiosk Controls */}
        <div className="flex items-center gap-4">
          {/* Clock */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-2xl font-mono font-bold text-white tracking-wider leading-none">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>{time || '--:--:--'}</span>
            </div>
            <div className="text-[11px] font-medium text-slate-400 capitalize mt-0.5">
              {dateStr}
            </div>
          </div>

          {/* Quick controls (Admin, Play/Pause, Fullscreen) */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800">
            <button
              onClick={onTogglePlay}
              title={isPlaying ? 'Mettre en pause le carrousel' : 'Reprendre la rotation automatique'}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              id="btn-tv-toggle-play"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={onToggleFullscreen}
              title="Plein écran (Idéal pour TV / Fully Kiosk)"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              id="btn-tv-fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenAdmin}
              title="Administration & Dossiers de Catégories"
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-orange-600/20 transition-all hover:scale-105"
              id="btn-open-admin-panel"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Gestion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar for the current slide duration */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/50 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 transition-all duration-200 ease-linear shadow-sm"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};
