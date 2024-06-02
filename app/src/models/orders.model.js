const { model, Schema } = require("mongoose");

const orderSchema = new Schema(
  {
    UserId: {
      type: String,
      required: true,
    },
    PaymentStatus: {
      type: String,
      required: true,
    },
    ReceiptId: {
      type: String,
      required: true,
    },
    Amount: {
      type: String,
      required: true,
    },
    CartList: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = model("Orders", orderSchema);
