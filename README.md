# db-test-sandbox

Experiments in database migration testing. Optimized for educational value, not production quality.

Prerequisites:

- Node.js
- Docker

```
npm install
npm run mocha:container
npm test
```

Todo

- version 0 (users)
  - migration, test, migrate, app, transactions, run
- version 1 (isadmin)
  - migration, test, migrate, run, app, transactions, run
- version 2 (unique email)
  - migration, test, fail
- version 3 (privilege)
  - migration, test, migrate, run, app, transactions, run
