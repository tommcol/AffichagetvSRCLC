async function run() {
  const start = 9000;
  const end = 11000;
  const concurrency = 25;
  let current = start;

  const next = async () => {
    if (current > end) return;
    const id = current++;
    try {
      const res = await fetch(`https://ffbb-api.desimone.fr/api/v1/club/${id}`);
      if (res.ok) {
        const data = await res.json();
        const name = data.libelle || data.nom || '';
        const code = data.code || '';
        console.log(`ID ${id}: ${name} (${code})`);
        if (name.toLowerCase().includes('clayette') || code.includes('0071024') || code.includes('71024')) {
          console.log(`\n🎉🎉🎉 FOUND IT! ID ${id} is ${name}\n`);
          process.exit(0);
        }
      } else {
        console.log(`ID ${id}: Failed status ${res.status}`);
      }
    } catch (err) {
      console.log(`ID ${id}: Error ${err.message}`);
    }
    next();
  };

  const promises = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(next());
  }
  await Promise.all(promises);
}

run();
