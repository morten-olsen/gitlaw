import { z } from "zod";
import sodium from 'libsodium-wrappers';
import { defineRule } from "../../rule/rule.js";

type EnvironmentsOptions = {
  knownEnvironments?: Record<string, {
    only?: {
      branches?: string[],
      protectedBranches?: boolean,
      defaultBranch?: boolean,
    };
    allowBypass?: boolean;
    requiredWaitTime?: {
      enabled: boolean,
      minutes: number;
    };
    requireReview?: {
      enabled: boolean,
    };
    secrets?: Record<string, {
      get: () => Promise<string> | string;
    }>,
  }>
}

const encryptSecret = async (publicKey: string, secret: string) => {
  await sodium.ready;
  const key = Buffer.from(publicKey, 'base64');
  const encryptedBytes = sodium.crypto_box_seal(secret, key);
  const encrypted = Buffer.from(encryptedBytes).toString('base64');
  return encrypted;
}

const schema = z.record(z.string(), z.object({
  requiredReviewers: z.object({
    users: z.array(z.object({
      type: z.union([z.literal("User"), z.literal("Team")]).optional(),
      id: z.number().optional(),
    })).optional(),
    preventSelfReview: z.boolean().optional(),
  }).optional(),
  waitTime: z.union([
    z.number(),
    z.boolean().refine((value) => value === false, { message: "waitTime must be a number or false" }),
  ]).optional(),
  allowBypass: z.boolean().optional(),
  variables: z.record(z.string(), z.string()).optional(),
  secrets: z.array(z.string()).optional(),
  branches: z.union([
    z.boolean().refine((value) => value === false, { message: "waitTime must be a number or false" }),
    z.literal('protected'),
    z.object({
      branches: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
    }),
  ]).optional(),
})).optional();

const environments = (options: EnvironmentsOptions) => defineRule(schema, {
  apply: async ({ octo, repo, config }) => {
    if (!config) {
      return;
    }

    const { data } = await octo.repos.getAllEnvironments({
      owner: repo.owner,
      repo: repo.name,
    });
    const remoteEnvironment = data.environments || [];
    let toRemove = remoteEnvironment
      .filter((env) => !config?.[env.name])
      .map((env) => env.name);

    for (let name of toRemove) {
      await octo.repos.deleteAnEnvironment({
        owner: repo.owner,
        repo: repo.name,
        environment_name: name,
      });
    }

    for (let [name, local] of Object.entries(config || {})) {
      await octo.repos.createOrUpdateEnvironment({
        owner: repo.owner,
        repo: repo.name,
        environment_name: name,
        prevent_self_review: local.requiredReviewers?.preventSelfReview,
        reviewers: local.requiredReviewers?.users,
        wait_timer: typeof local.waitTime === "number" ? local.waitTime : undefined,
      });
    }
  },

  validate: async ({ octo, repo, config, add }) => {
    const environments = await octo.repos.getAllEnvironments({
      owner: repo.owner,
      repo: repo.name,
    });

    for (const remote of environments.data?.environments || []) {
      if (!config?.[remote.name]) {
        continue;
      }
      const local = config[remote.name];

      // TODO: Implement validation
    }
  },

  enroll: async ({ octo, repo, config }) => {
    for (let [name, local] of Object.entries(config || {})) {
      const key = await octo.actions.getEnvironmentPublicKey({
        owner: repo.owner,
        repo: repo.name,
        environment_name: name,
      });
      if (!key.data) {
        continue;
      }
      for (let secretName of local.secrets || []) {
        const value = await options.knownEnvironments?.[name]?.secrets?.[secretName]?.get();
        if (!value) {
          continue;
        }
        await octo.actions.createOrUpdateEnvironmentSecret({
          owner: repo.owner,
          repo: repo.name,
          environment_name: name,
          key_id: key.data.key_id,
          secret_name: secretName,
          encrypted_value: await encryptSecret(key.data.key, value),
        });
      }
    }
  },
  unroll: async ({ octo, repo }) => {
    const environments = await octo.repos.getAllEnvironments({
      owner: repo.owner,
      repo: repo.name,
    });

    for (const env of environments.data?.environments || []) {
      if (!options.knownEnvironments?.[env.name]?.secrets) {
        continue;
      }
      const secrets = await octo.actions.listEnvironmentSecrets({
        owner: repo.owner,
        repo: repo.name,
        environment_name: env.name,
      });
      const toRemove = secrets.data.secrets.filter((secret) => !!options.knownEnvironments?.[env.name]?.secrets?.[secret.name]);
      for (const secret of toRemove) {
        await octo.actions.deleteEnvironmentSecret({
          owner: repo.owner,
          repo: repo.name,
          environment_name: env.name,
          secret_name: secret.name,
        });
      }
    }
  },
});

export { environments };
