import { MatchItem } from '../types';
import { getMatchTimingStatus } from './matchStatus';

export const applyMatchTimingStatuses = (
  matches: MatchItem[],
  now = new Date()
): MatchItem[] =>
  matches.map((match) => {
    const nextStatus = getMatchTimingStatus(match, now);
    return nextStatus === match.status
      ? match
      : {
          ...match,
          status: nextStatus,
        };
  });
