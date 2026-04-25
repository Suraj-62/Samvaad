const formData = new FormData();
formData.append('name', 'Test Student');
formData.append('email', 'teststudent@example.com');
formData.append('password', 'password123');
formData.append('role', 'student');

fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  body: formData
}).then(res => res.json()).then(console.log).catch(console.error);
