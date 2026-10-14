import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

// Lance tous les scripts de test du dossier scripts/ (fichiers test_*.ts)
const files = readdirSync('scripts')
  .filter((f) => f.startsWith('test_') && f.endsWith('.ts'))
  .sort();

if (files.length === 0) {
  console.error('Aucun fichier de test trouvé dans scripts/');
  process.exit(1);
}

console.log(`Lancement de ${files.length} suites de tests...\n`);

const failures: string[] = [];
for (const file of files) {
  console.log('--------------------------------------------------');
  console.log(`> ${file}`);
  const result = spawnSync('npx', ['tsx', `scripts/${file}`], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    failures.push(file);
    console.error(`\u274C \u00c9CHEC : ${file}`);
  } else {
    console.log(`\u2705 OK : ${file}`);
  }
}

console.log('==================================================');
if (failures.length > 0) {
  console.error(`\nR\u00e9sultat : ${files.length - failures.length}/${files.length} suites OK`);
  console.error('Suites en \u00e9chec :');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`\nR\u00e9sultat : ${files.length}/${files.length} suites OK \ud83c\udf89`);
