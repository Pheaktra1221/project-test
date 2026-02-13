
import fetch from 'node-fetch';

async function checkApi() {
  const ports = [8000, 3001, 3002, 3000];
  
  for (const port of ports) {
    try {
      console.log(`Trying port ${port}...`);
      const response = await fetch(`http://localhost:${port}/api/statistics/dashboard`);
      console.log(`Response status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        return;
      } else {
        console.log('Response text:', await response.text());
      }
    } catch (e) {
      console.log(`Port ${port} failed: ${e.message}`);
    }
  }
}

checkApi();
