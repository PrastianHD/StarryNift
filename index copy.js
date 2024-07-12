const ethers = require('ethers');
const fs = require('fs');
const readlineSync = require('readline-sync');
const figlet = require('figlet');

function printBanner(text, font = 'Standard') {
  figlet(text, { font }, (err, data) => {
    if (err) {
      console.log('Error creating ASCII banner:', err);
      return;
    }
    console.log(data);
    inputPassword();
  });
}

printBanner('StarryNift');

function inputPassword() {
  const expectedPassword = 'StarryNift';
  const password = readlineSync.question('Enter password: ', {
    hideEchoBack: true,
    mask: ''
  });

  if (password !== expectedPassword) {
    console.error('Incorrect password. Access denied.');
    process.exit(1);
  }

  main();
}

// Baca kunci pribadi dari file privatekey.txt
const privateKeys = fs.readFileSync('privatekey.txt', 'utf-8')
  .split('\n')
  .map(key => key.trim())
  .filter(Boolean);

const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');

const contractAddress = '0xE3bA0072d1da98269133852fba1795419D72BaF4';
const abi = [
  "function signIn() public"
];

async function checkBalance(signer) {
  const balance = await provider.getBalance(signer.address);
  console.log(`Balance of ${signer.address}: ${ethers.formatEther(balance)} BNB`);
  return balance;
}

async function sendTransaction(signer) {
  const contract = new ethers.Contract(contractAddress, abi, signer);
  try {
    const tx = await contract.signIn();
    console.log(`${signer.address}: Transaction hash :`, tx.hash);
    const receipt = await tx.wait();
    console.log(`${signer.address}: Transaction was mined in block :`, receipt.blockNumber);
  } catch (error) {
    if (error.code === 'CALL_EXCEPTION' && error.reason === 'Already signed in for today') {
      console.log(`${signer.address}: Already signed in for today`);
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error(`${signer.address}: Insufficient funds for gas`, error.reason);
    } else {
      console.error(`Error (from ${signer.address}):`, error);
    }
  }
}

async function main() {
  for (const privateKey of privateKeys) {
    const signer = new ethers.Wallet(privateKey, provider);
    
    await sendTransaction(signer);
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // Delay 2 detik
  }

  console.log('All wallets have completed their transactions. Waiting for 24 hours before the next round.');

  setTimeout(() => {
    console.log('24 hours have passed. Starting the next round of transactions.');
    main(); // Restart the process after 24 hours
  }, 86400000); // 24 jam dalam milidetik
}
