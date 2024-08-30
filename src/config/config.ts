import { existsSync } from "fs";
import { Rule } from "../rule/rule.js";
import { Octokit } from "@octokit/rest";
import { Scanner } from "../scanner/scanner.js";
import { request as octoRequest } from "@octokit/request";
import { EmergencyApproveValidator } from "../emergency/emergency.approve.js";

type Auth = {
  token: string;
}

type GithubRequest = ReturnType<typeof octoRequest['defaults']>;

type Config<TRules extends Record<string, Rule>> = {
  auth: Auth;
  rules: TRules;
  configLocation: string;
  emergency?: {
    approval?: EmergencyApproveValidator;
  }
};

const defineConfig = <TRules extends Record<string, Rule>>(config: Config<TRules>): Config<TRules> => {
  return config;
}

const loadConfig = async (path: string): Promise<{
  octo: Octokit;
  config: Config<Record<string, Rule>>;
  scanner: Scanner;
}> => {
  if (!existsSync(path)) {
    throw new Error(`Config file not found: ${path}`);
  }

  const { config } = await import(path) as { config: Config<Record<string, Rule>> };
  const { configLocation, rules } = config;
  const request = octoRequest.defaults({
    headers: {
      authorization: `token ${config.auth.token}`,
    },
  });
  const octo = new Octokit({
    auth: config.auth.token,
  });
  const scanner = new Scanner({
    request,
    octo,
    configLocation,
    rules,
  });

  return { octo, config, scanner };
}

export { defineConfig, loadConfig, type Config, type GithubRequest };
