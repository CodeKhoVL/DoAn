import mongoose from "mongoose";

const bookReservationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  reservationDate: {
    type: Date,
    required: true
  },
  pickupDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    required: true
  },
  note: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const BookReservation = mongoose.models.BookReservation || mongoose.model("BookReservation", bookReservationSchema);

export default BookReservation;