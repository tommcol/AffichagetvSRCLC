import { FFBBTeamItem } from '../../types';

/**
 * Constantes partagées de l'AdminPanel, extraites lors du découpage du fichier.
 */
export const formatDateToEuropean = (dateStr: string): string => {
  if (!dateStr) return '';
  const cleaned = dateStr.trim();
  
  // Try to match YYYY-MM-DD format
  const yyyymmdd = cleaned.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (yyyymmdd) {
    return `${yyyymmdd[3]}/${yyyymmdd[2]}/${yyyymmdd[1]}`;
  }

  // Try to match DD-MM-YYYY or DD/MM/YYYY
  const dd_mm_yyyy = cleaned.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dd_mm_yyyy) {
    return `${dd_mm_yyyy[1]}/${dd_mm_yyyy[2]}/${dd_mm_yyyy[3]}`;
  }

  return cleaned;
};

export const DEFAULT_REAL_FFBB_TEAMS: FFBBTeamItem[] = [
  {
    id: 'team-200000005335541',
    name: 'Seniors Filles 1',
    category: 'Seniors F1',
    gender: 'F',
    competition: 'Départementale féminine seniors - Division 3',
    poule: 'Poule C',
    pouleId: '200000003054576',
    matchesCount: 22,
    status: 'active',
  },
  {
    id: 'team-200000005335759',
    name: 'Seniors Garçons 1',
    category: 'Seniors M1',
    gender: 'M',
    competition: 'Départementale masculine seniors - Division 4',
    poule: 'Poule E',
    pouleId: '200000003054623',
    matchesCount: 16,
    status: 'active',
  },
  {
    id: 'team-200000005361201',
    name: 'U18 Filles 1',
    category: 'U18 F1',
    gender: 'F',
    competition: 'Départementale féminine U18 - Division 3',
    poule: 'Poule D',
    pouleId: '200000003058138',
    matchesCount: 5,
    status: 'active',
  },
  {
    id: 'team-200000005360595',
    name: 'U18 Garçons 1',
    category: 'U18 M1',
    gender: 'M',
    competition: 'Départementale masculine U18 - Division 3',
    poule: 'Poule D',
    pouleId: '200000003058058',
    matchesCount: 4,
    status: 'active',
  },
  {
    id: 'team-200000005361338',
    name: 'U15 Filles 1',
    category: 'U15 F1',
    gender: 'F',
    competition: 'Départementale féminine U15 - Division 3',
    poule: 'Poule D',
    pouleId: '200000003058157',
    matchesCount: 5,
    status: 'active',
  },
  {
    id: 'team-200000005360457',
    name: 'U13 Garçons 1',
    category: 'U13 M1',
    gender: 'M',
    competition: 'Départementale masculine U13 - Division 3',
    poule: 'Poule F',
    pouleId: '200000003058036',
    matchesCount: 5,
    status: 'active',
  },
  {
    id: 'team-200000005360524',
    name: 'U13 Filles 1',
    category: 'U13 F1',
    gender: 'F',
    competition: 'Départementale féminine U13 - Division 3',
    poule: 'Poule F',
    pouleId: '200000003058047',
    matchesCount: 8,
    status: 'active',
  },
  {
    id: 'team-200000005360525',
    name: 'U13 Filles 2',
    category: 'U13 F2',
    gender: 'F',
    competition: 'Départementale féminine U13 - Division 3',
    poule: 'Poule F',
    pouleId: '200000003058048',
    matchesCount: 8,
    status: 'active',
  },
  {
    id: 'team-200000005363537',
    name: 'U11 Filles 1',
    category: 'U11 F1',
    gender: 'F',
    competition: 'Départementale féminine U11 - Division 3',
    poule: 'Poule E',
    pouleId: '200000003058517',
    matchesCount: 5,
    status: 'active',
  },
  {
    id: 'team-200000005363354',
    name: 'U11 Garçons 1',
    category: 'U11 M1',
    gender: 'M',
    competition: 'Départementale masculine U11 - Division 3',
    poule: 'Poule F',
    pouleId: '200000003058489',
    matchesCount: 5,
    status: 'active',
  },
  {
    id: 'team-200000005363355',
    name: 'U9 Garçons / Mixte',
    category: 'U9 Mixte',
    gender: 'Mixte',
    competition: 'Plateaux Mini-Basket U9 - Secteur Mâconnais-Charolais',
    matchesCount: 6,
    status: 'active',
  },
  {
    id: 'team-200000005363356',
    name: 'U9 Filles 1',
    category: 'U9 F1',
    gender: 'F',
    competition: 'Plateaux Mini-Basket U9 Féminin',
    matchesCount: 6,
    status: 'active',
  },
  {
    id: 'team-200000005335760',
    name: 'Seniors Garçons 2',
    category: 'Seniors M2',
    gender: 'M',
    competition: 'Départementale masculine seniors - Division 5',
    matchesCount: 14,
    status: 'active',
  },
];
