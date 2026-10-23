import React, { useEffect, useState } from 'react';

export function AdminAccess({ onAuthorized }: { onAuthorized: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let active = true;
    fetch('/api/verify-password').then(async response => {
      if (!response.ok) throw new Error('Impossible de vérifier l’accès administrateur.');
      const data = await response.json();
      if (active && (!data.required || data.authenticated)) onAuthorized();
    }).catch(e => active && setError(e.message)).finally(() => active && setChecking(false));
    return () => { active = false; };
  }, [onAuthorized]);
  if (checking) return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Vérification de l’accès…</main>;
  return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
    <form className="w-full max-w-md space-y-5" onSubmit={async event => {
      event.preventDefault(); setChecking(true); setError('');
      try {
        const response = await fetch('/api/verify-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
        if (!response.ok) throw new Error('Mot de passe incorrect ou accès indisponible.');
        setPassword(''); onAuthorized();
      } catch (e) { setError(e instanceof Error ? e.message : 'Connexion impossible'); }
      finally { setChecking(false); }
    }}>
      <h1 className="text-2xl font-bold">Administration de l’affichage TV</h1>
      <label className="block">Mot de passe
        <input className="block w-full rounded-lg bg-slate-800 p-3 mt-2" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
      </label>
      {error && <p role="alert" className="text-red-300">{error}</p>}
      <button disabled={checking} className="rounded-lg bg-orange-600 p-3 w-full">{checking ? 'Vérification…' : 'Ouvrir l’administration'}</button>
      <a href="?mode=tv" className="block underline text-center">Ouvrir la diffusion TV</a>
    </form>
  </main>;
}
