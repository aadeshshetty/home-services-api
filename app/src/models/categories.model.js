const { model, Schema } = require("mongoose");

const categoriesSchema = new Schema(
  {
    categoryname: {
      type: String,
      required: true,
      unique: true,
    },
    rating: {
      type: Number,
    },
    image: {
      type: String,
      required: true,
    },
  },
  { collection: "categories" }
);

module.exports = model("Categories", categoriesSchema);
