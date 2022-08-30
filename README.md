# LMDB-search

This an interface to [lmdb](https://www.npmjs.com/package/lmdb), containing several functions to facilitate the search for keys / values, and manipulate the data.

### Features:
* `increaseValue`: Increase a key's value by one or more, if specified.
* `increaseValueSync`: Increase synchronously a key's value by one or more, if specified.
* `decreaseValue`: Decrease a key's value by one or more, if specified.
* `decreaseValueSync`: Decrease synchronously a key's value by one or more, if specified.
* `list`: Lists all of the keys, or all of the keys starting with a prefix if specifed.
* `findOne`: Search and retrieve a key and it's value, if an option is specified.
* `findMany`: Search and retrieve an array of keys and values, if an option is specified.

## Get started
```js
import Database from 'lmdb-search'
// or
const Database = require('lmdb-search');

// we setup the database
const db = new Database('path/to/folder');

// we create a key
db.setSync('key', 'value');

// we access to its value
db.get('key')
.then(value => {
  console.log(value);// 'value'
})
```

## Docs

### class Database(String path)
Returns an instance of the database.
```js
const db = new Database('/path/fo/folder');
```

### set(String key, Any value)
Returns a Promise
```js
db.set('key', 'value')
.then((value) => {
  console.log(value);// 'value'
});
```

### setSync(String key, Any value)
Returns the value of false if it failed.
```js
const value = db.setSync('key', 'value');
console.log(value);// 'value'
```

### findOne(Object options)
It will search a value that match the query (the `where` key in the options).
The query is an object. In this object, you can specify some fields, that the value must have. For example, if you set in the query a value called `name`, and its value is `John Doe`, it will retrieve a value which has `John Doe` as value for the `name` key.
On the other hand, you can specify many possible options. In your query, instead of setting a String as value of the `name` key, you can set an array, with different options, and it will match if a key's value has one of the options as value for the `name` key. 
But if the a value has a key called `name`, with an array as value, the query will match only if this array contains at least all the items in the query's `name` array.

> **In the query, if you specify an object in an array, it will be skipped.**

```js
/*
Example 1
*/
db.set('user', {
  name: 'John'
});

db.findOne({
  where: {
    name: 'John'
  }
}).then(/**/)// it will match

/*
Example 2
*/
*/
db.set('user', {
  name: 'John'
});

db.findOne({
  where: {
    name: ['John', 'Jane']
  }
}).then(/**/)// it will match

/*
Example 3
*/
db.set('user', {
  name: ['John', 'Doe']
});

db.findOne({
  where: {
    name: [['John', 'Jane'], 'Doe']
  }
}).then(/**/)// it will match

/*
Example 4
*/
db.set('user', {
  name: ['John', 'Doe']
});

db.findOne({
  where: {
    name: ['John', 'Jane', 'Doe']
  }
}).then(/**/)// it will NOT match
```

#### findOne query example
```js
db.setSync('user1', {
  name: 'John',
  roles: ['user']
});
db.setSync('user2', {
  name: 'John',
  roles: ['user', 'admin']
});
db.setSync('user3', {
  name: 'Jane',
  roles: ['user', 'admin']
});

db.findOne({
  where: {
    name: 'John',
    roles: ['admin']
  }
})
  .then(({ key, value }) => {
    console.log(key);// 'user2'
    console.log(value);// { name: 'John', roles: ['user', 'admin'] }
  })
```

### findMany(Object options)
The query works as above, but you can specify more things in the options, such as `offset` or `limit` (they are optionnal)

```js
db.setSync('user1', {
  name: 'John',
  roles: ['user']
});
db.setSync('user2', {
  name: 'John',
  roles: ['user', 'admin']
});
db.setSync('user3', {
  name: 'Jane',
  roles: ['user', 'admin']
});

db.findOne({
  where: {
    name: 'John',
    roles: ['user']
  },
  offset: 0,
  limit: 5
})
  .then((arr) => {
    arr.forEach(({ key, value }) => {
      console.log(key);// user1 and user2
    })
  })
```

### get(String key)
Returns a Promise
```js
db.get('key')
.then(value => {
  console.log(value);
});
```

### remove(String key)
Returns a Promise (`true` or `false`)
```js
db.remove('key')
.then(isRemoved => {
  if (isRemoved) {
    console.log('Key removed.')
  } else {
    console.log('Operation failed.')
  }
});
```

### removeSync(String key)
Returns a boolean.
```js
const isRemoved = db.removeSync('key');

if (isRemoved) {
  console.log('Key removed.')
} else {
  console.log('Operation failed.')
}
```

### getEntry(String key)
Returns a Promise
```js
db.getEntry('key')
.then(entry => {
  console.log(entry)// { value: 'value' }
});
```

### increaseValue(String key, Number rise?)
Returns a Promise
```js
db.setSync('number', 1);

db.increaseValue('number')
.then(value => {
  console.log(value);// 2
});

db.increaseValue('number', 5)
.then(value => {
  console.log(value);// 7
});
```

### increaseValueSync(String key, Number rise?)
Returns the new value
```js
db.setSync('number', 1);

let newValue = db.increaseValueSync('number');
console.log(newValue);// 2


newValue = db.increaseValueSync('number', 5);
console.log(newValue);// 7
```

### decreaseValue(String key, Number rise?)
Returns a Promise
```js
db.setSync('number', 10);

db.decreaseValue('number')
.then(value => {
  console.log(value);// 9
});

db.decreaseValue('number', 4)
.then(value => {
  console.log(value);// 5
});
```

### decreaseValueSync(String key, Number rise?)
Returns the new value
```js
db.setSync('number', 10);

let newValue = db.decreaseValueSync('number');
console.log(newValue);// 9


newValue = db.decreaseValueSync('number', 4);
console.log(newValue);// 5
```

### ifNoExists(String key, Function callback)
Return a Promise
```js
db.ifNoExists('random-key', () => {
  console.log("The 'random-key' key doesn't exists.");
});
```

### transaction(Function callback)
Returns a Promise
```js
db.transaction(() => {
  const value = db.get('number');
  value += 1;
  db.setSync(value);
  return true;// succeded
});
```

### transactionSync(Function callback)
Quite the same than before.

### getRange(Object options)
Returns an Iterable.
The limit and the offset are optionnals.
```js
db.getRange({ 
  start: 'key1', 
  end: 'key5', 
  limit: 10, 
  offset: 0 
})
	.filter(({ key, value }) => test(key))
	.forEach(({ key, value }) => {
		// for each key-value pair in the given range that matched the filter
	});
```

### getKeys(Object options)
Same as `getRange`, but it returns only the keys.

### list(String prefix?)
Returns an Array.
```js
db
  .list()
  .forEach(key => {
    console.log(key);
  });

db
  .list('user-')
  .forEach(key => {
    console.log(key);// user-...
  })
```

### close()
Close the current database;

### doesExist(String key) 
Returns a boolean
```js
db.setSync('custom-key', 'custom-value');

console.log( doesExist('custom-key') );// true
console.log( doesExist('random-key') );// false
```

### getBinary(String key)
Returns a Buffer (the binary data for the given key)

### getMany(Array keys)
Asynchronously returns the values for the given keys.

### clearAsync()
Asynchronously removes all the entries in the database.

### clearSync()
Synchronously removes all the entries in the database.

### drop()
Asynchronously removes all the entries in the database, and the database too.

### dropSync()
Synchronously removes all the entries in the database, and the database too.