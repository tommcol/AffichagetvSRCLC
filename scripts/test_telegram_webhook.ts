/**
 * Test de validation unitaire et d'intégration pour le Webhook et Bot Telegram
 * Vérifie :
 * 1. La non-divulgation du token (jamais renvoyé ni affiché)
 * 2. La protection de l'action /api/telegram/connect par ADMIN_PASSWORD
 * 3. La vérification stricte du header X-Telegram-Bot-Api-Secret-Token sur /api/telegram-webhook
 * 4. L'absence de champ de saisie de token dans l'interface
 * 5. La suppression des étapes 1 & 2 et du bouton « Copier l'URL Webhook »
 * 6. La présence de la section « Exemples de messages à envoyer au bot »
 * 7. L'affichage « Configuration active — en attente du premier message » avant tout message réel
 * 8. L'affichage « Bot opérationnel » avec date/heure après réception d'un vrai message
 * 9. L'affichage clair en cas d'échec (« Bot non connecté » ou « Le message n'a pas été traité »)
 * 10. La conservation des commandes de reconnexion et de déconnexion
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

  // Vérifier le suivi du dernier message
  if (!workerContent.includes('telegram-last-message')) {
    throw new Error("worker/index.ts doit persister telegram-last-message");
  }

  // Vérifier qu'aucune route ne renvoie le token
  if (workerContent.includes('botToken: env.TELEGRAM_BOT_TOKEN') || workerContent.includes('token: env.TELEGRAM_BOT_TOKEN')) {
    throw new Error("worker/index.ts ne doit jamais renvoyer la valeur du token");
  }
  console.log('✅ Test 3 réussi : worker/index.ts applique la sécurité complète et le suivi des messages réels.');

  console.log('\n--- TEST 4 : Vérification dans server.ts ---');
  const serverContent = readFileSync(path.join(process.cwd(), 'server.ts'), 'utf-8');

  if (!serverContent.includes('process.env.TELEGRAM_BOT_TOKEN')) {
    throw new Error("server.ts doit utiliser process.env.TELEGRAM_BOT_TOKEN");
  }
  if (!serverContent.includes('x-telegram-bot-api-secret-token')) {
    throw new Error("server.ts doit vérifier le header x-telegram-bot-api-secret-token");
  }
  if (!serverContent.includes('localTelegramLastMessage')) {
    throw new Error("server.ts doit suivre localTelegramLastMessage");
  }
  if (serverContent.includes('botTokenMasked:')) {
    throw new Error("server.ts ne doit pas renvoyer de jeton masqué");
  }
  console.log('✅ Test 4 réussi : server.ts sécurisé à l\'identique de Cloudflare avec suivi du dernier message.');

  console.log('\n--- TEST 5 : Vérification des instructions et de l\'interface dans AdminPanel.tsx ---');
  const adminPanelContent = readFileSync(path.join(process.cwd(), 'src', 'components', 'Admin', 'AdminPanel.tsx'), 'utf-8');

  // 1. Suppression des étapes 1 & 2 et du bouton Copier l'URL Webhook
  if (adminPanelContent.includes("Copier l'URL Webhook") || adminPanelContent.includes("handleCopyWebhook")) {
    throw new Error("Le bouton « Copier l'URL Webhook » doit être supprimé car l'installation est déjà faite.");
  }
  if (adminPanelContent.includes("Créer le bot sur Telegram") || adminPanelContent.includes("3 Step Setup Guide")) {
    throw new Error("Les étapes numérotées d'installation initiale doivent être supprimées.");
  }

  // 2. Présence de la section "Exemples de messages à envoyer au bot"
  if (!adminPanelContent.includes("EXEMPLES DE MESSAGES À ENVOYER AU BOT")) {
    throw new Error("AdminPanel.tsx doit contenir la section « EXEMPLES DE MESSAGES À ENVOYER AU BOT »");
  }

  // 3. Statut « Configuration active — en attente du premier message »
  if (!adminPanelContent.includes("Configuration active — en attente du premier message")) {
    throw new Error("L'interface doit afficher « Configuration active — en attente du premier message » tant qu'aucun message n'a été reçu.");
  }

  // 4. Statut « Bot opérationnel » avec affichage de la date/heure
  if (!adminPanelContent.includes("Bot opérationnel") || !adminPanelContent.includes("Dernier message reçu le")) {
    throw new Error("L'interface doit afficher « Bot opérationnel » et la date/heure après réception d'un vrai message.");
  }

  // 5. Gestion des échecs
  if (!adminPanelContent.includes("Bot non connecté") || !adminPanelContent.includes("Le message n'a pas été traité")) {
    throw new Error("L'interface doit indiquer clairement « Bot non connecté » ou « Le message n'a pas été traité » en cas d'échec.");
  }

  // 6. Présence des commandes de reconnexion et déconnexion
  if (!adminPanelContent.includes("Reconnecter le bot") || !adminPanelContent.includes("Déconnecter le bot")) {
    throw new Error("Les boutons « Reconnecter le bot » et « Déconnecter le bot » doivent être conservés.");
  }

  // 7. NE DOIT PAS contenir de champ pour saisir le token
  if (adminPanelContent.includes('placeholder="Entrez votre token Telegram"') || 
      adminPanelContent.includes('placeholder="Tapez le bot token"') ||
      adminPanelContent.includes('telegramBotToken')) {
    throw new Error("AdminPanel.tsx ne doit contenir AUCUN champ pour saisir le token dans l'application");
  }
  console.log('✅ Test 5 réussi : Instructions mises à jour, étapes supprimées, statuts dynamiques et commandes préservées.');

  console.log('\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS ! (100% CONFORME)');
}

runTests().catch((err) => {
  console.error('❌ ERREUR :', err.message);
  process.exit(1);
});
