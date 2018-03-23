const express = require("express");
const FileController = require("../controllers/fileController");

module.exports.init = function(apiRoutes, requireAuth, manageResponse) {
  const fileRoutes = express.Router();
  // Set auth routes as subgroup/middleware to apiRoutes
  apiRoutes.use("/files", fileRoutes);
  fileRoutes.get("/list", function(req, res, next) {
    FileController.list(null, (err, status, response) => {
      manageResponse(err, status, response, res, next);
    });
  });
};
