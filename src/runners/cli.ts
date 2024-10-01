import { program } from 'commander';
import { loadConfig } from '../config/config.js';
import { resolve } from 'path';
import { emergencyApprove } from '../emergency/emergency.approve.js';
import { ReportInput } from '../report/reports.types.js';
import { markdown } from '../report/formats/formats.markdown.js';
import { writeFile } from 'fs/promises';

program
  .command('single')
  .argument('<owner>')
  .argument('<repo>')
  .option('-c, --config <path>', 'Path to the configuration file', 'config.js')
  .option('-o, --output [path]', 'Path to the output file')
  .action(async (owner, repo, options) => {
    const configLocation = resolve(
      options.config || 'config.js'
    );
    const { scanner, rules } = await loadConfig(configLocation);
    const result: ReportInput = {
      start: new Date(),
      rules: rules,
      repos: [],
    }
    const run = await scanner.single(owner, repo)
    result.repos.push(await run.full());
    if (options.output) {
      const report = markdown(result);
      await writeFile(options.output, report, 'utf-8');
    } else {
      console.log(markdown(result));
    }
  });

program
  .command('run')
  .option('-c, --config <path>', 'Path to the configuration file', 'config.js')
  .option('-r, --repos <repos...>', 'List of repositories to scan')
  .option('-o, --output [path]', 'Path to the output file', 'report.md')
  .action(async (options) => {
    const configLocation = resolve(
      options.config || 'config.js'
    );
    const { scanner, rules } = await loadConfig(configLocation);
    const runs = await scanner.run(options.repos);
    const result: ReportInput = {
      start: new Date(),
      rules: rules,
      repos: [],
    }
    for (const run of runs) {
      result.repos.push(await run.full());
    }
    if (options.output) {
      const report = markdown(result);
      await writeFile(options.output, report, 'utf-8');
    } else {
      console.log(markdown(result));
    }
  });

const emergency = program.command('emergency');

emergency
  .command('approve')
  .argument('<owner>')
  .argument('<repo>')
  .argument('<pr>')
  .option('-c, --config <path>', 'Path to the configuration file', 'config.js')
  .action(async (owner, repo, pr, options) => {
    const configLocation = resolve(
      options.config || 'config.js'
    );
    const { octo, config } = await loadConfig(configLocation);
    const { emergency } = config;
    if (!emergency || !emergency.approval) {
      throw new Error('Emergency approval is not configured');
    }
    const { approval } = emergency;
    const result = await emergencyApprove({
      octo,
      owner,
      repo,
      action: approval,
      pr: parseInt(pr),
    });
    console.log(result);
  });


await program.parseAsync(process.argv);
