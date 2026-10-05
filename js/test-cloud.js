// jsc js/test-cloud.js
// Exercises the Google Drive folder link without a real directory picker.
if (typeof queueMicrotask !== 'function') {
  var queueMicrotask = function (fn) {
    Promise.resolve().then(fn);
  };
}

var window = this;
var mem = {};
var localStorage = {
  getItem: function (k) {
    return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;
  },
  setItem: function (k, v) {
    mem[k] = String(v);
  },
  removeItem: function (k) {
    delete mem[k];
  },
};

function makeIdb() {
  var dbs = new Map();
  return {
    open: function (name) {
      var req = {};
      var store = dbs.get(name) || new Map();
      dbs.set(name, store);
      var db = {
        objectStoreNames: {
          contains: function () {
            return true;
          },
        },
        transaction: function () {
          var tx = {
            objectStore: function () {
              return {
                get: function (key) {
                  var r = {};
                  queueMicrotask(function () {
                    r.result = store.get(key);
                    if (r.onsuccess) r.onsuccess();
                  });
                  return r;
                },
                put: function (value, key) {
                  store.set(key, value);
                  return {};
                },
                delete: function (key) {
                  store.delete(key);
                  return {};
                },
              };
            },
          };
          queueMicrotask(function () {
            if (tx.oncomplete) tx.oncomplete();
          });
          return tx;
        },
      };
      queueMicrotask(function () {
        req.result = db;
        if (req.onsuccess) req.onsuccess();
      });
      return req;
    },
  };
}

var indexedDB = makeIdb();

function fakeDir(dirName) {
  var files = new Map();
  return {
    name: dirName,
    files: files,
    _perm: 'granted',
    queryPermission: function () {
      return Promise.resolve(this._perm);
    },
    requestPermission: function () {
      return Promise.resolve(this._perm);
    },
    getFileHandle: function (fileName, opts) {
      if (!files.has(fileName)) {
        if (!opts || !opts.create) {
          var missing = new Error('missing');
          missing.name = 'NotFoundError';
          throw missing;
        }
        files.set(fileName, '');
      }
      var current = fileName;
      return {
        getFile: function () {
          return Promise.resolve({
            text: function () {
              return Promise.resolve(files.get(current));
            },
          });
        },
        createWritable: function () {
          var buf = '';
          return Promise.resolve({
            write: function (chunk) {
              buf += String(chunk);
              return Promise.resolve();
            },
            close: function () {
              files.set(current, buf);
              return Promise.resolve();
            },
            abort: function () {
              return Promise.resolve();
            },
          });
        },
        move: function (dest) {
          if (files.get('__failmove')) {
            files.delete('__failmove');
            var bad = new Error('exists');
            bad.name = 'InvalidModificationError';
            return Promise.reject(bad);
          }
          var text = files.get(current);
          files.delete(current);
          files.set(dest, text);
          current = dest;
          return Promise.resolve();
        },
      };
    },
    removeEntry: function (fileName) {
      files.delete(fileName);
      return Promise.resolve();
    },
  };
}

var failed = 0;
function assert(name, cond) {
  if (!cond) {
    failed += 1;
    print('FAIL ' + name);
  } else {
    print('ok   ' + name);
  }
}

var root = '/Users/twmf1323/Desktop/Verba-Orbis-design-main 2';
load(root + '/js/schema.js');
load(root + '/js/langs.js');
load(root + '/js/storage.js');
var St = VerbaAthanor.storage;

async function main() {
  var dir = fakeDir('我的雲端硬碟');
  var pickerCalls = [];
  window.showDirectoryPicker = function (opts) {
    pickerCalls.push(opts || {});
    if (pickerCalls.length === 1) {
      var err = new Error('id unsupported');
      err.name = 'TypeError';
      throw err;
    }
    return Promise.resolve(dir);
  };

  assert('backup file name', St.CLOUD_BACKUP_FILE === 'athanor-backup.json');
  var bare = await St.cloudFolderStatus();
  assert('starts unlinked', bare.supported === true && bare.mode === 'folder' && bare.linked === false && bare.fileName === 'athanor-backup.json');

  var picked = await St.pickCloudFolder();
  assert('picker retries without id', pickerCalls.length === 2 && pickerCalls[1].id == null && pickerCalls[1].mode === 'readwrite');
  assert('picked folder name', picked.name === '我的雲端硬碟');
  var linked = await St.cloudFolderStatus();
  assert('status linked', linked.linked === true && linked.name === '我的雲端硬碟' && linked.permission === 'granted' && !linked.syncedAt);

  St.setApiKey('xai-test-secret-athanor', 'grok');
  St.saveSettings({ model: 'should-not-sync-model-marker' });
  St.upsertHistory({ word: 'incroyable', lemma: 'incroyable', glossZh: '難以置信', morphemes: [], path: [] }, 'fr');
  St.saveLoans('incroyable', 'fr', 'croy', [{ word: 'credible', kind: 'loan', glossZh: '可信的', era: 'ModE' }]);
  dir.files.set('__failmove', '1');
  var written = await St.writeCloudBackup(St.exportBundle());
  var text = dir.files.get('athanor-backup.json');
  assert('atomic replace left no tmp', !dir.files.has('athanor-backup.json.tmp') && !dir.files.has('__failmove'));
  assert('wrote backup type', written.fileName === 'athanor-backup.json' && text.indexOf('"type": "verba-athanor-backup"') >= 0);
  assert('backup omits key and settings', text.indexOf('xai-test-secret-athanor') < 0 && text.indexOf('should-not-sync-model-marker') < 0);
  assert('backup keeps loan', text.indexOf('credible') >= 0);
  var synced = await St.cloudFolderStatus();
  assert('status remembers sync', Boolean(synced.syncedAt));

  var read = await St.readCloudBackup();
  var data = St.parseBackup(read.text);
  St.clearAllHistory();
  var report = St.importBundle(data, 'merge');
  var row = St.getHistoryByNormalized('incroyable', 'fr');
  assert('load merges history', report.history.added === 1 && row && row.glossZh === '難以置信');
  assert('load keeps loans', row.loans && row.loans.croy.items[0].word === 'credible');

  await St.unlinkCloudFolder();
  var gone = await St.cloudFolderStatus();
  assert('unlink forgets folder', gone.linked === false && mem['athanor.cloud.meta'] == null);
  assert('unlink keeps the file', dir.files.get('athanor-backup.json').indexOf('incroyable') >= 0);

  dir.files.delete('athanor-backup.json');
  await St.pickCloudFolder();
  var missing = '';
  try {
    await St.readCloudBackup();
  } catch (err) {
    missing = err.message;
  }
  assert('missing file explains next step', missing.indexOf('athanor-backup.json') >= 0 && missing.indexOf('同步到雲端') >= 0);

  dir._perm = 'denied';
  var denied = '';
  try {
    await St.writeCloudBackup(St.exportBundle());
  } catch (err) {
    denied = err.message;
  }
  assert('denied write asks to relink', denied.indexOf('連結資料夾') >= 0);

  var previous = await St.cloudFolderStatus();
  window.showDirectoryPicker = function () {
    var err = new Error('cancel');
    err.name = 'AbortError';
    return Promise.reject(err);
  };
  var aborted = null;
  try {
    await St.pickCloudFolder();
  } catch (err) {
    aborted = err;
  }
  var still = await St.cloudFolderStatus();
  assert('cancel keeps the old link', aborted && aborted.name === 'AbortError' && aborted.message === '已取消' && still.linked === true && still.name === previous.name);

  delete window.showDirectoryPicker;
  var unsupported = await St.cloudFolderStatus();
  var blocked = '';
  try {
    await St.pickCloudFolder();
  } catch (err) {
    blocked = err.message;
  }
  assert('browser without picker uses a file', unsupported.supported === false && unsupported.mode === 'file' && blocked.indexOf('Chrome') >= 0);

  if (failed) throw new Error(failed + ' failed');
  print('\nall passed');
}

main().catch(function (err) {
  print(String(err && err.stack ? err.stack : err));
  throw err;
});
