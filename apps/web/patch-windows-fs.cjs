// Patch transient Windows filesystem locks (EPERM / EBUSY) on mkdir
const fs = require('fs');

const origMkdir = fs.mkdir;
const origMkdirSync = fs.mkdirSync;
const origPromisesMkdir = fs.promises ? fs.promises.mkdir : null;

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

