/** Keep an explicitly known bye until the same official fixture names a real opponent. */
export function knownExemptionTeams(previous: { teamHome?: string; teamAway?: string }, incoming: { teamHome?: string; teamAway?: string }) {
  const unknown = (name?: string) => !name?.trim() || /^adversaire inconnu$/i.test(name.trim());
  return {
    teamHome: unknown(incoming.teamHome) && /exempt/i.test(previous.teamHome || '') ? previous.teamHome : incoming.teamHome,
    teamAway: unknown(incoming.teamAway) && /exempt/i.test(previous.teamAway || '') ? previous.teamAway : incoming.teamAway,
  };
}
