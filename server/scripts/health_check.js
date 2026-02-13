async function run() {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/health');
    console.log('Status:', res.status);
    const txt = await res.text();
    console.log('Body:', txt);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

run();
