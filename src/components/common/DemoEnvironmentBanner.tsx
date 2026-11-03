import React, { useEffect, useState } from 'react';

/** The server is authoritative: no label inferred from a hostname or build flag. */
export function DemoEnvironmentBanner() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/verify-password').then(async response => {
      if (!response.ok) return;
      const status = await response.json();
      if (active) setDemo(status.demo === true);
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  if (!demo) return null;
  return <aside role="status" className="bg-amber-300 text-slate-950 px-3 py-2 text-center text-sm font-bold border-b-2 border-amber-600">
    LABORATOIRE — Données fictives · Sauvegardes et médias séparés · FFBB, Telegram et publications désactivés
  </aside>;
}
