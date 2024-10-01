import { Rule } from "../rule/rule.js";
import { ValidationMessage } from "../rule/rule.validation.js"

type ReportInputRepo = {
  owner: string;
  repo: string;
  configured: boolean;
  parseError: unknown;
  applied: boolean;
  isValid: boolean;
  validations: ValidationMessage[];
  enrolled: boolean;
  unrolled: boolean;
}

type ReportInput<TRules extends Record<string, Rule> = Record<string, Rule>> = {
  start: Date;
  rules: TRules;
  repos: ReportInputRepo[];
}

export type { ReportInput, ReportInputRepo };
