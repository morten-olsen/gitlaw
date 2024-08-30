import { z } from "zod";
import { defineRule } from "../../rule/rule.js";

type RulesetsOptions = {
}

const schema = z.object({

});

const rulesets = (options: RulesetsOptions) => defineRule(schema, {
  apply: async () => {

  },
});

export { rulesets };
