import { Octokit } from "@octokit/rest";

type RepoReadFileSystemOptions = {
  octo: Octokit;
  repo: {
    owner: string;
    name: string;
  };
  ref?: string;
}

class RepoReadFileSystem {
  #options: RepoReadFileSystemOptions;

  constructor(options: RepoReadFileSystemOptions) {
    this.#options = options;
  }

  public readFile = async (path: string) => {
    try {
      const { octo, repo, ref } = this.#options;
      const content = await octo.rest.repos.getContent({
        repo: repo.name,
        owner: repo.owner,
        ref,
        path,
      });

      if (!('type' in content.data) || content.data.type !== 'file') {
        return;
      }

      return Buffer.from(content.data.content, 'base64').toString();
    } catch (error: unknown) {
      if (typeof error !== 'object' || !error) {
        throw new Error('Unknown error');
      }
      if ('status' in error && error.status === 404) {
        return;
      }
      throw error;
    }
  }
}

export { RepoReadFileSystem };
