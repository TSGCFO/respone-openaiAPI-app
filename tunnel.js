const localtunnel = require('localtunnel');

(async () => {
  const tunnel = await localtunnel({ port: 5000 });

  console.log('');
  console.log('==================================================');
  console.log('🌐 Your app is now publicly accessible at:');
  console.log('');
  console.log('   ' + tunnel.url);
  console.log('');
  console.log('==================================================');
  console.log('');
  console.log('Press Ctrl+C to stop the tunnel');
  console.log('');

  tunnel.on('close', () => {
    console.log('Tunnel closed');
  });

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\nClosing tunnel...');
    tunnel.close();
    process.exit();
  });
})();
