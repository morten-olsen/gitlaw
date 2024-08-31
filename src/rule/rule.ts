import { z } from "zod";
import { RepoReadFileSystem } from "../repo/repo.read.js";
import { Octokit } from "@octokit/rest";
import { ValidationContext, ValidationMessage } from "./rule.validation.js";
import { GithubRequest } from "../config/config.js";

type ZodRuleType = z.ZodTypeAny;

type BaseOptions<TConfig extends ZodRuleType> = {
  configLocation: string;
  request: GithubRequest;
  repo: {
    owner: string;
    name: string;
  };
  octo: Octokit;
  config?: z.infer<TConfig>;
}

type Rule<TConfig extends ZodRuleType = any> = {
  readonly schema: TConfig;
  apply?: (options: BaseOptions<TConfig> & {
    filesystem: RepoReadFileSystem;
  }) => Promise<void>;
  validate?: (options: BaseOptions<TConfig> & {
    filesystem: RepoReadFileSystem;
    add: (message: Omit<ValidationMessage, 'rule'>) => void;
  }) => Promise<void>;
  enroll?: (options: BaseOptions<TConfig> & {
    filesystem: RepoReadFileSystem;
  }) => Promise<void>;
  unroll?: (options: BaseOptions<TConfig> & {
    filesystem: RepoReadFileSystem;
  }) => Promise<void>;
  enforce?: (options: BaseOptions<TConfig> & {
    filesystem: RepoReadFileSystem;
  }) => Promise<void>;
};

const defineRule = <TConfig extends ZodRuleType>(schema: TConfig, rule: Omit<Rule<TConfig>, 'schema'>): Rule<TConfig> => {
  return {
    schema,
    ...rule,
  };
}

export { defineRule, type Rule, type ZodRuleType, ValidationContext };
