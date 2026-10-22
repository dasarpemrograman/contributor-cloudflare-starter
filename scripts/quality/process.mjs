import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

export function run(command, args = [], options = {}) {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      windowsHide: true,
      ...options,
    });
    child.on('error', (error) =>
      reject(new Error(`${command}: ${error.message}`, { cause: error })),
    );
    child.on('exit', (code, signal) => {
      if (code === 0) accept();
      else reject(new Error(`${command} failed (${signal ?? code}).`));
    });
  });
}

export function node(script, args = [], options = {}) {
  return run(process.execPath, [resolve(script), ...args], options);
}

export function npm(script, args = []) {
  if (!process.env.npm_execpath)
    throw new Error('Use npm run quality to run this workflow.');
  return run(process.execPath, [
    process.env.npm_execpath,
    'run',
    script,
    ...(args.length ? ['--', ...args] : []),
  ]);
}
