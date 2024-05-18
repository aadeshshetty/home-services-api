const { model, Schema } = require("mongoose");

const cartsSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  servicename: {
    type: String,
    required: true,
  },
  Price: {
    type: String,
    required: true,
  },
  Workers: {
    type: String,
  },
});

module.exports = model("Cart", cartsSchema);
