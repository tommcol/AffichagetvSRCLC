import type { FFBBTeamItem } from '../types';
import { normalizeCategoryKey } from './ffbbCategory';

// Only a structured category identifies a squad. Never guess from a custom name
// or a division: division and engagement identifiers may change between phases.
function squadKey(team: FFBBTeamItem): string {
  const category = normalizeCategoryKey(team.category);
  if (!/^(U\d+|SENIORS) [MF]?\d+$/.test(category)) return `id:${team.id}`;
  return `${team.season || ''}|${team.gender}|${category}`;
}
const ids = (team: FFBBTeamItem) => [...new Set([team.id, ...(team.engagementIds || [])])];
const phase = (team: FFBBTeamItem) => Number(team.competition.match(/phase\s*(\d+)/i)?.[1] || 1);

/** One card per squad, retaining all FFBB engagement IDs and the saved identity.
 * Only combines the supplied current inventory; never removes matches/results.
 */
export function groupFfbbTeams(
  incoming: FFBBTeamItem[],
  previous: FFBBTeamItem[] = [],
  customNames: Record<string, string> = {},
): FFBBTeamItem[] {
  const groups = new Map<string, FFBBTeamItem[]>();
  for (const team of incoming) {
    const key = squadKey(team);
    const group = groups.get(key) || [];
    if (!group.some(t => t.id === team.id)) group.push(team);
    groups.set(key, group);
  }
  return [...groups.entries()].map(([key, group]) => {
    const currentIds = new Set(group.flatMap(ids));
    const saved = previous.filter(t => squadKey(t) === key || ids(t).some(id => currentIds.has(id)));
    const identity = saved[0] || group[0];
    const latest = group.reduce((a,b) => phase(b) > phase(a) ? b : a);
    const allIds = [...new Set([...ids(identity), ...group.flatMap(ids), ...saved.flatMap(ids)])];
    const customName = customNames[identity.id]
      || allIds.map(id => customNames[id]).find(Boolean)
      || customNames[identity.category] || customNames[normalizeCategoryKey(identity.category)]
      || saved.find(t => t.customName)?.customName || group.find(t => t.customName)?.customName;
    return {
      ...latest, id: identity.id, engagementIds: allIds,
      matchesCount: group.reduce((sum,t) => sum + t.matchesCount, 0),
      customName: customName || undefined,
    };
  });
}
