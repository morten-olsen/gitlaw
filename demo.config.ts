import 'dotenv/config';
import { defineConfig } from "./src/config/config.js";
import { basic } from './src/rules/basic/rule.js';
import { rulesets } from './src/rules/rulesets/rule.js';
import { environments } from './src/rules/environments/rule.js';

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
    environments: environments({
      knownEnvironments: {
        prod: {
          only: {
            defaultBranch: true,
          },
          secrets: {
            NPM_TOKEN: {
              get: () => process.env.NPM_TOKEN!,
            }
          }
        },
        stage: {
          only: {
            defaultBranch: true,
          },
        },
        test: {

        },
      }
    }),
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
