/* eslint-disable @typescript-eslint/no-require-imports */
// Patch transient Windows filesystem locks (EPERM / EBUSY) on mkdir, and EPERM on symlink
const fs = require('fs');
const pathModule = require('path');

const origMkdir = fs.mkdir;
const origMkdirSync = fs.mkdirSync;
const origPromisesMkdir = fs.promises ? fs.promises.mkdir : null;

const origSymlink = fs.symlink;
const origSymlinkSync = fs.symlinkSync;
const origPromisesSymlink = fs.promises ? fs.promises.symlink : null;

function sleepSync(ms) {
  try {
    const sab = new SharedArrayBuffer(4);
    const int32 = new Int32Array(sab);
    Atomics.wait(int32, 0, 0, ms);
  } catch {
    const start = Date.now();
    while (Date.now() - start < ms) {}
  }
}

fs.mkdirSync = function (path, options) {
  let attempts = 0;
  while (true) {
    try {
      return origMkdirSync.call(fs, path, options);
    } catch (err) {
      if ((err.code === 'EPERM' || err.code === 'EBUSY') && attempts < 10) {
        attempts++;
        sleepSync(50);
        continue;
      }
      throw err;
    }
  }
};

fs.mkdir = function (path, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  let attempts = 0;
  function attempt() {
    origMkdir.call(fs, path, options, (err) => {
      if (err && (err.code === 'EPERM' || err.code === 'EBUSY') && attempts < 10) {
        attempts++;
        setTimeout(attempt, 50);
        return;
      }
      if (callback) callback(err);
    });
  }
  attempt();
};

if (origPromisesMkdir) {
  fs.promises.mkdir = async function (path, options) {
    let attempts = 0;
    while (true) {
      try {
        return await origPromisesMkdir.call(fs.promises, path, options);
      } catch (err) {
        if ((err.code === 'EPERM' || err.code === 'EBUSY') && attempts < 10) {
          attempts++;
          await new Promise((r) => setTimeout(r, 50));
          continue;
        }
        throw err;
      }
    }
  };
}

// Windows symlink fallback: if Windows denies symlink with EPERM, copy the directory/file instead
function resolveTarget(target, destPath) {
  if (pathModule.isAbsolute(target)) return target;
  return pathModule.resolve(pathModule.dirname(destPath), target);
}

fs.symlinkSync = function (target, destPath, type) {
  try {
    return origSymlinkSync.call(fs, target, destPath, type);
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EACCES') {
      const actualTarget = resolveTarget(target, destPath);
      if (fs.existsSync(actualTarget)) {
        try {
          fs.cpSync(actualTarget, destPath, { recursive: true, dereference: true });
          return;
        } catch {}
      }
    }
    throw err;
  }
};

fs.symlink = function (target, destPath, type, callback) {
  if (typeof type === 'function') {
    callback = type;
    type = null;
  }
  origSymlink.call(fs, target, destPath, type, (err) => {
    if (err && (err.code === 'EPERM' || err.code === 'EACCES')) {
      const actualTarget = resolveTarget(target, destPath);
      if (fs.existsSync(actualTarget)) {
        return fs.cp(actualTarget, destPath, { recursive: true, dereference: true }, callback);
      }
    }
    if (callback) callback(err);
  });
};

if (origPromisesSymlink) {
  fs.promises.symlink = async function (target, destPath, type) {
    try {
      return await origPromisesSymlink.call(fs.promises, target, destPath, type);
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'EACCES') {
        const actualTarget = resolveTarget(target, destPath);
        if (fs.existsSync(actualTarget)) {
          try {
            await fs.promises.cp(actualTarget, destPath, { recursive: true, dereference: true });
            return;
          } catch {}
        }
      }
      throw err;
    }
  };
}
