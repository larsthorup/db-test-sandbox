# db-test-sandbox

Experiments in database migration testing. Optimized for educational value, not production quality.

Prerequisites:

- Node.js
- Docker

```
npm install
npm run mocha:container  # Testing dependencies (testcontainer, Docker)
npm test                 # Passing pipelines for version 0 and 1
npm run 2                # Failing pipeline for version 2
```

Sample output:

```
$ npm run 1

Testing version "1"
  (testing app@1)
  (testing migration@1 on test data)
  (testing migration@1 on production data)
    (Recreated "test" db to schema@0 and transactions@0)
Deploying schema@1
  (Recreated "production" db to schema@0 and transactions@0)
  (Migrated "production" db to schema@1)
  Running app@0
    Users in "production" db
    ciao@diku.dk
    lars@zealake.com
Deploying app@1
  (Updated "production" db with transactions@1)
  Running app@1
    Users in "production" db
    ciao@diku.dk (user)
    ciao@diku.dk (admin)
    lars@zealake.com (user)
```

## Debugging

It might be useful to peek around in the container when running a failing pipeline locally. When enabling this, the pipeline will automatically start "psql" inside the running container, plus show the connection string for connection via an IDE on your own machine.

```
DEBUG_CONTAINER=true npm run 2
```

Sample output:

```
error: could not create unique index "email"
 detail: 'Key (email)=(ciao@diku.dk) is duplicated.',
[...]

----- Entering psql on container to debug.
jdbc:postgresql://localhost:26798/test?user=admin&password=password
----- Type ctrl-d to exit.
psql (13.3)
Type "help" for help.
test=#
```

Then you can type SQL commands, like this:

```
test=# select * from "user";
 id |      email       | isadmin
----+------------------+---------
  1 | lars@zealake.com | f
  2 | ciao@diku.dk     | f
  3 | ciao@diku.dk     | t
(3 rows)

test=# ^D\q
-----
Error: Failed to migrate "test" to version 2
```
