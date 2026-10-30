import type { MatchItem } from '../types';
import { getMatchOurAndOpponentScores } from './matchStatus';

/** Display order only: never change the official home/away fields or scores. */
export function getClubFirstMatchPresentation(match: MatchItem, clubName?: string, shortName?: string, exempt = false) {
  const { isHome, ourScore, oppScore } = getMatchOurAndOpponentScores(match, clubName, shortName);
  return {
    isHome,
    teamLeft: match.category || match.ourClubName || clubName || 'Notre Club',
    teamRight: exempt ? 'Exempt' : (isHome ? match.teamAway : match.teamHome) || 'Adversaire',
    ourScore,
    oppScore,
    scoreText: ourScore !== undefined && oppScore !== undefined ? `${ourScore} - ${oppScore}` : '',
  };
}
