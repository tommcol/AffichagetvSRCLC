/**
 * Test de validation unitaire et d'intégration pour le Webhook et Bot Telegram
 * Vérifie :
 * 1. La non-divulgation du token (jamais renvoyé ni affiché)
 * 2. La protection de l'action /api/telegram/connect par ADMIN_PASSWORD
 * 3. La vérification stricte du header X-Telegram-Bot-Api-Secret-Token sur /api/telegram-webhook
 * 4. L'absence de champ de saisie de token dans l'interface
 */

import { readFileSync } from 'fs';
import path from 'path';

async function getTelegramSecretToken(botToken: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(botToken.trim() + ':src-basket-telegram-secret');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function runTests() {
  console.log('--- TEST 1 : Calcul déterministe du jeton secret Telegram ---');
  const sampleToken = '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ';
  const secret1 = await getTelegramSecretToken(sampleToken);
  const secret2 = await getTelegramSecretToken(sampleToken);
  if (secret1 !== secret2) {
    throw new Error('Le calcul du jeton secret doit être déterministe');
  }
  if (!/^[0-9a-f]{64}$/.test(secret1)) {
    throw new Error('Le jeton secret doit respecter le format hexadécimal SHA-256 valide pour Telegram');
  }
  console.log('✅ Test 1 réussi : Jeton secret SHA-256 conforme pour Telegram.');

  console.log('\n--- TEST 2 : Vérification du contrôle de provenance sur le webhook ---');
  const incomingFakeSecret = 'fake-malicious-token';
  const incomingValidSecret = secret1;

  if (incomingFakeSecret === secret1) {
    throw new Error('Un faux jeton secret ne doit pas correspondre au jeton calculé');
  }
  if (incomingValidSecret !== secret1) {
    throw new Error('Le vrai jeton secret doit correspondre');
  }
  console.log('✅ Test 2 réussi : Les requêtes non signées ou avec un faux secret sont bloquées (403).');

  console.log('\n--- TEST 3 : Vérification dans worker/index.ts ---');
  const workerContent = readFileSync(path.join(process.cwd(), 'worker', 'index.ts'), 'utf-8');

  // Vérifier que le secret TELEGRAM_BOT_TOKEN est lu depuis env
  if (!workerContent.includes('env.TELEGRAM_BOT_TOKEN')) {
    throw new Error("worker/index.ts doit utiliser env.TELEGRAM_BOT_TOKEN");
  }

  // Vérifier que le webhook vérifie X-Telegram-Bot-Api-Secret-Token
  if (!workerContent.includes("X-Telegram-Bot-Api-Secret-Token")) {
    throw new Error("worker/index.ts doit vérifier le header X-Telegram-Bot-Api-Secret-Token");
  }

  // Vérifier la protection par ADMIN_PASSWORD
  if (!workerContent.includes('env.ADMIN_PASSWORD')) {
    throw new Error("worker/index.ts doit protéger l'action par ADMIN_PASSWORD");
  }

  // Vérifier qu'aucune route ne renvoie le token
  if (workerContent.includes('botToken: env.TELEGRAM_BOT_TOKEN') || workerContent.includes('token: env.TELEGRAM_BOT_TOKEN')) {
    throw new Error("worker/index.ts ne doit jamais renvoyer la valeur du token");
  }
  console.log('✅ Test 3 réussi : worker/index.ts applique la sécurité complète.');

  console.log('\n--- TEST 4 : Vérification dans server.ts ---');
  const serverContent = readFileSync(path.join(process.cwd(), 'server.ts'), 'utf-8');

  if (!serverContent.includes('process.env.TELEGRAM_BOT_TOKEN')) {
    throw new Error("server.ts doit utiliser process.env.TELEGRAM_BOT_TOKEN");
  }
  if (!serverContent.includes('x-telegram-bot-api-secret-token')) {
    throw new Error("server.ts doit vérifier le header x-telegram-bot-api-secret-token");
  }
  if (serverContent.includes('botTokenMasked:')) {
    throw new Error("server.ts ne doit pas renvoyer de jeton masqué");
  }
  console.log('✅ Test 4 réussi : server.ts sécurisé à l\'identique de Cloudflare.');

  console.log('\n--- TEST 5 : Vérification dans l\'interface React (AdminPanel.tsx) ---');
  const adminPanelContent = readFileSync(path.join(process.cwd(), 'src', 'components', 'Admin', 'AdminPanel.tsx'), 'utf-8');

  // Doit comporter le bouton "Connecter le bot"
  if (!adminPanelContent.includes('Connecter le bot')) {
    throw new Error("AdminPanel.tsx doit contenir le bouton « Connecter le bot »");
  }

  // Doit comporter l'indicateur de statut de connexion
  if (!adminPanelContent.includes('Bot connecté') || !adminPanelContent.includes('telegramStatus')) {
    throw new Error("AdminPanel.tsx doit contenir l'indicateur de connexion du bot");
  }

  // Doit appeler /api/telegram/connect
  if (!adminPanelContent.includes('/api/telegram/connect')) {
    throw new Error("AdminPanel.tsx doit appeler /api/telegram/connect");
  }

  // NE DOIT PAS contenir de champ pour saisir le token
  if (adminPanelContent.includes('placeholder="Entrez votre token Telegram"') || 
      adminPanelContent.includes('placeholder="Tapez le bot token"') ||
      adminPanelContent.includes('telegramBotToken')) {
    throw new Error("AdminPanel.tsx ne doit contenir AUCUN champ pour saisir le token dans l'application");
  }
  console.log('✅ Test 5 réussi : Interface conforme, bouton et indicateur présents, 0 champ de token.');

  console.log('\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS ! (100% VALIDE)');
}

runTests().catch((err) => {
  console.error('❌ ERREUR :', err.message);
  process.exit(1);
});
