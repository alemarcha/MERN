// Importing Passport, strategies, and config
const passport = require("passport"),
  User = require("../models/user"),
  config = require("./main"),
  JwtStrategy = require("passport-jwt").Strategy,
  ExtractJwt = require("passport-jwt").ExtractJwt,
  fs = require("fs"),
  utils = require("utils")._;

const publicKey = fs.readFileSync(
  global.__basedir + config.jwtPublicKeyPath,
  "utf8"
);

// JWT authentication options
const jwtOptions = {
  // Telling Passport to check authorization headers for JWT
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("JWT"),
  // Telling Passport where to find the secret
  secretOrKey: publicKey,
  algorithms: ["RS256"]
};

// Setting up JWT login strategy
const jwtLogin = new JwtStrategy(jwtOptions, function(payload, done) {
  console.log(jwtOptions);
  if (utils.isEmpty(payload.email)) {
    return done(payload, false);
  }
  done(null, payload);
});

passport.use(jwtLogin);
