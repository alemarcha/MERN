const express = require("express");

module.exports.init = function(apiRoutes, requireAuth) {
  const authRoutes = express.Router();
  // Set auth routes as subgroup/middleware to apiRoutes
  apiRoutes.use("/auth", authRoutes);
  apiRoutes.get("/users", function(req, res) {
    res.status(200).json({
      ok: true,
      users: [{ id: "1", firstName: "nombdre", lastName: "lastName" }]
    });
  });
};
