import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const testPath = resolve(__dirname, 'packages/wallet/tests/minimal-test.ts');

const child = spawn('node', [
  '--loader', 'ts-node/esm',
  '--experimental-specifier-resolution=node',
  testPath
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    TS_NODE_PROJECT: resolve(__dirname, 'packages/wallet/tsconfig.json')
  }
});

child.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});

