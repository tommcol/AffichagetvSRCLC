import assert from 'node:assert/strict';
import type { BirthdayItem, ClubSettings } from '../src/types';
import { publicTvData } from '../src/utils/publicTvData';

const member: BirthdayItem = {
  id: 'private-id',
  firstName: 'Camille',
  fullName: 'Camille NomPrivé',
  lastName: 'NomPrivé',
  birthDate: '2012-11-25',
  birthDayFormatted: '',
  teamCategory: 'U15',
  age: 14,
  photoUrl: '/uploads/photo-privee.jpg',
  isThisWeek: false,
};
const data = {
  version: 7,
  allMembers: [member, { ...member, id: 'next-week', birthDate: '2012-12-02' }],
  clubSettings: { name: 'Club', socialWebhookUrl: 'https://example.test/private' } as ClubSettings,
};
const result = publicTvData(data, new Date(2026, 10, 25, 12));
assert.equal(result.version, 7);
assert.equal(result.clubSettings?.name, 'Club');
assert.equal(result.birthdays?.length, 1);
assert.equal(result.birthdays?.[0].firstName, 'Camille');
assert.equal(result.birthdays?.[0].birthDate, '25/11');
assert.deepEqual(publicTvData(result, new Date(2026, 10, 25, 12)).birthdays, result.birthdays);
const serialized = JSON.stringify(result);
for (const privateValue of ['allMembers', 'NomPrivé', '2012', 'private-id', 'photo-privee', 'socialWebhookUrl']) {
  assert(!serialized.includes(privateValue), privateValue);
}
assert.equal(data.allMembers.length, 2);
console.log('Données TV : seuls les anniversaires utiles sont diffusés, sans données privées.');
