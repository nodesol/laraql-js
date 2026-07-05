# NodeSol/LaraQL

**NodeSol/LaraQL** is a lightweight, Eloquent-inspired JavaScript ORM for GraphQL APIs powered by Lighthouse GraphQL. It brings a familiar Laravel-style syntax to your frontend, making GraphQL feel like working with Laravel Eloquent.

Built for developers who want a clean, expressive, and familiar query experience in JavaScript applications such as Vue, Quasar, React, or plain JavaScript.

---

## Features

✅ Laravel Eloquent-inspired syntax  
✅ Works with Lighthouse GraphQL  
✅ Query Builder (`where`, `orderBy`, `paginate`)  
✅ Dirty field tracking for optimized updates  
✅ Dynamic GraphQL return types  
✅ Model-based architecture  
✅ Create, Update, Delete support  
✅ Vue / Quasar friendly  
✅ Lightweight and simple API

---

## Installation

Install LaraQL using npm:

```bash
npm install @nodesol/laraql
```

---

## Setup

Initialize the base model in your application entry point (`main.js`, `app.js`, or Quasar boot file).

```javascript
import { Model } from '@nodesol/laraql';

Model.init({
  url: 'https://your-api.com/graphql',

  headersCallback: () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  })
});
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `url` | `string` | Your GraphQL endpoint |
| `headersCallback` | `function` | Dynamically attach headers to requests |

### Example with Quasar Boot File

```javascript
// boot/laraql.js

import { boot } from 'quasar/wrappers';
import { Model } from '@nodesol/laraql';

export default boot(() => {
  Model.init({
    url: 'https://your-api.com/graphql',

    headersCallback: () => ({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    })
  });
});
```

---

# Defining a Model

Create a model by extending the base `Model` class.

```javascript
import { Model } from '@nodesol/laraql';

export class User extends Model {

  // Fields allowed in create/update operations
  static fillable = [
    'sub_system',
    'email',
    'hr_id',
    'user_firstname',
    'user_lastname',
    'designation',
    'is_visible',
    'password',
  ];

  // Fields tracked for updates
  static dirty = [
    'user_lastname',
    'sub_system'
  ];

  // Default GraphQL return fields
  static returnType = `
    id
    email
    hr_id
    user_firstname
    user_lastname
    designation
    is_visible
    created_at
    updated_at

    roles {
      id
      team_id
      name
      guard_name
      created_at
      updated_at
    }

    permissions {
      name
      guard_name
      created_at
      updated_at
    }
  `;
}
```

### Model Properties

| Property | Description |
|----------|-------------|
| `fillable` | Fields allowed during `save()` and `update()` |
| `dirty` | Tracks changed fields for optimized updates |
| `returnType` | Default GraphQL fields returned |

---

# Fetching Data

LaraQL provides familiar Eloquent-style methods such as `all()`, `find()`, and `where()`.

---

## Get All Records

### Using Custom Return Fields

```javascript
const users = await User.all([
  'id',
  'user_firstname',
  'email'
]);
```

### Using Default Return Type

```javascript
const users = await User.all();
```

### Return Type Priority

LaraQL resolves return fields in this order:

1. Explicitly passed fields
2. `static returnType`
3. `id` (fallback)

---

## Find a Single Record

### Custom Return Fields

```javascript
const user = await User.find(1, [
  'id',
  'user_firstname'
]);
```

### Using Default Return Type

```javascript
const user = await User.find(1);
```

---

# Query Builder

Build expressive queries using Eloquent-style chaining.

```javascript
const users = await User
  .where('designation', 'Manager')
  .where('is_visible', true)
  .orderBy('created_at', 'DESC')
  .get([
    'id',
    'user_firstname',
    'email'
  ]);
```

---

## Multiple Where Conditions

```javascript
const users = await User
  .where('department', 'IT')
  .where('status', 'ACTIVE')
  .get();
```

---

## Order By

```javascript
const users = await User
  .orderBy('created_at', 'DESC')
  .get();
```

---

# Pagination

LaraQL supports Lighthouse GraphQL pagination (`@paginate`) out of the box.

```javascript
const { data, paginatorInfo } = await User
  .where('is_visible', true)
  .paginate(15, 1)
  .get([
    'id',
    'user_firstname',
    'email'
  ]);

console.log(paginatorInfo.total);
console.log(data);
```

---

# Complex Queries

For nested `AND` / `OR` conditions, use `whereRaw()`.

```javascript
const users = await User
  .whereRaw({
    OR: [
      {
        column: 'STATUS',
        operator: 'EQ',
        value: 'ACTIVE'
      },
      {
        column: 'IS_ADMIN',
        operator: 'EQ',
        value: true
      }
    ]
  })
  .get();
```

Pagination also works with `whereRaw()`.

---

# Creating Records

Create a new model instance and call `save()`.

## Vue / Quasar Example

```vue
<template>
  <q-input
    label="First Name"
    v-model="user.user_firstname"
  />

  <q-input
    label="Last Name"
    v-model="user.user_lastname"
  />

  <q-input
    label="Email"
    v-model="user.email"
  />

  <q-input
    label="Sub System"
    v-model="user.sub_system"
  />

  <q-input
    label="HR ID"
    v-model.number="user.hr_id"
  />

  <q-btn
    label="Create"
    color="primary"
    @click="createUser"
  />
</template>
```

```javascript
import { reactive } from 'vue';

const user = reactive(new User());

const createUser = async () => {
  await user.save();
};
```

---

# Updating Records

Fetch a record using `find()`, modify fields, then call `update()`.

## Vue / Quasar Example

```vue
<template>
  <q-input
    label="First Name"
    v-model="user.user_firstname"
  />

  <q-input
    label="Last Name"
    v-model="user.user_lastname"
  />

  <q-input
    label="Email"
    v-model="user.email"
  />

  <q-input
    label="Sub System"
    v-model="user.sub_system"
  />

  <q-btn
    label="Update"
    color="primary"
    @click="updateUser"
  />
</template>
```

```javascript
import { reactive, onMounted } from 'vue';

const user = reactive(new User());

onMounted(async () => {
  const data = await User.find(1);

  Object.assign(user, data);
});

const updateUser = async () => {
  await user.update();
};
```

### Dirty Field Updates

Only modified fields are sent during updates.

Example:

```javascript
user.user_firstname = 'John';

await user.update();
```

Only changed values will be sent to the API.

---

# Deleting Records

Delete a record by ID.

```javascript
await User.delete(1);
```

---

# API Reference

## Static Methods

### `all(returnType?)`

Fetch all records.

```javascript
await User.all();
```

---

### `find(id, returnType?)`

Find a single record by ID.

```javascript
await User.find(1);
```

---

### `where(column, value)`

Add a where condition.

```javascript
User.where('status', 'ACTIVE');
```

---

### `whereRaw(query)`

Add nested conditions.

```javascript
User.whereRaw({
  OR: [
    {
      column: 'STATUS',
      operator: 'EQ',
      value: 'ACTIVE'
    }
  ]
});
```

---

### `orderBy(column, direction)`

Sort records.

```javascript
User.orderBy('created_at', 'DESC');
```

---

### `paginate(perPage, page)`

Enable pagination.

```javascript
User.paginate(10, 1);
```

---

### `get(returnType?)`

Execute query builder request.

```javascript
User.where('status', true).get();
```

---

## Instance Methods

### `save()`

Create a new record.

```javascript
await user.save();
```

---

### `update()`

Update an existing record.

```javascript
await user.update();
```

---

# Best Practices

### Define `fillable`

Always define `fillable` to prevent unexpected fields from being sent.

```javascript
static fillable = [
  'name',
  'email'
];
```

### Use `dirty` Fields

Use `dirty` fields to optimize update requests.

```javascript
static dirty = [
  'name'
];
```

### Use `returnType`

Define `returnType` to avoid repeating GraphQL fields.

```javascript
static returnType = `
  id
  name
  email
`;
```

---

# Requirements

- GraphQL API
- Lighthouse GraphQL
- JavaScript runtime (Vue, Quasar, React, etc.)

---

# License

This project is licensed under the **MIT License**.

---

Made with ❤️ by NodeSol