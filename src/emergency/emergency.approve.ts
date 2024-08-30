import { Octokit } from "@octokit/rest";

type EmergencyApproveResult = {
  type: 'allow' | 'deny';
  reason?: string;
};

type EmergencyApproveOptions = {
  octo: Octokit
  repo: string;
  owner: string;
  pr: number;
  action: EmergencyApproveValidator;
}

type EmergencyApproveValidator = (options: Omit<EmergencyApproveOptions, 'action'>) => Promise<EmergencyApproveResult>;

const emergencyApprove = async (options: EmergencyApproveOptions) => {
  const { octo, repo, owner, pr, action } = options;
  const result = await action({
    octo,
    repo,
    owner,
    pr,
  });
  if (result.type === 'deny') {
    throw new Error(`Could not approve, reason: ${result.reason}`);
  }
  await octo.pulls.createReview({
    repo,
    owner,
    pull_number: pr,
    event: 'APPROVE',
  });
}

export { emergencyApprove, type EmergencyApproveResult, type EmergencyApproveValidator };
