async function run() {
  const start = 1;
  const end = 30000;
  const concurrency = 150;
  let current = start;
  let found = false;

  console.log(`Searching 1 to 30000 for clubs in Department 71 (Saône-et-Loire)...`);

  const next = async () => {
    if (found || current > end) return;
    const id = current++;

    if (id % 2000 === 0) {
      console.log(`[Progress] Scanned up to ${id}...`);
    }

    try {
      const res = await fetch(`https://ffbb-api.desimone.fr/api/v1/club/${id}`);
      if (res.ok) {
        const data = await res.json();
        const code = String(data.code || data.codeOrganisme || '');
        const name = String(data.libelle || data.nom || '');
        
        if (code.includes('0071') || code.includes('71024') || name.toLowerCase().includes('clayette')) {
          console.log(`\n📌 Found Dept 71 Club: ID ${id} is ${name} (${code})`);
          if (name.toLowerCase().includes('clayette') || code.includes('71024')) {
            found = true;
            console.log(`\n🎉🎉🎉 FOUND TARGET! ID: ${id}, Name: ${name}, Code: ${code}\n`);
            process.exit(0);
          }
        }
      }
    } catch (err) {}
    
    if (!found && current <= end) {
      await next();
    }
  };

  const promises = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(next());
  }
  await Promise.all(promises);
  console.log('Finished search.');
}
run();
