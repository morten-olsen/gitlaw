import { z } from "zod";
import { defineRule } from "../../rule/rule.js";
import sodium from 'libsodium-wrappers';

const schema = z.object({
  include: z.array(z.string()).optional(),
});

type SecretsConfig = {
  managedSecrets: {
    name: string;
    get: () => string | Promise<string>;
  }[];
}

const encryptSecret = async (publicKey: string, secret: string) => {
  await sodium.ready;
  const key = Buffer.from(publicKey, 'base64');
  const encryptedBytes = sodium.crypto_box_seal(secret, key);
  const encrypted = Buffer.from(encryptedBytes).toString('base64');
  return encrypted;
}

const secrets = ({
  managedSecrets,
}: SecretsConfig) => defineRule(schema, {
  enroll: async ({ config, octo, repo }) => {
    if (!config || !config.include) {
      return;
    }
    const { data: key } = await octo.actions.getRepoPublicKey({
      owner: repo.owner,
      repo: repo.name,
    });

    for (const secret of config.include) {
      const managedSecret = managedSecrets.find((managedSecret) => managedSecret.name === secret);
      if (!managedSecret) {
        continue;
      }
      const value = await managedSecret.get();
      if (!value) {
        continue;
      }
      await octo.rest.actions.createOrUpdateRepoSecret({
        owner: repo.owner,
        repo: repo.name,
        secret_name: managedSecret.name,
        key_id: key.key_id,
        encrypted_value: await encryptSecret(key.key, value),
      });
    }
  },
  unroll: async ({ octo, repo }) => {
    const secrets = await octo.rest.actions.listRepoSecrets({
      owner: repo.owner,
      repo: repo.name,
    });

    for (const secret of secrets.data.secrets) {
      if (!managedSecrets.find((managedSecret) => managedSecret.name === secret.name)) {
        continue;
      }
      await octo.rest.actions.deleteRepoSecret({
        owner: repo.owner,
        repo: repo.name,
        secret_name: secret.name,
      });
    }
  },
});

export { secrets };
