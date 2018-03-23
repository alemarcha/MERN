const mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  config = require("../config/main");

//================================
// File Schema
//================================
const FileSchema = new Schema(
  {
    name: {
      type: String,
      require: true
    },
    user: {
      type: String
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "File"
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job"
    },
    path: {
      type: String,
      require: true
    },
    format: {
      type: String,
      require: true
    },
    type: {
      type: String,
      require: true
    },
    size: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

FileSchema.pre("save", function(next) {
  console.log("Saving File");
  next();
});

module.exports = mongoose.model("File", FileSchema);
