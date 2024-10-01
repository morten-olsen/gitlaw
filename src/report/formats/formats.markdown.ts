import { ReportInput, ReportInputRepo } from "../reports.types.js";

const repo = (repo: ReportInputRepo) => {
  let state = 'Fail';
  if (!repo.configured) {
    state = 'Warn';
  } else if (repo.applied && repo.isValid) {
    state = 'Pass';
  }
  const main = [
    `### ${repo.owner}/${repo.repo} (${state})`,
    `- Configured: ${repo.configured ? 'Yes' : 'No'}`,
    `- Applied: ${repo.applied ? 'Yes' : 'No'}`,
    `- Valid: ${repo.isValid ? 'Yes' : 'No'}`,
    `- Enrolled: ${repo.enrolled ? 'Yes' : 'No'}`,
  ]

  const details: string[] = [];

  if (repo.parseError) {
    details.push(
      `- Parse Error:`,
      `\`\`\`json`,
      `${JSON.stringify(repo.parseError)}`,
      `\`\`\``,
    );
  }

  if (repo.validations.length > 0) {
    details.push(
      `- Validations:`,
      ...repo.validations.map((validation) => `- ${validation.rule} ${validation.type}: ${validation.reason}`),
    );
  }

  const result = [...main];

  if (details.length > 0) {
    result.push(
      '<details>',
      '<summary>Details</summary>',
      '',
      ...details,
      '',
      '</details>',
    );
  }

  return result.join('\n');
};

const markdown = (input: ReportInput) => {
  return `
# Report

- Start: ${input.start.toISOString()}

## Repos

${input.repos.map(repo).join('')}
`
};

export { markdown };
