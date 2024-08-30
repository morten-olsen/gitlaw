import { z } from "zod";
import { defineRule } from "../../rule/rule.js";

type EnvironmentsOptions = {
}

const schema = z.object({

});

const environments = (options: EnvironmentsOptions) => defineRule(schema, {
  apply: async () => { },
});

export { environments };
