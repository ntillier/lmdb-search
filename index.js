import { open } from 'lmdb';
import * as cbor from 'cbor-x';
import path from 'path';

function search(where, obj) {
  if (Array.isArray(where) && Array.isArray(obj)) {
    loop1:
    for (const i of where) {
      if (typeof i === 'object') {
        if (Array.isArray(i)) {
          for (const j of i) {
            if (obj.includes(j)) {
              continue loop1;
            }
          }
          return false;
        } else {
          continue;
        }
      } else {
        if (obj.includes(i)) {
          continue;
        } else {
          return false;
        }
      }
    }
  } else if (![Array.isArray(where), Array.isArray(obj)].includes(true)) {
    for (const i in where) {
      if (typeof where[i] === typeof obj[i]) {
        if (typeof where[i] !== 'object') {
          if (where[i] === obj[i]) {
            continue;
          } else {
            return false;
          }
        } else {
          if (search(where[i], obj[i])) {
            continue;
          } else {
            return false;
          }
        }
      } else if (Array.isArray(where[i]) && typeof obj[i] !== 'object') {
        if (where[i].includes(obj[i])) {
          continue;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  } else {
    return false;
  }
  return true;
}

class Database {
  constructor (p) {
    if (!p) throw new Error('No path');
    this.db = open({
      path: path.join(process.cwd(), p),
      encoder: cbor
    });
    const id = this.db.get('REPL_ID')
    if (id) {
      if (id !== process.env.REPL_ID) {
        this.db.clearSync();
        if (process.env.REPL_ID) {
          this.db.putSync('REPL_ID', process.env.REPL_ID);
        }
      }
    } else {
      if (process.env.REPL_ID) {
        this.db.putSync('REPL_ID', process.env.REPL_ID);
      }
    }
    console.log('The database is ready.')
  }

  // value
  set (key, value) {
    if (!key || !value) {
      throw new Error('No key or no value.');
    }
    return new Promise(async (resolve, reject) => {
      await this.db.put(key, value);
      resolve(value);
    });
  }

  // value
  setSync (key, value) {
    if (!key || !value) {
      throw new Error('No key or no value.');
    }
    return this.db.putSync(key, value) ? value : false;
  }

  // value
  get (key) {
    if (!key) throw new Error('No key.');
    return new Promise(async (resolve, reject) => {
      resolve(await this.db.get(key));
    });
  }

  // true / false
  remove (key) {
    if (!key) throw new Error('No key.');
    return new Promise(async (resolve, reject) => {
      resolve(await this.db.remove(key));
    })
  }

  removeSync (key) {
    if (!key) throw new Error('No key.');
    return this.db.removeSync(key);
  }
  
  // { value: value }
  getEntry (key) {
    if (!key) throw new Error('No key.');
    return new Promise(async (resolve, reject) => {
      resolve(await this.db.getEntry(key));
    });
  }

  // value
  increaseValue (key, i = 1) {
    if (!key) throw new Error('No key.');
    return this.db.transaction(() => {
      let v = this.db.get(key);
      if (!v) throw new Error('Cannot get ' + key);
      if (typeof v !== 'number') throw new Error('The value isn\'t a number');
      this.db.put(key, v + i);
      return v + i;
    });
  }

  // value
  increaseValueSync (key, i = 1) {
    if (!key) throw new Error('No key.');
    return this.db.transactionSync(() => {
      let v = this.db.get(key);
      if (!v) throw new Error('Cannot get ' + key);
      if (typeof v !== 'number') throw new Error('The value isn\'t a number');
      this.db.put(key, v + i);
      return v + i;
    });
  }

  // value
  decreaseValue (key, i = 1) {
    if (!key) throw new Error('No key.');
    return this.db.transaction(() => {
      let v = this.db.get(key);
      if (!v) throw new Error('Cannot get ' + key);
      if (typeof v !== 'number') throw new Error('The value isn\'t a number');
      this.db.put(key, v - i);
      return v - i;
    });
  }

  // value
  decreaseValueSync (key, i = 1) {
    if (!key) throw new Error('No key.');
    return this.db.transactionSync(() => {
      let v = this.db.get(key);
      if (!v) throw new Error('Cannot get ' + key);
      if (typeof v !== 'number') throw new Error('The value isn\'t a number');
      this.db.put(key, v - i);
      return v - i;
    });
  }

  ifNoExists(key, callback) {
    if (!key) throw new Error('No key');
    if (!callback) throw new Error('No callback');
    return this.db.ifNoExists(key, callback);
  }

  transaction (callback) {
    if (!callback) throw new Error('No callback');
    this.db.transaction(callback);
  }

  transactionSync (callback) {
    if (!callback) throw new Error('No callback');
    this.db.transactionSync(callback);
  }

  getRange () {
    return this.db.getRange(arguments[0]);
  }
  
  getKeys (options = {}) {
    return this.db.getKeys(options);
  }

  list (prefix = '') {
    return [...this.db.getKeys().filter(k => k.startsWith(prefix))];
  }

  close () {
    return this.db.close();
  }

  doesExist (key, v) {
    return this.db.doesExist(key, v);
  }

  getBinary (key) {
    return this.db.getBinary(key);
  }

  getMany (ids) {
    return this.db.getMany(ids);
  }

  clearAsync () {
    return this.db.clearAsync();
  }

  clearSync () {
    return this.db.clearSync();
  }

  drop () {
    return this.db.drop();
  }

  dropSync () {
    return this.db.dropSync();
  }

  findOne (options = {}) {
    return new Promise((resolve, reject) => {
      const [...keys] = this.db.getKeys();
      for (const i of keys) {
        const value = this.db.get(i);
        if (typeof value !== 'object') continue;
        if (search(options.where, value)) {
          return resolve({ key: i, value });
        }
      }
      resolve({ key: null, value: null });
    });
  }

  findMany({ where = {}, limit = 10, offset = 0 }) {
    return new Promise((resolve, reject) => {
      const [...keys] = this.db.getKeys();
      const results = [];
      let past = 0;

      for (const i of keys) {
        const value = this.db.get(i);
        if (typeof value !== 'object') continue;
        if (search(where, value)) {
          if (past === offset) {
            results.push({ key: i, value });
            if (results.length === limit) {
              break;
            }
          } else {
            past ++;
          }
        }
      }

      resolve(results);
    });
  }
}

export default Database;