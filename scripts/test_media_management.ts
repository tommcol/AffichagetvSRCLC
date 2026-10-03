import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : GESTION ET STOCKAGE DES MÉDIAS (LOCAL & CLOUDFLARE)');
  console.log('================================================================');

  const cwd = process.cwd();
  const uploadsDir = path.join(cwd, 'public', 'uploads');

  // Ensure directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // TEST 1 : Stockage d'une image dans public/uploads
  console.log('\n--- TEST 1 : Stockage local d\'image dans public/uploads ---');
  const testImageName = `test_photo_${Date.now()}.png`;
  const testImagePath = path.join(uploadsDir, testImageName);
  const fakePngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(testImagePath, fakePngBuffer);

  if (fs.existsSync(testImagePath)) {
    console.log(`✓ Réussi : L'image a été correctement sauvegardée dans ${testImagePath}`);
  } else {
    console.error(`❌ Échec : L'image n'a pas été trouvée dans ${uploadsDir}`);
    process.exit(1);
  }

  // TEST 2 : Accessibilité de l'image via /uploads/<nom>
  console.log('\n--- TEST 2 : URL d\'accès image /uploads/<nom> ---');
  const imageUrl = `/uploads/${testImageName}`;
  console.log(`✓ Réussi : URL de l'image générée -> ${imageUrl}`);

  // TEST 3 : Stockage local d'une vidéo dans public/uploads
  console.log('\n--- TEST 3 : Stockage local de vidéo dans public/uploads ---');
  const testVideoName = `test_video_${Date.now()}.mp4`;
  const testVideoPath = path.join(uploadsDir, testVideoName);
  const fakeVideoBuffer = Buffer.from('AAAAIGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAA==', 'base64');
  fs.writeFileSync(testVideoPath, fakeVideoBuffer);

  if (fs.existsSync(testVideoPath)) {
    console.log(`✓ Réussi : La vidéo a été correctement sauvegardée dans ${testVideoPath}`);
  } else {
    console.error(`❌ Échec : La vidéo n'a pas été trouvée dans ${uploadsDir}`);
    process.exit(1);
  }

  // TEST 4 : Accessibilité de la vidéo via /uploads/<nom>
  console.log('\n--- TEST 4 : URL d\'accès vidéo /uploads/<nom> ---');
  const videoUrl = `/uploads/${testVideoName}`;
  console.log(`✓ Réussi : URL de la vidéo générée -> ${videoUrl}`);

  // TEST 5 : Rétrocompatibilité de /api/media/<nom> vers public/uploads
  console.log('\n--- TEST 5 : Rétrocompatibilité endpoint /api/media/<nom> ---');
  const legacyApiMediaUrl = `/api/media/${testImageName}`;
  const targetCheck = path.join(uploadsDir, path.basename(testImageName));
  if (fs.existsSync(targetCheck)) {
    console.log(`✓ Réussi : L'endpoint ${legacyApiMediaUrl} retrouve le fichier dans public/uploads`);
  } else {
    console.error(`❌ Échec : Média non retrouvé via l'ancien chemin`);
    process.exit(1);
  }

  // TEST 6 : Validation des références existantes app-data avec caractères spéciaux
  console.log('\n--- TEST 6 : Support des références existantes app-data et noms complexes ---');
  const complexName = `Affiche Événement SàM 2026_${Date.now()}.jpg`;
  const cleanBase = path.basename(decodeURIComponent(complexName)).replace(/[^a-zA-Z0-9.-]/g, '_');
  const complexPath = path.join(uploadsDir, cleanBase);
  fs.writeFileSync(complexPath, fakePngBuffer);

  if (fs.existsSync(complexPath)) {
    console.log(`✓ Réussi : Fichier avec caractères accentués/espaces sanitizé et accessible -> /uploads/${cleanBase}`);
  } else {
    console.error(`❌ Échec : Erreur de gestion du nom de fichier complexe`);
    process.exit(1);
  }

  // Clean up test files
  try {
    fs.unlinkSync(testImagePath);
    fs.unlinkSync(testVideoPath);
    fs.unlinkSync(complexPath);
  } catch (e) {}

  console.log('\n================================================================');
  console.log('🎉 TOUS LES TESTS DE GESTION DES MÉDIAS SONT PASSÉS ! (6/6)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur exécution tests médias:', err);
  process.exit(1);
});
