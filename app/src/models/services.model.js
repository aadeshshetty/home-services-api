const mongoose = require("mongoose");

const servicesSchema = (name) => {
  if (mongoose.modelNames().includes(name)) {
    mongoose.deleteModel(name);
  }
  const schema = new mongoose.Schema({
    servicename: {
      type: String,
      required: true,
    },
    Ratings: {
      type: Number,
    },
    Price: {
      type: String,
      required: true,
    },
    Workers: {
      type: String,
    },
    Image: {
      type: String,
    },
  });
  const mod = mongoose.model(name, schema);
  return mod;
};

module.exports = servicesSchema;
