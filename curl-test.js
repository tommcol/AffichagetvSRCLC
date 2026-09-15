import { execSync } from 'child_process';

try {
  console.log('Fetching Clermont using curl...');
  const start = Date.now();
  const stdout = execSync('curl -s "https://ffbb-api.desimone.fr/api/v1/club/9326"', { encoding: 'utf8' });
  const data = JSON.parse(stdout);
  console.log(`Club: ${data.nom || data.libelle}`);
  console.log(`Time taken: ${Date.now() - start}ms`);
} catch (err) {
  console.log(`Error: ${err.message}`);
}
