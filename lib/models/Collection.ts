import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  image: {
    type: String,
    required: true,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    }
  ],
  // Thêm trường để lưu Clerk ID của người tạo
  createdBy: {
    type: String,
    required: true,
  },
  // Nếu bạn có User model và muốn tham chiếu trực tiếp
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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

const Collection = mongoose.models.Collection || mongoose.model("Collection", collectionSchema);

export default Collection;