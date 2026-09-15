async function scan() {
  const batchSize = 250;
  
  // Define ranges to scan. Range 8000-12000 is extremely likely for active clubs.
  const ranges = [
    { start: 8000, end: 12000 },
    { start: 1, end: 7999 },
    { start: 12001, end: 18000 }
  ];

  for (const range of ranges) {
    console.log(`Starting scan range ${range.start} to ${range.end}...`);
    for (let start = range.start; start <= range.end; start += batchSize) {
      console.log(`Scanning IDs from ${start} to ${Math.min(start + batchSize - 1, range.end)}...`);
      const promises = [];
      for (let i = 0; i < batchSize; i++) {
        const id = start + i;
        if (id > range.end) break;
        promises.push(
          fetch(`https://ffbb-api.desimone.fr/api/v1/club/${id}`)
            .then(async (res) => {
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
                  console.log(`\n🎉 FOUND CLUB! ID: ${id}, Name: ${name}, Code: ${code}\n`);
                  process.exit(0);
                }
              }
            })
            .catch(() => null)
        );
      }
      await Promise.all(promises);
    }
  }
  console.log('Finished scanning all ranges, not found.');
}

scan();
