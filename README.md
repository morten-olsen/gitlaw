# GitLaw ¶

**GitLaw** is a suite of GitHub Actions designed to help companies enforce a robust Software Development Life Cycle (SDLC) within GitHub, while still allowing flexibility for developers.

## What Does GitLaw Protect Against?

Imagine your company relies on GitHub for code development and deployment, with AWS credentials stored as organization-wide secrets. Now, consider the risk if a rogue actor gains access to one of your developer's accounts. They could create a malicious repository, add a GitHub Action that wreaks havoc on your production environment, and since these credentials are available across the organization, you're in for a disastrous day.

The threat doesn't stop there. Even if the attacker leverages an existing repository they have write access to, and despite branch protections, your pull request (PR) pipeline could still have access to those sensitive keys.

## How Does GitLaw Work?

GitLaw is your organization's guardian. It begins by creating a dedicated, heavily secured repository—this is your GitLaw repo. All organization secrets are removed and moved here as repository-specific secrets.

Next, you define your GitLaw configuration within this repository—**you decide the law!** Developers can then configure their own repositories using a `.github/law.yml` file, adhering to the rules you’ve set.

### Example Configuration

Here’s what a `.github/law.yml` file might look like:

```yaml
rules:
  contributors:
    read:
      - monitor-user
    write:
      - my-team
      - ops-team
  rulesets:
    - branch: main
      pullRequest:
        require: true
        approvers: 2
  basic:
    features:
      issues:
        enabled: true
  secrets:
    include:
      - SECRET
```

**What do these rules accomplish?**

- **Contributors:** Ensures that only specified users or teams can read or write to the repository.
- **Pull Requests:** Enforces that PRs are required for the `main` branch, with at least two approvals.
- **Features:** Enables issues for the repository.
- **Secrets Management:** Adds or removes repository secrets based on compliance with your rules.

Developers can create and manage repositories with minimal restrictions. However, when a project needs to go to production, it must comply with the law to gain access to the required secrets. (See Gitlaw configuration example)

## Enforcing Repository Changes

To maintain security and traceability, a good law dictates that repository settings should not be changed directly through the GitHub interface (No one should have admin access). Instead, all changes should be made by updating the `law.yaml` file within the repository. This approach ensures that changes undergo your normal approval process and are logged as part of the repository’s Git history.

## Handling Emergency Changes

Even with strict laws in place, emergencies happen. Suppose your law requires approval before merging any changes, and it's Saturday night—the site is down, and you need an urgent fix. You submit a PR, but no one is around to approve it.

GitLaw provides an **emergency approval** feature. In such cases, a developer can request an additional approval, which GitLaw will automatically handle based on your configuration. You can also set up actions to accompany these requests, like sending notifications on Slack or logging the event in a SIEM, ensuring transparency and post-event validation.

## GitLaw Configuration Example

Here’s a sample configuration to show how you might set up GitLaw:

<summary>
  <details>
    
```js
import { defineConfig } from "@morten-olsen/gitlaw";
import { basic } from "@morten-olsen/gitlaw/rules/basic";
import { secrets } from "@morten-olsen/gitlaw/rules/secrets";
import { codeowner } from "@morten-olsen/gitlaw/rules/codeowner";
import { rulesets } from "@morten-olsen/gitlaw/rules/rulesets";

const token = process.env.GITHUB_TOKEN;
if (!token) {
  throw new Error("GITHUB_TOKEN is required");
}

const config = defineConfig({
  configLocation: ".github/law.yml",
  auth: {
    token,
  },
  rules: {
    basic: basic({
      // Only consider private repos compliant
      visiblity: 'private',
    }),
    rulesets: rulesets({
      // Only consider the repo in compliance if the main
      // branch is protected
      requireMainBranchProtection: true,
      // Only consider the repo in compliance if it
      // require at least one PR review to merge
      minimumReviewers: 1,
      // Only consider the repo in compliance it it
      // does not allow admin overrides
      allowOverride: false,
    }),
    codeowner: codeowner({
      // Only consider the repo in compliance it is
      // protects the gitlaw file in it's CODEOWNERS file
      requireProtection: true
    }),
    secrets: secrets({
      managedSecrets: [
        {
          // Make a secret named "SECRET" available to repos
          // that are in compliance
          name: "SECRET",
          get: () => process.env.SECRET!,
        },
      ],
    }),
  },
  emergency: {
    approval: async ({ pr, repo, actor }) => {
      if (isWorkHours() {
        return {
          type: 'deny',
          reason: 'Emergency approvals are only allowed outside if work hours',
        };
      }
      sendSlackMessage(`An emergency deployment was performed by ${actor} on ${repo.owner}/${repo.name} PR ${pr}`);
      return {
        type: "allow",
      };
    },
  },
});

export { config };
```

</details>
</summary>
