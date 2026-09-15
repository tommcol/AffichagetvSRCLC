async function scan() {
  const startId = 1;
  const endId = 16000;
  const concurrencyLimit = 100;
  let currentId = startId;
  let activeRequests = 0;
  let found = false;

  console.log(`Starting fast concurrent scan from ID ${startId} to ${endId} (concurrency: ${concurrencyLimit})...`);

  return new Promise((resolve) => {
    function next() {
      if (found) return;
      if (currentId > endId && activeRequests === 0) {
        console.log('Finished scan, not found.');
        resolve();
        return;
      }

      while (activeRequests < concurrencyLimit && currentId <= endId && !found) {
        const id = currentId++;
        activeRequests++;

        // Periodically report progress
        if (id % 1000 === 0) {
          console.log(`Progress check: Scanned up to ID ${id}...`);
        }

        fetch(`https://ffbb-api.desimone.fr/api/v1/club/${id}`)
          .then(async (res) => {
            activeRequests--;
            if (res.ok) {
              const data = await res.json();
              const name = data.libelle || data.nom || data.nomOrganisme || data.libelleOrganisme || '';
              const code = data.code || data.codeOrganisme || '';
              if (
                name.toLowerCase().includes('clayette') || 
                name.toLowerCase().includes('clayettois') || 
                code.includes('0071024') || 
                code.includes('71024')
              ) {
                found = true;
                console.log(`\n🎉 FOUND CLUB! ID: ${id}, Name: ${name}, Code: ${code}\n`);
                process.exit(0);
              }
            }
            next();
          })
          .catch(() => {
            activeRequests--;
            next();
          });
      }
    }

    // Start initial batch
    next();
  });
}

scan();
