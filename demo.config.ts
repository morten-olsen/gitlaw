import 'dotenv/config';
import { defineConfig } from "./src/config/config.js";
import { basic } from './src/rules/basic/rule.js';
import { secrets } from './src/rules/secrets/rule.js';
import { codeowner } from './src/rules/codeowner/rule.js';
import { rulesets } from './src/rules/rulesets/rule.js';

const token = process.env.GITHUB_TOKEN;
if (!token) {
  throw new Error('GITHUB_TOKEN is required');
}

const config = defineConfig({
  configLocation: '.github/law.yml',
  auth: {
    token,
  },
  rules: {
    basic: basic({}),
    rulesets: rulesets({}),
    codeowner: codeowner({}),
    secrets: secrets({
      managedSecrets: [
        {
          name: 'SECRET',
          get: () => process.env.SECRET!,
        },
      ],
    })
  },
  emergency: {
    approval: async ({ pr }) => {
      console.log('Approving PR', pr);
      return {
        type: 'allow',
      };
    },
  }
});

export { config };
