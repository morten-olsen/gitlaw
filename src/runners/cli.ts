import { program } from 'commander';
import { loadConfig } from '../config/config.js';
import { resolve } from 'path';
import { emergencyApprove } from '../emergency/emergency.approve.js';

program
  .command('single')
  .argument('<owner>')
  .argument('<repo>')
  .option('-c, --config <path>', 'Path to the configuration file', 'config.js')
  .action(async (owner, repo, options) => {
    const configLocation = resolve(
      options.config || 'config.js'
    );
    const { scanner } = await loadConfig(configLocation);
    const run = await scanner.single(owner, repo)
    await run.full();

  });

program
  .command('run')
  .option('-c, --config <path>', 'Path to the configuration file', 'config.js')
  .option('-r, --repos <repos...>', 'List of repositories to scan')
  .action(async (options) => {
    const configLocation = resolve(
      options.config || 'config.js'
    );
    const { scanner } = await loadConfig(configLocation);
    const runs = await scanner.run(options.repos);
    for (const run of runs) {
      await run.full();
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
