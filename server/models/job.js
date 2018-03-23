const mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  config = require("../config/main");

//================================
// Job Schema
//================================
const JobSchema = new Schema(
  {
    slurmId: {
      type: String
    },
    user: {
      type: String
    },
    name: {
      type: String
    },
    description: {
      type: String
    },
    tool: {
      type: String
    },
    status: {
      type: String
    },
    folder: {
      type: Schema.Types.ObjectId,
      ref: "File"
    }
  },
  {
    timestamps: true
  }
);

JobSchema.pre("save", function(next) {
  console.log("Saving job");
  next();
});

module.exports = mongoose.model("Job", JobSchema);
