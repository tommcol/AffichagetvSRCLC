async function run() {
  for (let id = 9300; id < 9350; id++) {
    try {
      const res = await fetch(`https://ffbb-api.desimone.fr/api/v1/club/${id}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`ID ${id}: ${data.nom || data.libelle} (Code: ${data.code})`);
      }
    } catch (err) {}
  }
}
run();
