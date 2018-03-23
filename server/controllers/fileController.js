"use strict";

const File = require("../models/file"),
  config = require("../config/main"),
  utils = require("utils")._;

//========================================
// list Route
//========================================
exports.list = function(body, callback) {
  return callback(null, 200, {
    ok: true,
    files: [{ id: "1", firstName: "nombdre", lastName: "lastName" }]
  });
};
