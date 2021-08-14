# db-test-sandbox

Experiments in database migration testing.

Prerequisites:

- Node.js
- Docker

```
npm install
npx mocha
npm test
```

Todo

- version 0 (users)
  - schema, app, run, transactions, run
- version 1 (isadmin)
  - migration, test, migrate, run, app, run, transactions, run
- version 2 (unique email)
  - migration, test, fail
- version 3 (privilege)
  - migration, test, migrate, run, app run, transactions, run
