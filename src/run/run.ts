import { z } from "zod";
import { Rule, ValidationContext } from "../rule/rule.js";
import { RepoReadFileSystem } from "../repo/repo.read.js";
import { Octokit } from "@octokit/rest";
import YAML from "yaml";
import { GithubRequest } from "../config/config.js";
import { ReportInputRepo } from "../report/reports.types.js";

type GetRuleObject<TRules extends Record<string, Rule>> = {
  [K in keyof TRules]: TRules[K] extends Rule ? z.infer<TRules[K]['schema']> : never;
};

type RunOptions<TRules extends Record<string, Rule>> = {
  configLocation: string;
  enforce?: boolean;
  octo: Octokit;
  request: GithubRequest;
  repo: {
    owner: string;
    name: string;
  };
  rules: TRules;
};

type ConfigResult<TRules extends Record<string, Rule>> = {
  hasConfig: boolean;
  parseErrors?: unknown[];
  data?: {
    enroll?: boolean;
    rules?: GetRuleObject<TRules>;
  }
}

class Run<TRules extends Record<string, Rule>> {
  #options: RunOptions<TRules>;
  #filesystem: RepoReadFileSystem;
  #config?: Promise<ConfigResult<TRules>>;

  constructor(options: RunOptions<TRules>) {
    this.#options = options;
    this.#filesystem = new RepoReadFileSystem({
      octo: options.octo,
      repo: options.repo,
    });
  }

  public get repo() {
    return this.#options.repo;
  }

  #baseOptions = async <TRuleName extends keyof TRules>(rule: TRuleName) => {
    const { data } = await this.getConfig();
    const ruleConfig = data?.rules?.[rule];

    return {
      octo: this.#options.octo,
      request: this.#options.request,
      repo: this.#options.repo,
      config: ruleConfig,
      configLocation: this.#options.configLocation,
    }
  }

  public getConfig = async () => {
    if (!this.#config) {
      const run = async (): Promise<ConfigResult<TRules>> => {
        const { configLocation } = this.#options;
        const config = await this.#filesystem.readFile(configLocation);
        if (!config) {
          return { hasConfig: false };
        }
        try {
          const rules = z.object(
            Object.fromEntries(
              Object.entries(this.#options.rules).map(([ruleName, rule]) => [
                ruleName,
                rule.schema.optional(),
              ])
            )
          );
          const schema = z.object({
            enroll: z.boolean().optional(),
            rules: rules.optional(),
          })
          const data = schema.parse(YAML.parse(config)) as GetRuleObject<TRules>;
          return {
            hasConfig: true,
            data,
          };
        } catch (error) {
          return {
            hasConfig: true,
            parseErrors: [error],
          };
        }
      }

      this.#config = run();
    }

    const result = await this.#config;
    return result;
  }

  public apply = async () => {
    for (const [ruleName, rule] of Object.entries(this.#options.rules)) {
      if (!rule.apply) {
        continue;
      }
      const baseOptions = await this.#baseOptions(ruleName);
      await rule.apply({
        ...baseOptions,
        filesystem: this.#filesystem,
      });
    }
  }

  public validate = async () => {
    const context = new ValidationContext();

    for (const [ruleName, rule] of Object.entries(this.#options.rules)) {
      if (!rule.validate) {
        continue;
      }
      const baseOptions = await this.#baseOptions(ruleName);
      await rule.validate({
        ...baseOptions,
        filesystem: this.#filesystem,
        add: (message) => {
          context.add({
            ...message,
            rule: ruleName,
          });
        },
      });
    }

    return context;
  }

  public enroll = async () => {
    for (const [ruleName, rule] of Object.entries(this.#options.rules)) {
      if (!rule.enroll) {
        continue;
      }
      const baseOptions = await this.#baseOptions(ruleName);
      await rule.enroll({
        ...baseOptions,
        filesystem: this.#filesystem,
      });
    }
  }

  public unroll = async () => {

    for (const [ruleName, rule] of Object.entries(this.#options.rules)) {
      const baseOptions = await this.#baseOptions(ruleName);
      if (!rule.unroll) {
        continue;
      }
      await rule.unroll({
        ...baseOptions,
        filesystem: this.#filesystem,
      });
    }
  }

  public enforce = async () => {
    for (const [ruleName, rule] of Object.entries(this.#options.rules)) {
      const baseOptions = await this.#baseOptions(ruleName);
      if (!rule.unroll) {
        continue;
      }
      await rule.unroll({
        ...baseOptions,
        filesystem: this.#filesystem,
      });
    }
  }

  public full = async (): Promise<ReportInputRepo> => {
    const result: ReportInputRepo = {
      owner: this.#options.repo.owner,
      repo: this.#options.repo.name,
      parseError: undefined,
      configured: false,
      applied: false,
      isValid: false,
      validations: [],
      enrolled: false,
      unrolled: false,
    };
    const config = await this.getConfig();
    result.configured = config.hasConfig;
    if (!config.hasConfig || config.parseErrors) {
      if (config.parseErrors) {
        result.parseError = config.parseErrors;
      }
      return result;
    }
    await this.apply();
    result.applied = true;
    if (this.#options.enforce) {
      await this.enforce();
    }
    const validate = await this.validate();
    result.isValid = validate.isValid;
    result.validations = validate.messages;
    if (validate.isValid) {
      await this.enroll();
      result.enrolled = true;
    } else {
      await this.unroll();
      result.unrolled = true;
    }
    return result;
  }
}

export { Run, type RunOptions, type GetRuleObject };
