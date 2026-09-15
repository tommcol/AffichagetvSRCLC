import fs from 'fs';

async function run() {
  const start = 1;
  const end = 16000;
  const concurrency = 120;
  let current = start;
  let found = false;

  console.log(`🚀 Starting high-speed scanner for Clayette: range ${start}-${end} with concurrency ${concurrency}`);

  const next = async () => {
    if (found || current > end) return;
    const id = current++;

    if (id % 1000 === 0) {
      console.log(`[Progress] Scanned up to ID ${id}...`);
    }

    try {
      const res = await fetch(`https://ffbb-api.desimone.fr/api/v1/club/${id}`);
      if (res.ok) {
        const data = await res.json();
        const code = String(data.code || data.codeOrganisme || '');
        const name = String(data.libelle || data.nom || '');
        
        if (code.includes('0071024') || code.includes('71024') || name.toLowerCase().includes('clayette')) {
          found = true;
          console.log(`\n🎉🎉🎉 FOUND IT! ID: ${id}, Name: ${name}, Code: ${code}\n`);
          fs.writeFileSync('clayette_found.txt', `ID: ${id}\nName: ${name}\nCode: ${code}\n`);
          process.exit(0);
        }
      }
    } catch (err) {
      // Ignore errors
    }
    
    // Call next recursively to keep concurrency alive
    if (!found && current <= end) {
      await next();
    }
  };

  const promises = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(next());
  }
  await Promise.all(promises);
  console.log('Finished full scan range, not found.');
}

run();
