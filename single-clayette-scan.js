import fs from 'fs';

async function run() {
  const start = 1;
  const end = 9000;
  const concurrency = 50;
  let current = start;
  let found = false;

  fs.writeFileSync('progress.log', `Starting scan range ${start} to ${end} for Clayette...\n`);

  const next = async () => {
    if (found || current > end) return;
    const id = current++;
    
    if (id % 500 === 0) {
      fs.appendFileSync('progress.log', `Scanned up to ID ${id}...\n`);
    }

    try {
      const res = await fetch(`https://ffbb-api.desimone.fr/api/v1/club/${id}`);
      if (res.ok) {
        const data = await res.json();
        const code = data.code || data.codeOrganisme || '';
        const name = data.libelle || data.nom || '';
        
        if (code.includes('0071024') || code.includes('71024') || name.toLowerCase().includes('clayette')) {
          found = true;
          const resultStr = `🎉🎉🎉 FOUND IT! ID: ${id}, Name: ${name}, Code: ${code}`;
          fs.writeFileSync('clayette.log', resultStr + '\n');
          console.log(resultStr);
          process.exit(0);
        }
      }
    } catch (err) {}
    next();
  };

  const promises = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(next());
  }
  await Promise.all(promises);
  fs.appendFileSync('progress.log', 'Finished range 1-9000, not found.\n');
}

run();
