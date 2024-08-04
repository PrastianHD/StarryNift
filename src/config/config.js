import 'dotenv/config';

const config = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  ENABLE_TELEGRAM_NOTIFICATIONS: process.env.ENABLE_TELEGRAM_NOTIFICATIONS === 'true',
};

export default config;
