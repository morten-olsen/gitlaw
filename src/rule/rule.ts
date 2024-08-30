import { z } from "zod";
import { RepoReadFileSystem } from "../repo/repo.read.js";
import { Octokit } from "@octokit/rest";
import { ValidationContext, ValidationMessage } from "./rule.validation.js";
import { GithubRequest } from "../config/config.js";

type BaseOptions<TConfig extends z.ZodSchema> = {
  configLocation: string;
  request: GithubRequest;
  repo: {
    owner: string;
    name: string;
  };
  octo: Octokit;
  config?: z.infer<TConfig>;
}

type Rule<TConfig extends z.ZodSchema = z.ZodObject<any, any>> = {
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

const defineRule = <TConfig extends z.ZodSchema>(schema: TConfig, rule: Omit<Rule<TConfig>, 'schema'>): Rule<TConfig> => {
  return {
    schema,
    ...rule,
  };
}

export { defineRule, type Rule, ValidationContext };
