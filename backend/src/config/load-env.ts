import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Load environment variables in order of precedence
// 1. .env.local (local overrides, not committed)
// 2. .env (defaults, committed)

const envFiles = ['.env.local', '.env'];

for (const envFile of envFiles) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    config({ path: envPath });
    console.log(`✅ Loaded environment from: ${envFile}`);
    break;
  }
}
