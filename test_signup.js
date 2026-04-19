async function testSignup() {
  try {
    const res = await fetch('https://yammwcwgyghehgxkqvzl.supabase.co/auth/v1/signup', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbW13Y3dneWdoZWhneGtxdnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMDU1MDcsImV4cCI6MjA5MTU4MTUwN30.pNTLlPBhbLI1N-s2GZ0solls4GruV-u9yxb0BadoCds',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test_error_debug999@gmail.com',
        password: 'mypassword123',
        data: { name: 'Test', phone: '123', unit: '000', owner_id: 'd5249b8f-622b-429b-b565-d014eb05db51' }
      })
    });
    const data = await res.json();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", data);
  } catch(e) {
    console.log("ERROR:", e);
  }
}
testSignup();
