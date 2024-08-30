import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const version = process.argv[2];
if (!version) {
  throw new Error('Version is required');
}

const pkg = JSON.parse(await readFile(join('package.json'), 'utf8'));
pkg.version = version;
await writeFile(join('package.json'), JSON.stringify(pkg, null, 2));
