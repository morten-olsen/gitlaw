import { z } from "zod";
import { defineRule } from "../../rule/rule.js";

type PagesOptions = {
}

const schema = z.object({

});

const pages = (options: PagesOptions) => defineRule(schema, {
  apply: async () => { },
});

export { pages };
