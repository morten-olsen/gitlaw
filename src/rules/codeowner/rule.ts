import { z } from "zod";
import { defineRule } from "../../rule/rule.js";

type CodeownerOptions = {
}

const schema = z.object({

});

const codeowner = (options: CodeownerOptions) => defineRule(schema, {
  validate: async ({ filesystem, add }) => {
    const ownerFile = await filesystem.readFile('.github/CODEOWNERS');
    if (!ownerFile) {
      add({ type: 'error', reason: 'CODEOWNERS file is missing' });
    }
  },
});

export { codeowner };
