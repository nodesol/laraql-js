# NodeSol/LaraQL

NodeSol/LaraQL is a lightweight, Eloquent-inspired JavaScript ORM for [Lighthouse GraphQL](https://lighthouse-php.com). It brings the familiar Laravel syntax to your frontend.

## Installation

```bash
npm install @nodesol/laraql
```

## Setup

Initialize the base model in your application entry point or boot file (e.g., `app.js` or `main.js`).

```javascript
import { Model } from '@nodesol/laraql';

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

### Fetching Data
Use familiar methods like `all()`, `find()`, and `where()`.

```javascript
// Fetch all users
 //if array is given then the return type will be from that other wise taken from class define type at the end if nothing mentioned in return only the id will
 //  be get 
const users = await User.all(['id', 'name', 'email']) OR await User.all();

// Find a single user by ID return type work same as above
const user = await User.find(1, ['name']) OR await User.find(1) ;

// Complex Queries
const activeAdmins = await User.where('type', 'employee')
  .where('is_active', true)
  .orderBy('created_at', 'DESC')
  .get(['id', 'name']);//paginate also work
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
