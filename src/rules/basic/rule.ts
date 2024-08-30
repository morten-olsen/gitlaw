import { z } from "zod";
import { } from '@octokit/request'
import { defineRule } from "../../rule/rule.js";

type BasicOptions = {
}

const schema = z.object({
  description: z.string().optional(),
  isTemplate: z.boolean().optional(),
  defaultBranch: z.string().optional(),
  visibility: z.union([
    z.literal("public"),
    z.literal("private"),
  ]).optional(),
  features: z.object({
    projects: z.object({
      enabled: z.boolean(),
    }).optional(),
    issues: z.object({
      enabled: z.boolean(),
    }).optional(),
    wiki: z.object({
      enabled: z.boolean(),
    }).optional(),
  }).optional(),
  pullRequests: z.object({
    mergeCommits: z.object({
      enabled: z.boolean(),
      commit: z.object({
        title: z.union([
          z.literal("PR_TITLE"),
          z.literal("MERGE_MESSAGE"),
        ]),
        body: z.union([
          z.literal("PR_TITLE"),
          z.literal("PR_BODY"),
          z.literal("BLANK"),
        ]),
      }).optional(),
    }).optional(),
    rebaseMerge: z.object({
      enabled: z.boolean(),
    }).optional(),
    squashMerge: z.object({
      enabled: z.boolean(),
      commit: z.object({
        title: z.union([
          z.literal("PR_TITLE"),
          z.literal("COMMIT_OR_PR_TITLE"),
        ]),
        body: z.union([
          z.literal("PR_BODY"),
          z.literal("COMMIT_MESSAGES"),
          z.literal("BLANK"),
        ]),
      }).optional(),
    }).optional(),
  }).optional(),
  suggestUpdatingPullRequestBranches: z.boolean().optional(),
  allowAutoMerge: z.boolean().optional(),
  deleteBranchOnMerge: z.boolean().optional(),
  archived: z.boolean().optional(),
  allowForking: z.boolean().optional(),
  webCommitRequireSignOff: z.boolean().optional(),
});

const basic = (options: BasicOptions) => defineRule(schema, {
  apply: async ({ config, repo, request }) => {
    if (!config) {
      return;
    }
    const params = {
      owner: repo.owner,
      repo: repo.name,
      description: config.description,
      visibility: config.visibility,
      has_wiki: config.features?.wiki?.enabled,
      has_issues: config.features?.issues?.enabled,
      has_projects: config.features?.projects?.enabled,
      is_template: config.isTemplate,
      default_branch: config.defaultBranch,
      allow_squash_merge: config.pullRequests?.squashMerge?.enabled,
      allow_merge_commit: config.pullRequests?.mergeCommits?.enabled,
      allow_rebase_merge: config.pullRequests?.rebaseMerge?.enabled,
      allow_auto_merge: config.allowAutoMerge,
      delete_branch_on_merge: config.deleteBranchOnMerge,
      allow_update_branch_on_pull_request: config.suggestUpdatingPullRequestBranches,
      use_squash_pr_title_as_default: config.pullRequests?.squashMerge?.commit !== undefined
        ? !!config.pullRequests?.squashMerge?.commit
        : undefined,
      squash_merge_commit_title: config.pullRequests?.squashMerge?.commit?.title,
      squash_merge_commit_message: config.pullRequests?.squashMerge?.commit?.body,
      merge_commit_title: config.pullRequests?.mergeCommits?.commit?.title,
      merge_commit_message: config.pullRequests?.mergeCommits?.commit?.body,
      archived: config.archived,
      allow_forking: config.allowForking,
      web_commit_signoff_required: config.webCommitRequireSignOff,
    }
    // TODO: fix token
    const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error(`Failed to update repository ${repo.owner}/${repo.name}`)
      console.error(response.status);
      console.error(await response.text());
      throw new Error(`Failed to update repository ${repo.owner}/${repo.name}`);
    }
  },
});

export { basic };
