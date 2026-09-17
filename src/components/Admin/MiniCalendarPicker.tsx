import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, RotateCcw } from 'lucide-react';

interface MiniCalendarPickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChangeRange: (start: string, end: string) => void;
  onClose?: () => void;
  title?: string;
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS_HEADER_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

// Helper to pad number to 2 digits
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const formatDateToReadableFrench = (isoDate: string): string => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const dateObj = new Date(year, month, day);
  const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const dayName = daysOfWeek[dateObj.getDay()];
  const monthName = MONTHS_FR[month] || '';

  return `${dayName} ${day} ${monthName} ${year}`;
};

export const MiniCalendarPicker: React.FC<MiniCalendarPickerProps> = ({
  startDate,
  endDate,
  onChangeRange,
  title = 'Sélectionnez vos dates',
}) => {
  // Determine initial month/year based on startDate, or current date
  const initialDate = useMemo(() => {
    if (startDate && startDate.includes('-')) {
      const p = startDate.split('-');
      return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, 1);
    }
    return new Date();
  }, [startDate]);

  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth()); // 0-11

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Quick Preset Handlers
  const handleSelectThisWeekend = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sun, 5 is Fri, 6 is Sat
    let diffToFriday = 5 - dayOfWeek;
    if (dayOfWeek === 0) diffToFriday = -2;
    else if (dayOfWeek === 6) diffToFriday = -1;

    const fri = new Date(today);
    fri.setDate(today.getDate() + diffToFriday);

    const sun = new Date(fri);
    sun.setDate(fri.getDate() + 2); // Friday to Sunday

    const sIso = `${fri.getFullYear()}-${pad2(fri.getMonth() + 1)}-${pad2(fri.getDate())}`;
    const eIso = `${sun.getFullYear()}-${pad2(sun.getMonth() + 1)}-${pad2(sun.getDate())}`;
    
    onChangeRange(sIso, eIso);
    setCurrentYear(fri.getFullYear());
    setCurrentMonth(fri.getMonth());
  };

  const handleSelectNextWeekend = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    let diffToFriday = 5 - dayOfWeek + 7;
    if (dayOfWeek === 0) diffToFriday = -2 + 7;
    else if (dayOfWeek === 6) diffToFriday = -1 + 7;

    const fri = new Date(today);
    fri.setDate(today.getDate() + diffToFriday);

    const sun = new Date(fri);
    sun.setDate(fri.getDate() + 2);

    const sIso = `${fri.getFullYear()}-${pad2(fri.getMonth() + 1)}-${pad2(fri.getDate())}`;
    const eIso = `${sun.getFullYear()}-${pad2(sun.getMonth() + 1)}-${pad2(sun.getDate())}`;

    onChangeRange(sIso, eIso);
    setCurrentYear(fri.getFullYear());
    setCurrentMonth(fri.getMonth());
  };

  const handleSelectThisMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();

    const sIso = `${y}-${pad2(m + 1)}-01`;
    const eIso = `${y}-${pad2(m + 1)}-${pad2(lastDay)}`;

    onChangeRange(sIso, eIso);
    setCurrentYear(y);
    setCurrentMonth(m);
  };

  const handleClear = () => {
    onChangeRange('', '');
  };

  // Calendar cells generation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday=0, Sunday=6
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`;
  }, []);

  // Handle day click
  const handleDayClick = (isoString: string) => {
    if (!startDate || (startDate && endDate)) {
      // First click: start new range
      onChangeRange(isoString, '');
    } else {
      // Second click: complete range
      if (isoString < startDate) {
        onChangeRange(isoString, startDate);
      } else {
        onChangeRange(startDate, isoString);
      }
    }
  };

  // Build grid days
  interface DayCell {
    dayNumber: number;
    isoString: string;
    isCurrentMonth: boolean;
    isWeekend: boolean;
    isToday: boolean;
    isSelectedStart: boolean;
    isSelectedEnd: boolean;
    isInRange: boolean;
  }

  const cells: DayCell[] = [];

  // Trailing days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const m = currentMonth === 0 ? 12 : currentMonth;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const iso = `${y}-${pad2(m)}-${pad2(dayNum)}`;
    const dayOfWeek = (cells.length) % 7;
    cells.push({
      dayNumber: dayNum,
      isoString: iso,
      isCurrentMonth: false,
      isWeekend: dayOfWeek === 5 || dayOfWeek === 6,
      isToday: iso === todayStr,
      isSelectedStart: iso === startDate,
      isSelectedEnd: iso === endDate,
      isInRange: !!(startDate && endDate && iso > startDate && iso < endDate),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${currentYear}-${pad2(currentMonth + 1)}-${pad2(d)}`;
    const dayOfWeek = (cells.length) % 7;
    cells.push({
      dayNumber: d,
      isoString: iso,
      isCurrentMonth: true,
      isWeekend: dayOfWeek === 5 || dayOfWeek === 6,
      isToday: iso === todayStr,
      isSelectedStart: iso === startDate,
      isSelectedEnd: iso === endDate,
      isInRange: !!(startDate && endDate && iso > startDate && iso < endDate),
    });
  }

  // Leading days for next month to fill grid (35 or 42 cells)
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let n = 1; n <= remaining; n++) {
    const m = currentMonth === 11 ? 1 : currentMonth + 2;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    const iso = `${y}-${pad2(m)}-${pad2(n)}`;
    const dayOfWeek = (cells.length) % 7;
    cells.push({
      dayNumber: n,
      isoString: iso,
      isCurrentMonth: false,
      isWeekend: dayOfWeek === 5 || dayOfWeek === 6,
      isToday: iso === todayStr,
      isSelectedStart: iso === startDate,
      isSelectedEnd: iso === endDate,
      isInRange: !!(startDate && endDate && iso > startDate && iso < endDate),
    });
  }

  return (
    <div className="bg-slate-950/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl space-y-3 max-w-sm w-full select-none">
      {/* Header with Title and Fast Presets */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-bold text-white tracking-wide">
            {title}
          </span>
        </div>
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Réinitialiser</span>
          </button>
        )}
      </div>

      {/* Raccourcis Rapides en 1 Clic (Sans rien taper au clavier) */}
      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
        <button
          type="button"
          onClick={handleSelectThisWeekend}
          className="py-1.5 px-2 rounded-lg bg-orange-600/20 hover:bg-orange-600/35 text-orange-300 border border-orange-500/30 font-bold transition-all text-center flex items-center justify-center gap-1"
        >
          <span>🔥 Ce week-end</span>
        </button>
        <button
          type="button"
          onClick={handleSelectNextWeekend}
          className="py-1.5 px-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 border border-blue-500/30 font-bold transition-all text-center flex items-center justify-center gap-1"
        >
          <span>⏭️ Week-end +1</span>
        </button>
        <button
          type="button"
          onClick={handleSelectThisMonth}
          className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-all text-center flex items-center justify-center gap-1"
        >
          <span>📅 Tout le mois</span>
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
          title="Mois précédent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-bold text-slate-200 capitalize font-mono">
          {MONTHS_FR[currentMonth]} {currentYear}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
          title="Mois suivant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500">
        {DAYS_HEADER_FR.map((d, i) => (
          <div key={d} className={i >= 5 ? 'text-orange-400/80 font-bold' : ''}>
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const isSelected = cell.isSelectedStart || cell.isSelectedEnd;
          
          let btnClass = 'h-7 text-xs rounded-lg flex items-center justify-center font-mono relative transition-all ';

          if (isSelected) {
            btnClass += 'bg-orange-500 text-white font-black shadow-md shadow-orange-500/40 scale-105 z-10 ';
          } else if (cell.isInRange) {
            btnClass += 'bg-orange-500/25 text-orange-200 font-bold ';
          } else if (!cell.isCurrentMonth) {
            btnClass += 'text-slate-600 hover:bg-slate-900/60 ';
          } else if (cell.isWeekend) {
            btnClass += 'text-orange-300/90 font-semibold bg-slate-900/40 hover:bg-slate-800 hover:text-white ';
          } else {
            btnClass += 'text-slate-300 hover:bg-slate-800 hover:text-white ';
          }

          if (cell.isToday && !isSelected) {
            btnClass += 'ring-1 ring-blue-400 font-bold text-blue-300 ';
          }

          return (
            <button
              key={cell.isoString}
              type="button"
              onClick={() => handleDayClick(cell.isoString)}
              className={btnClass}
              title={cell.isoString}
            >
              {cell.dayNumber}
              {cell.isToday && !isSelected && (
                <span className="absolute bottom-0.5 w-1 h-1 bg-blue-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Range Summary Display (In French, zero typing needed) */}
      <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80 text-[11px] space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-[10px]">
          <span>Plage sélectionnée :</span>
          {startDate && !endDate && (
            <span className="text-amber-400 animate-pulse font-medium">
              Cliquez sur la date de fin...
            </span>
          )}
          {startDate && endDate && (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Période active
            </span>
          )}
        </div>
        <div className="font-medium text-slate-200 truncate">
          {startDate && endDate ? (
            <span>
              Du <strong className="text-orange-400">{formatDateToReadableFrench(startDate)}</strong> au{' '}
              <strong className="text-orange-400">{formatDateToReadableFrench(endDate)}</strong>
            </span>
          ) : startDate ? (
            <span>
              À partir du <strong className="text-orange-400">{formatDateToReadableFrench(startDate)}</strong>
            </span>
          ) : (
            <span className="text-slate-500 italic">
              Aucune restriction (Tous les matchs de la saison)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

interface SingleDatePickerProps {
  value: string;
  onChange: (formattedFrench: string, isoDate: string) => void;
  placeholder?: string;
  className?: string;
}

export const SingleDatePicker: React.FC<SingleDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Sélectionner une date...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState<number>(() => {
    const d = new Date();
    return d.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    const d = new Date();
    return d.getMonth();
  });

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const handleSelectDay = (y: number, m: number, d: number) => {
    const iso = `${y}-${pad2(m + 1)}-${pad2(d)}`;
    const french = formatDateToReadableFrench(iso);
    onChange(french, iso);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const t = new Date();
    handleSelectDay(t.getFullYear(), t.getMonth(), t.getDate());
  };

  const handleSelectNextSaturday = () => {
    const t = new Date();
    const day = t.getDay();
    const diff = (6 - day + 7) % 7 || 7;
    const sat = new Date(t);
    sat.setDate(t.getDate() + diff);
    handleSelectDay(sat.getFullYear(), sat.getMonth(), sat.getDate());
  };

  const handleSelectNextSunday = () => {
    const t = new Date();
    const day = t.getDay();
    const diff = (7 - day) % 7 || 7;
    const sun = new Date(t);
    sun.setDate(t.getDate() + diff);
    handleSelectDay(sun.getFullYear(), sun.getMonth(), sun.getDate());
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950 border border-slate-700 hover:border-orange-500/80 rounded-xl px-3 py-2 text-xs text-white flex items-center justify-between gap-2 transition-all text-left"
      >
        <span className={value ? 'text-slate-100 font-medium truncate' : 'text-slate-500'}>
          {value || placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-orange-400 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 z-50 bg-slate-950 border border-slate-700 rounded-2xl p-3 shadow-2xl space-y-2.5 w-64 select-none">
            {/* Quick shortcuts */}
            <div className="grid grid-cols-3 gap-1 text-[9px]">
              <button
                type="button"
                onClick={handleSelectToday}
                className="py-1 px-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-slate-800 text-center"
              >
                Aujourd'hui
              </button>
              <button
                type="button"
                onClick={handleSelectNextSaturday}
                className="py-1 px-1.5 rounded bg-orange-950/40 hover:bg-orange-900/60 text-orange-300 font-bold border border-orange-500/30 text-center"
              >
                Samedi
              </button>
              <button
                type="button"
                onClick={handleSelectNextSunday}
                className="py-1 px-1.5 rounded bg-orange-950/40 hover:bg-orange-900/60 text-orange-300 font-bold border border-orange-500/30 text-center"
              >
                Dimanche
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold text-slate-200 capitalize font-mono">
                {MONTHS_FR[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-500">
              {DAYS_HEADER_FR.map((d, i) => (
                <div key={d} className={i >= 5 ? 'text-orange-400 font-bold' : ''}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Prev month */}
              {Array.from({ length: firstDayIndex }).map((_, i) => {
                const dayNum = prevMonthDays - firstDayIndex + 1 + i;
                const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
                const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
                return (
                  <button
                    key={`prev-${i}`}
                    type="button"
                    onClick={() => handleSelectDay(prevY, prevM, dayNum)}
                    className="h-6 text-[10px] text-slate-600 hover:bg-slate-900 rounded font-mono"
                  >
                    {dayNum}
                  </button>
                );
              })}

              {/* Current month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const dayOfWeek = (firstDayIndex + i) % 7;
                const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
                return (
                  <button
                    key={`curr-${d}`}
                    type="button"
                    onClick={() => handleSelectDay(currentYear, currentMonth, d)}
                    className={`h-6 text-[10px] rounded font-mono transition-colors ${
                      isWeekend
                        ? 'text-orange-300 font-bold hover:bg-orange-600 hover:text-white'
                        : 'text-slate-200 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
