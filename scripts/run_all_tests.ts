import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

// Durée maximale d'une suite de tests avant de la déclarer bloquante (secondes)
const TIMEOUT_SECONDS = 45;

// Lance tous les scripts de test du dossier scripts/ (fichiers test_*.ts)
const files = readdirSync('scripts')
  .filter((f) => f.startsWith('test_') && f.endsWith('.ts'))
  .sort();

if (files.length === 0) {
  console.error('Aucun fichier de test trouvé dans scripts/');
  process.exit(1);
}

console.log(`Lancement de ${files.length} suites de tests (max ${TIMEOUT_SECONDS}s par suite)...\n`);

const failures: string[] = [];
for (const file of files) {
  console.log('--------------------------------------------------');
  console.log(`> ${file}`);
  const result = spawnSync(process.execPath, ['--import', 'tsx', `scripts/${file}`], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    timeout: TIMEOUT_SECONDS * 1000,
    killSignal: 'SIGKILL',
  });
  const err = result.error as any;
  if (err && err.code === 'ETIMEDOUT') {
    failures.push(file);
    console.error('BLOQUÉ : ' + file + ' a dépassé ' + TIMEOUT_SECONDS + 's (test qui ne se termine jamais)');
    continue;
  }
  if (result.status !== 0) {
    failures.push(file);
    console.error('ÉCHEC : ' + file);
  } else {
    console.log('OK : ' + file);
  }
}

console.log('==================================================');
if (failures.length > 0) {
  console.error('Résultat : ' + (files.length - failures.length) + '/' + files.length + ' suites OK');
  console.error('Suites en échec ou bloquées :');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('Résultat : ' + files.length + '/' + files.length + ' suites OK 🎉');
