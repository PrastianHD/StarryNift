import chalk from 'chalk';
import { ethers } from 'ethers';
import fs from 'fs';
import readlineSync from 'readline-sync';
import figlet from 'figlet';
import { sendTelegramMessage } from './utils/telegram.js';

function printBanner(text, font = 'Standard') {
  figlet(text, { font }, (err, data) => {
    if (err) {
      console.log(chalk.redBright('Error creating ASCII banner:'), err);
      return;
    }
    console.log(chalk.greenBright(data));
    inputPassword();
  });
}

printBanner('StarryNift');

function inputPassword() {
  const expectedPassword = 'StarryNift';
  const password = readlineSync.question(chalk.blueBright('Enter password: '), {
    hideEchoBack: true,
    mask: ''
  });

  if (password !== expectedPassword) {
    console.error(chalk.red('Incorrect password. Access denied.'));
    process.exit(1);
  }

  main();
}

const privateKeys = fs.readFileSync('src/privatekey.txt', 'utf-8')
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
  console.log(chalk.yellow(`Balance of ${signer.address}: ${ethers.formatEther(balance)} BNB`));
  return balance;
}

async function sendTransaction(signer) {
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const tx = await contract.signIn();
      console.log(chalk.green(`${signer.address}: Transaction hash :`), tx.hash);
      const receipt = await tx.wait();
      console.log(chalk.green(`${signer.address}: Transaction was mined in block :`), receipt.blockNumber);
  
      const explorerUrl = `https://bscscan.com/tx/${tx.hash}`;
      const message = `
  🚀 *Transaction Alert* 🚀
  
  💎 *Wallet:* ${signer.address}
  ✅ *Message:* _CheckIn Successfully!_
  🔗 *Hash:* [View Transaction](${explorerUrl})
  
  🎉 *Status:* Transaction Completed Successfully!
      `;
      await sendTelegramMessage(message);
  
    } catch (error) {
      let message = `
  🚨 *Transaction Alert* 🚨
  
  💎 *Wallet:* ${signer.address}
  🛑 *Status:* `;
      if (error.code === 'CALL_EXCEPTION' && error.reason === 'Already signed in for today') {
        console.log(chalk.cyan(`${signer.address}: Already signed in for today`));
        message += '_Already signed in for today_';
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        console.error(chalk.red(`${signer.address}: Insufficient funds for gas`));
        message += '_Insufficient funds for gas_';
      } else {
        console.error(chalk.red(`Error (from ${signer.address}):`), error);
        message += `*Error:* \`${error.message}\``;
      }
      await sendTelegramMessage(message);
    }
  }

async function main() {
  for (const privateKey of privateKeys) {
    const signer = new ethers.Wallet(privateKey, provider);
    await checkBalance(signer);
    await sendTransaction(signer);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(chalk.magenta('All wallets have completed their transactions. Waiting for 24 hours before the next round.'));

  setTimeout(() => {
    console.log(chalk.magenta('24 hours have passed. Starting the next round of transactions.'));
    main();
  }, 86400000);
}
