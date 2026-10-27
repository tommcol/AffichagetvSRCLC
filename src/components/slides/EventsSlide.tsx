import React from 'react';
import { Sparkles, Calendar, Clock, MapPin } from 'lucide-react';
import { ClubEventItem, ClubSettings } from '../../types';

interface EventsSlideProps {
  event?: ClubEventItem;
  events: ClubEventItem[];
  itemIndex?: number;
  totalItems?: number;
  clubSettings?: ClubSettings;
}

export const EventsSlide: React.FC<EventsSlideProps> = ({
  event,
  events,
  itemIndex,
  totalItems,
  clubSettings,
}) => {
  const currentEvent = event || events[0];
  const currentIndex = typeof itemIndex === 'number' ? itemIndex : 0;
  const count = typeof totalItems === 'number' ? totalItems : events.length;

  if (event && currentEvent) {
    if (currentEvent.imageUrl) {
      return (
        <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden" id={`event-slide-${currentEvent.id}`}>
          {/* Ambient blurred background using the poster itself to perfectly fit 16:9 TV screen */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src={currentEvent.imageUrl}
              alt={currentEvent.title}
              className="w-full h-full object-cover opacity-20 blur-md scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-950/30" />
          </div>

          {/* Centered high-fidelity visual poster */}
          <div className="relative z-10 h-full w-full max-h-full max-w-full p-1 md:p-2 flex items-center justify-center">
            <img
              src={currentEvent.imageUrl}
              alt={currentEvent.title}
              className="max-h-[100vh] max-w-full object-contain rounded-xl md:rounded-2xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Minimal non-intrusive event count badge */}
          <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-black/60 border border-white/15 text-xs text-slate-300 font-mono">
            Événement {currentIndex + 1} / {count}
          </div>
        </div>
      );
    }

    // Default card fallback if no poster is uploaded
    return (
      <div className="relative w-full h-full flex flex-col justify-between p-6 md:p-12 lg:p-16 bg-slate-950 overflow-hidden" id={`event-slide-card-${currentEvent.id}`}>
        <div className="relative z-10 w-full flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs md:text-sm uppercase tracking-widest font-bebas">
            <Sparkles className="w-4 h-4 text-amber-400" /> AGENDA DU CLUB • ÉVÉNEMENT
          </div>
          <div className="px-3.5 py-1 rounded-full bg-black/60 border border-white/15 text-xs text-slate-300 font-mono">
            Événement {currentIndex + 1} / {count}
          </div>
        </div>

        <div className="relative z-10 my-auto w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-900/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          <div className="h-64 md:h-96 w-full rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 flex flex-col items-center justify-center p-6 text-white text-center shadow-xl">
            <Calendar className="w-20 h-20 mb-4 opacity-90" />
            <h4 className="text-3xl font-black font-bebas uppercase tracking-wider">
              {currentEvent.badge || 'Rendez-vous Club'}
            </h4>
          </div>

          <div className="flex flex-col justify-between space-y-4">
            {currentEvent.badge && (
              <span className="self-start px-3.5 py-1 rounded-full bg-orange-600 text-white font-black text-xs uppercase font-bebas tracking-wide">
                {currentEvent.badge}
              </span>
            )}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-bebas tracking-wide leading-tight">
              {currentEvent.title}
            </h2>
            <p className="text-slate-200 text-base md:text-lg leading-relaxed">
              {currentEvent.description}
            </p>

            <div className="pt-4 border-t border-slate-800 space-y-2 text-sm text-slate-300 font-medium">
              <div className="flex items-center gap-2 text-orange-400 font-bold">
                <Calendar className="w-5 h-5 text-orange-400" />
                <span>{currentEvent.date}</span>
              </div>
              {currentEvent.time && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <span>{currentEvent.time}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-5 h-5 text-slate-400" />
                <span>{currentEvent.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full flex items-end justify-between text-xs text-slate-400 pt-4 border-t border-white/10">
          <span>Renseignements et informations auprès du secrétariat du club</span>
          {clubSettings?.logoUrl && (
            <img
              src={clubSettings.logoUrl}
              alt={clubSettings.name}
              className="h-10 object-contain drop-shadow"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 md:p-10 max-w-7xl mx-auto">
      {/* Slide Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs md:text-sm uppercase tracking-widest font-bebas">
          <Sparkles className="w-4 h-4" /> AGENDA & RENDEZ-VOUS DU CLUB
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white font-bebas tracking-wide mt-1">
          ÉVÉNEMENTS PONCTUELS & MANIFESTATIONS
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Stages de perfectionnement, tournois 3x3, soirées club et dates à retenir
        </p>
      </div>

      {/* Events Grid */}
      <div className="my-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 items-stretch overflow-y-auto pr-1">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-2xl backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            {/* Event Top Image if available */}
            {ev.imageUrl && (
              <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                <img
                  src={ev.imageUrl}
                  alt={ev.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                {ev.badge && (
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-orange-600 text-white font-black text-xs uppercase font-bebas shadow-md">
                    {ev.badge}
                  </span>
                )}
              </div>
            )}

            {/* Event Details */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                {!ev.imageUrl && ev.badge && (
                  <span className="inline-block px-3 py-1 rounded-full bg-orange-600/20 text-orange-400 border border-orange-500/30 font-black text-xs uppercase font-bebas mb-3">
                    {ev.badge}
                  </span>
                )}

                <h3 className="text-2xl font-black text-white font-bebas tracking-wide leading-tight">
                  {ev.title}
                </h3>

                <p className="text-sm text-slate-300 mt-2 leading-relaxed line-clamp-3">
                  {ev.description}
                </p>
              </div>

              {/* Date, Time & Venue */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-orange-400 font-semibold">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  <span>{ev.date}</span>
                </div>
                {ev.time && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>{ev.time}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-400 truncate">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="truncate">{ev.location}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/70">
        <span>Renseignements & inscriptions auprès des dirigeants ou à la buvette du gymnase</span>
        <span className="font-mono text-orange-400">{events.length} événements programmés</span>
      </div>
    </div>
  );
};
