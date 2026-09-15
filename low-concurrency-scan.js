async function run() {
  const start = 1;
  const end = 12000;
  const concurrency = 15;
  let current = start;
  let found = false;

  console.log(`Starting scan with concurrency ${concurrency} and timeout...`);

  const next = async () => {
    if (found || current > end) return;
    const id = current++;

    if (id % 500 === 0) {
      console.log(`[Progress] Scanned up to ID ${id}...`);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const res = await fetch(`https://ffbb-api.desimone.fr/api/v1/club/${id}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const code = String(data.code || data.codeOrganisme || '');
        const name = String(data.libelle || data.nom || '');
        
        if (code.includes('0071') || name.toLowerCase().includes('clayette')) {
          console.log(`📌 Found Dept 71: ID ${id} -> ${name} (${code})`);
          if (name.toLowerCase().includes('clayette') || code.includes('71024')) {
            found = true;
            console.log(`\n🎉🎉🎉 FOUND IT! ID: ${id}, Name: ${name}, Code: ${code}\n`);
            process.exit(0);
          }
        }
      }
    } catch (err) {
      console.log(`ID ${id} error: ${err.message}`);
    }
    
    if (!found && current <= end) {
      next();
    }
  };

  const promises = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(next());
  }
  await Promise.all(promises);
  console.log('Finished range.');
}

run();
