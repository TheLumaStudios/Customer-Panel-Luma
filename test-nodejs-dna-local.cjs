// Test nodejs-dna package locally
const DomainNameApi = require('nodejs-dna');

const api = new DomainNameApi({
  serviceUsername: 'enespyz',
  servicePassword: 'Enes16P1289!',
});

console.log('🧪 Testing nodejs-dna package locally...\n');

api.CheckAvailability(['google', 'example'], ['com', 'net'], 1, 'check')
  .then(result => {
    console.log('✅ Success!');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  });
