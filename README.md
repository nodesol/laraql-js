# NodeSol/LaraQL

NodeSol/LaraQL is a lightweight, Eloquent-inspired JavaScript ORM for [Lighthouse GraphQL](https://lighthouse-php.com). It brings the familiar Laravel syntax to your frontend.

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
import { Model } from '@nodesol/laraql';

class User extends Model {

  //must be defined in all resourece the input will be decide from here
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
  // if any field that were send on change they will be inside dirty
  static dirty = [
    'user_lastname',
    'sub_system'
  ]
  //default return type if not mentioned in methods if not defined default will be id
  static returnType = ` 
    id
    email
    email_verified_at
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
    }`
}
```

---

# Defining a Model

Create a model by extending the base `Model` class.

```javascript
// Fetch all users
 //if array is given then the return type will be from that other wise taken from class define type at the end if nothing mentioned in return only the id will
 //  be get 
const users = await User.all(['id', 'name', 'email']) OR await User.all();

// Find a single user by ID return type work same as above
const user = await User.find(1, ['name']) OR await User.find(1) ;

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
  .get(['id', 'name']);//paginate also work
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
const users = await User.whereRaw({
  OR: [
    { column: 'STATUS', operator: EQ, value: 'ACTIVE' },
    { column: 'IS_ADMIN', operator: EQ, value: true }
  ]
}).get();//paginate also work
```

## License
The MIT License (MIT).

### Update with find
```vue
    <q-input label="First Name" v-model="user.user_firstname" />
    <q-input label="Last Name" v-model="user.user_lastname" />
    <q-input label="Email" v-model="user.email" />
    <q-input label="sub_system" v-model="user.sub_system"/>
    <q-btn label="update" dense color="blue" @click="user.update()" />
    //change the values in input field will be updated on update button
```
```javascript
const user = reactive(new User());

onMounted(async()=>{
  const data = User.find(1);
  Object.assign(user,data);
})

```

### Create
```vue
<q-input label="First Name" v-model="user.user_firstname" />
<q-input label="Last Name" v-model="user.user_lastname" />
<q-input label="Email" v-model="user.email" />
<q-input label="sub_system" v-model="user.sub_system"/>
<q-input label="hr_id" v-model.number="user.hr_id"/>
<q-btn label="create" dense color="blue" @click="user.save()" />
```

```javascript
const user = reactive(new User());
```


### Delete


User.delete(1);
