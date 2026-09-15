import fs from 'fs';

async function run() {
  const start = 1;
  const end = 15000;
  const concurrency = 15;
  let current = start;
  let found = false;

  console.log(`Starting clean scan of IDs ${start} to ${end} with concurrency ${concurrency}...`);
  fs.writeFileSync('search_clayette.log', 'Scan started\n');

  const next = async () => {
    if (found || current > end) return;
    const id = current++;

    if (id % 500 === 0) {
      console.log(`[Progress] Scanned up to ID ${id}...`);
      fs.appendFileSync('search_clayette.log', `[Progress] Scanned up to ID ${id}...\n`);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
      
      const res = await fetch(`https://ffbb-api.desimone.fr/api/v1/club/${id}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const code = String(data.code || data.codeOrganisme || '');
        const name = String(data.nom || data.libelle || '');
        
        // Log any club in Department 71 to see progress and know it's working
        if (code.includes('071') || code.includes('71024') || name.toLowerCase().includes('clayette')) {
          const logMsg = `[FOUND DEPT 71] ID ${id}: ${name} (${code})`;
          console.log(logMsg);
          fs.appendFileSync('search_clayette.log', logMsg + '\n');
          
          if (name.toLowerCase().includes('clayette') || code.includes('71024')) {
            found = true;
            const successMsg = `\n🎉🎉🎉 TARGET FOUND! ID: ${id}, Name: ${name}, Code: ${code}\n`;
            console.log(successMsg);
            fs.appendFileSync('search_clayette.log', successMsg);
            fs.writeFileSync('clayette_found.txt', successMsg);
            process.exit(0);
          }
        }
      }
    } catch (err) {
      // Quietly ignore or log to file if needed
    }
    
    if (!found && current <= end) {
      await next();
    }
  };

  const promises = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(next());
  }
  await Promise.all(promises);
  console.log('Finished range, not found.');
  fs.appendFileSync('search_clayette.log', 'Finished range, not found.\n');
}

run();
