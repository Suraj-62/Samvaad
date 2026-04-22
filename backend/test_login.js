fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@samvaad.com', password: 'admin123' })
}).then(res => res.json()).then(console.log).catch(console.error);
