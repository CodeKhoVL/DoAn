import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customerClerkId: String,
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: Number,
      borrowDuration: Number, // Số ngày mượn
      returnDate: Date, // Ngày phải trả
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'borrowed', 'returned', 'overdue'],
        default: 'pending'
      }
    },
  ],
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  note: String,
  totalAmount: Number, // Phí đặt cọc
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
