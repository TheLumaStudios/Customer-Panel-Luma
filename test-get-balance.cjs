// Test GetCurrentBalance API
const DomainNameApi = require('nodejs-dna');

const api = new DomainNameApi({
  serviceUsername: 'enespyz',
  servicePassword: 'Enes16P1289',
});

console.log('🧪 Testing GetCurrentBalance with updated password...\n');

api.GetCurrentBalance()
  .then(result => {
    console.log('✅ Success! Balance API works!');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  });
