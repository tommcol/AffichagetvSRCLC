/**
 * Formate le titre dynamique d'une alerte Victoire / Défaite en remplaçant
 * la variable {CATEGORIE} par le nom de l'équipe concernée (ex: U13 M1, Seniors F1).
 * Préserve explicitement les retours à la ligne saisis par l'utilisateur.
 */
export function formatAlertTitle(
  template: string | undefined,
  isWin: boolean,
  team: string
): string {
  const defaultTemplate = isWin ? 'VICTOIRE DES {CATEGORIE}' : 'DÉFAITE DES {CATEGORIE}';
  let text = template && template.trim().length > 0 ? template : defaultTemplate;

  // Rétrocompatibilité avec les anciens titres statiques simples ("VICTOIRE !", "DÉFAITE")
  const trimmed = text.trim();
  if (trimmed === 'VICTOIRE !' || trimmed === 'VICTOIRE') {
    text = 'VICTOIRE DES {CATEGORIE}';
  } else if (trimmed === 'DÉFAITE' || trimmed === 'DÉFAITE !') {
    text = 'DÉFAITE DES {CATEGORIE}';
  }

  const cleanTeam = (team || '').trim();
  if (/\{cat[eé]gorie\}/i.test(text)) {
    return text.replace(/\{cat[eé]gorie\}/gi, cleanTeam);
  }

  return text;
}
