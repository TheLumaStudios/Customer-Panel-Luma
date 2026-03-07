// Test with main account "enesp"
const DomainNameApi = require('nodejs-dna');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🧪 Testing with MAIN account "enesp"\n');
console.log('NOT: Web panele giriş yaptığınız şifreyi girin (enespyz değil, enesp hesabı için)\n');

rl.question('enesp hesabının şifresi: ', (password) => {
  const api = new DomainNameApi({
    serviceUsername: 'enesp',
    servicePassword: password,
  });

  console.log('\n📞 API çağrısı yapılıyor...\n');

  api.GetCurrentBalance()
    .then(result => {
      console.log('✅ Success!');
      console.log(JSON.stringify(result, null, 2));
      rl.close();
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
      rl.close();
    });
});
