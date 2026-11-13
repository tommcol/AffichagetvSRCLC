import { MatchItem } from '../../types';
import { isExemptItem } from '../../utils/socialCaptionGenerator';
import { isClubHomeMatch } from '../../utils/matchStatus';
export type FixtureScope = 'all' | 'home' | 'away' | 'exempt';
export function inFixtureScope(item: MatchItem, scope: FixtureScope) {
  if (scope === 'all') return true;
  const exempt = isExemptItem(item);
  if (scope === 'exempt') return exempt;
  return !exempt && (scope === 'home' ? isClubHomeMatch(item) : !isClubHomeMatch(item));
}
export function FixtureScopeFilter({ items, value, onChange }: { items: MatchItem[]; value: FixtureScope; onChange: (scope: FixtureScope) => void }) {
  return <div role="group" aria-label="Filtrer les rencontres" className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-900">
    {([['all', 'Tous'], ['home', 'Domicile'], ['away', 'Extérieur'], ['exempt', 'Exempts']] as const).map(([scope, label]) =>
      <button type="button" key={scope} aria-pressed={value === scope} onClick={() => onChange(scope)}
        className={`rounded-lg px-3 py-2 text-xs font-bold ${value === scope ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
        {label} ({items.filter(item => inFixtureScope(item, scope)).length})
      </button>)}
  </div>;
}
