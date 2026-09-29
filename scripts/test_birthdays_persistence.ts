import {
  filterAndSortBirthdaysForWeek,
  sortBirthdaysByHierarchy,
  formatFrenchBirthday,
  getWeekBounds,
} from '../src/utils/excelBirthdayParser';
import { BirthdayItem } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('================================================================');
console.log('TEST SUITE: PERSISTANCE ET CYCLE DE VIE DES ANNIVERSAIRES & MEMBRES');
console.log('================================================================\n');

// Données initiales simulées (ex. importées d'un fichier Excel)
const importedExcelMembers: BirthdayItem[] = [
  {
    id: 'lic-001',
    firstName: 'Thomas',
    fullName: 'Thomas DUPONT',
    teamCategory: 'U15M',
    birthDate: '2010-09-30', // Fin septembre
    birthDayFormatted: '30 septembre',
    isThisWeek: true,
  },
  {
    id: 'lic-002',
    firstName: 'Camille',
    fullName: 'Camille MARTIN',
    teamCategory: 'U13F',
    birthDate: '2012-10-05', // Début octobre (semaine suivante)
    birthDayFormatted: '05 octobre',
    isThisWeek: false,
  },
  {
    id: 'lic-003',
    firstName: 'Lucas',
    fullName: 'Lucas BERNARD',
    teamCategory: 'Seniors M',
    birthDate: '1998-12-15', // Décembre
    birthDayFormatted: '15 décembre',
    isThisWeek: false,
  },
];

// Test 1: Simulation de l'état principal après import Excel
let mainAllMembersState: BirthdayItem[] = [];
let tvBirthdaysState: BirthdayItem[] = [];

// Date de référence : Mardi 29 Septembre 2026
const refDate = new Date('2026-09-29T10:00:00Z');

// 1. Simulation de l'import Excel
mainAllMembersState = sortBirthdaysByHierarchy(importedExcelMembers);
tvBirthdaysState = filterAndSortBirthdaysForWeek(mainAllMembersState, refDate, 0);

assert(mainAllMembersState.length === 3, 'État principal allMembers contient les 3 licenciés importés');
assert(tvBirthdaysState.length === 1 && tvBirthdaysState[0].firstName === 'Thomas', 'Seul Thomas est sélectionné pour la semaine en cours (0)');

// Test 2: Changement de semaine (Semaine +1)
const nextWeekBirthdays = filterAndSortBirthdaysForWeek(mainAllMembersState, refDate, 1);
assert(nextWeekBirthdays.length === 1 && nextWeekBirthdays[0].firstName === 'Camille', 'La semaine +1 sélectionne correctement Camille (05 octobre)');

// Test 3: Ajout manuel d'un licencié dans le pool complet
const newManualMember: BirthdayItem = {
  id: 'bday-manual-1234',
  firstName: 'Sarah',
  fullName: 'Sarah LEROY',
  teamCategory: 'U17F',
  birthDate: '2009-10-01', // Cette semaine
  birthDayFormatted: '01 octobre',
  isThisWeek: true,
};

mainAllMembersState = sortBirthdaysByHierarchy([newManualMember, ...mainAllMembersState]);
tvBirthdaysState = filterAndSortBirthdaysForWeek(mainAllMembersState, refDate, 0);

assert(mainAllMembersState.length === 4, 'Le pool principal allMembers contient maintenant 4 licenciés');
assert(tvBirthdaysState.length === 2, 'La semaine courante contient maintenant 2 anniversaires (Thomas et Sarah)');

// Test 4: Modification d'un licencié
mainAllMembersState = mainAllMembersState.map((m) =>
  m.id === 'lic-001' ? { ...m, firstName: 'Tommy', fullName: 'Tommy DUPONT' } : m
);
tvBirthdaysState = filterAndSortBirthdaysForWeek(mainAllMembersState, refDate, 0);

assert(mainAllMembersState.find((m) => m.id === 'lic-001')?.firstName === 'Tommy', 'Le prénom modifié est conservé dans allMembers');
assert(tvBirthdaysState.find((m) => m.id === 'lic-001')?.firstName === 'Tommy', 'Le prénom modifié est répercuté sur la TV');

// Test 5: Suppression d'un licencié
mainAllMembersState = mainAllMembersState.filter((m) => m.id !== 'lic-003');
assert(mainAllMembersState.length === 3, 'Le licencié supprimé n’est plus dans le pool principal allMembers');

// Test 6: Simulation du payload envoyé à /api/save-app-data (Cloudflare KV)
const cloudflareSavePayload = {
  data: {
    clubSettings: { name: 'SRC Basket' },
    allMembers: mainAllMembersState,
    birthdays: tvBirthdaysState,
  },
};

const serialized = JSON.stringify(cloudflareSavePayload);
assert(serialized.includes('Tommy') && serialized.includes('Sarah') && serialized.includes('Camille'), 'Le payload de sauvegarde Cloudflare contient bien tous les licenciés');

// Test 7: Simulation d’un 2e navigateur (aucun localStorage, restauration depuis la réponse Cloudflare KV)
const serverResponseData = JSON.parse(serialized).data;
let secondBrowserAllMembers: BirthdayItem[] = [];
let secondBrowserTvBirthdays: BirthdayItem[] = [];

if (serverResponseData.allMembers && Array.isArray(serverResponseData.allMembers)) {
  secondBrowserAllMembers = serverResponseData.allMembers;
  secondBrowserTvBirthdays = filterAndSortBirthdaysForWeek(secondBrowserAllMembers, refDate, 0);
}

assert(secondBrowserAllMembers.length === 3, 'Le 2e navigateur restaure exactement les 3 licenciés depuis le serveur');
assert(secondBrowserTvBirthdays.length === 2, 'Le 2e navigateur calcule correctement les 2 anniversaires TV de la semaine');

console.log('\n================================================================');
console.log('TOUS LES TESTS DE PERSISTANCE DES ANNIVERSAIRES ONT RÉUSSI (8/8) !');
console.log('================================================================');
