const requiredEnvVars = [
    'TELEGRAM_TOKEN',
    'TELEGRAM_CHAT_ID',
    'REDIS_HOST',
    'REDIS_PUB_CHANNEL',
    'REDIS_SUB_CHANNEL',
  ];
  
  export function validateEnv() {
    const missing = requiredEnvVars.filter((key) => !process.env[key]);
  
    if (missing.length > 0) {
      console.error('.env не полон — прерываю выполнение');
      console.log('Отсутствуют переменные окружения:');
      missing.forEach((key) => console.error(`  - ${key}`));
      process.exit(1);
    }
  
    console.log('Все переменные окружения загружены');
  }
  