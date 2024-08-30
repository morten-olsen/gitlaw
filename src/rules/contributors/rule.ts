import { z } from "zod";
import { defineRule } from "../../rule/rule.js";

type ContributorsOptions = {
}

const schema = z.object({

});

const contributors = (options: ContributorsOptions) => defineRule(schema, {
  apply: async () => { },
  validate: async ({ filesystem, add }) => {
  },
});

export { contributors };
