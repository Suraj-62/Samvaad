import fs from 'fs';

async function test() {
  const formData = new FormData();
  formData.append('name', 'Test Resume Student');
  formData.append('email', 'testresume@example.com');
  formData.append('password', 'password123');
  formData.append('role', 'student');
  
  const blob = new Blob([fs.readFileSync('dummy.pdf')], { type: 'application/pdf' });
  formData.append('resume', blob, 'dummy.pdf');

  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

test();
