import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

async function test() {
  console.log('Fetching Clermont...');
  const start = Date.now();
  try {
    const res = await fetch('https://ffbb-api.desimone.fr/api/v1/club/9326');
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(`Club: ${data.nom || data.libelle}`);
    console.log(`Time taken: ${Date.now() - start}ms`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}
test();
