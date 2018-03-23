process.env.ENVIRONMENT = "test";
let jwtHashWithDifferentSecretKey =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YTgzZWUxZDI1ZGQzNzA0ZDM0MmMzZTgiLCJpYXQiOjE1MjA5MzI3NzgsImV4cCI6MTUyOTkwMjAwMH0.YqnAxi7m92ieWdwmSz6tFt7Vt9KOkrUjTFIUpQmmzbqUArR9x21D5r0za1d-wPtJrTmkmyquU6Dc3RPuxNOyN31G5Pee77etLd8ORoPr7NfmeFPRd2KHEy3j7bSzFCDB0lnQzvpvnNQ6pYe7dNx5TbdZSD36mF3tKUa9zFcaEe2jBFuToomSkrw7W06MaTpF_UHzndi8TqEkNXyDDk9ihbEftZ9pso6QvtmBCJTK-aM-ZeUTjtWm_-8pPQJCXcXC2zB3E38yc9lBdEXF9JODHZQLQSaSZOAxrvKFBL5baKXUU-VQlXWobI_txl_D3Coxc5UhhAuI9YcBh7hgDtujcQ-yvt19df4grPMJ2IYxg-Kb4TFePz3S1qcuvQixUFkrdz1mFqwPgzrU3jj368xjRw6XC0MwYlLrmBfnCCeNFGic9RhT86SkOipQQL0Pw_0gP6REIsoRc8wjBgDjhdMiUPmROJ1NxdS003h3yvbd1l9VmvrNMMdIu3_mYPo70zsyCioRYk6s3BOBU0jb6oYvdvI57-tRvj1ENhLIGo8VECpB08fJ-vqLvX4_6-EBCIOPqgHFObXoEOnw8FESfDUUIBF1ecD1OSrnEC5H7gzz84dg3uriAZ7xe410jWCQtIug2WAvZPu49y2EJW545nwvEcMUqWv6bRkYadZ2K70aov4";
let jwtExpired =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YTgzZWUxZDI1ZGQzNzA0ZDM0MmMzZTgiLCJpYXQiOjE1MjA5MzI3NzgsImV4cCI6MTUyMDAwMjAwMH0.vonURWH11B1l3Q-zXOXA7WZoUOOH6kJOI15r6QtEKEgVdBtgVy9vUNQsPzhzpjzEBKJIWxi_6U0RU8w4ppojhzPtTJFcyBQgpvRBqy9EnCCxPMTZr-uOSB3L6BW47SfZGZbfqZfpv-ErultufQjhTzbcM5nF574BWUKal2nyytMCnKJiydFNK9XPMNFXRBWYwFwGfoEZ4EzjyzqC8oi-Byb1ZpLYI3SIExTOt8yx_mEh8HXEooQqDVmlNPViIsWzCm59OYd3yYDz8SlLmcsFCtLQPrQzBeGIYZvslkgTTzq6cK7io3i0qEqHASAnf6KA6Dd83KkQuneY3XguFaj4XP3I6r3pT8TkQWt7dfWD-ZItc7u_v5Hp-eOR1l3CJQnnxAir_YfDbxR9q7VindyChUsVeio1IGrmWP_5z0Suhj6jlKVYtZY2buzwRZvKpWHTDKJGSmY9zYR5UL2RQ4fe7CLki5qtAR48OOW3QfH6VvA6RjuICjj876jHB2O6QvWut5wmD0gS_HWLwKpYdER3l-96y5X9eTejNPHnj2O8gLx1xEdPfoeixVFjNTZPtwsfDztThSOkjfsx3KfiV9moSu-2rCUtegSKue57Aaj9TMCmm0cxEPc0DgUAXwHBQO1EQL_vH5IL-7-WIiQwwEu5QH-tjQSW0TwUWWyfxmkTkVg";
let jwtValid = "";

let mongoose = require("mongoose");
let app = require("../server.js");
// let config = require("./test_variables.js");
let request = require("supertest")(app);
let assert = require("chai").assert;
let expect = require("chai").expect;

/**
 * Integration tests with TDD Styles
 * */

//clean collections
before(function(done) {
  function clearCollections() {
    for (var collection in mongoose.connection.collections) {
      mongoose.connection.dropCollection(collection, function(err, result) {});
    }
    return done();
  }
  return clearCollections();
});

//run once after all tests
// after(function(done) {
//   if (true) {
//     console.log("Deleting test database");
//     mongoose.connection.db.dropDatabase(done);
//   } else {
//     console.log(
//       "Not deleting test database because it already existed before run"
//     );
//     done();
//   }
// });

//found 302
describe("(0.0), GET /", function() {
  it("should render REST - Swagger Babelomics", function(done) {
    request
      .get("/")
      .expect(302)
      .end(done);
  });
});

//API OK
describe("(0.1), GET /api/ping response", function() {
  it("should render 200 ok", function(done) {
    request
      .get("/api/ping")
      .expect(200)
      .expect({
        ok: true
      })
      .end(done);
  });
});

// Cover 404 error
describe("(0.1.1), Handle 404 error test", function() {
  it("should try to find a route that does not exist ", function(done) {
    request
      .get("/api/asfsz")
      .set("Content-Type", "application/json")
      .expect(404)
      .end(function(err, res) {
        assert.isNotOk(res.body.ok);
        done(err);
      });
  });
});
