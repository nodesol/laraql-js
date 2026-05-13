# LaraQL

LaraQL is a lightweight, Eloquent-inspired JavaScript ORM for [Lighthouse GraphQL](https://lighthouse-php.com). It brings the familiar Laravel syntax to your frontend.

## Installation

```bash
npm install nodesol/laraql
```

## Setup

Initialize the base model in your application entry point or boot file (e.g., `app.js` or `main.js`).

```javascript
import { Model } from 'laraql';

Model.init({
  url: 'https://your-api.com',
  headersCallback: () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  })
});
```

## Basic Usage

### Defining a Model
Simply extend the base `Model` class.

```javascript
import { Model } from 'laraql';

class User extends Model {}
```

### Fetching Data
Use familiar methods like `all()`, `find()`, and `where()`.

```javascript
// Fetch all users
const users = await User.all(['id', 'name', 'email']);

// Find a single user by ID
const user = await User.find(1, ['name']);

// Complex Queries
const activeAdmins = await User.where('type', 'employee')
  .where('is_active', true)
  .orderBy('created_at', 'DESC')
  .get(['id', 'name']);
```

### Pagination
LaraQL supports Lighthouse's `@paginate` directive out of the box.

```javascript
const { data, paginatorInfo } = await User.where('active', true)
  .paginate(15, 1)
  .get(['id', 'name']);

console.log(paginatorInfo.total);
```

### Complex Where Conditions
For nested `AND`/`OR` logic, use `whereRaw()`.

```javascript
const users = await User.whereRaw({
  OR: [
    { column: 'STATUS', operator: EQ, value: 'ACTIVE' },
    { column: 'IS_ADMIN', operator: EQ, value: true }
  ]
}).get();
```

## License
The MIT License (MIT).