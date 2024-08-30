import { Octokit } from "@octokit/rest";
import micromatch from "micromatch";
import { Rule } from "../rule/rule.js";
import { Run } from "../run/run.js";
import { GithubRequest } from "../config/config.js";

type ScanOptions<TRules extends Record<string, Rule>> = {
  request: GithubRequest,
  octo: Octokit;
  rules: TRules;
  configLocation: string;
}

class Scanner<TRules extends Record<string, Rule> = Record<string, Rule>> {
  #options: ScanOptions<TRules>;

  constructor(options: ScanOptions<TRules>) {
    this.#options = options;
  }

  public single = async (owner: string, name: string): Promise<Run<TRules>> => {
    return new Run<TRules>({
      octo: this.#options.octo,
      request: this.#options.request,
      repo: {
        owner,
        name,
      },
      rules: this.#options.rules,
      configLocation: this.#options.configLocation,
    });
  }

  public run = async (patters?: string[]): Promise<Run<TRules>[]> => {
    const { octo, request, rules, configLocation } = this.#options;
    const iterator = octo.paginate.iterator(octo.repos.listForAuthenticatedUser, {});
    const result: Run<TRules>[] = [];
    for await (const { data: repos } of iterator) {
      result.push(...repos.map((repo) => new Run<TRules>({
        octo,
        request,
        repo: {
          owner: repo.owner.login,
          name: repo.name,
        },
        rules,
        configLocation,
      })));
    }
    if (patters) {
      return result.filter((run) => micromatch.isMatch(`${run.repo.owner}/${run.repo.name}`, patters));
    }
    return result;
  }
}

export { Scanner };
