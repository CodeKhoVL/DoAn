import Product from "@/lib/models/Product";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";

// Hàm tiện ích để đảm bảo giá trị là mảng
const ensureArray = (value: any): any[] => {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  return value;
};

export const GET = async (req: NextRequest, { params }: { params: { productId: string } }) => {
  try {
    await connectToDB();

    const product = await Product.findById(params.productId);

    if (!product) {
      return new NextResponse(JSON.stringify({ message: "Product not found" }), { status: 404 });
    }

    // Đảm bảo collections là mảng
    const productCollections = ensureArray(product.collections);

    // Tìm related products (sản phẩm cùng danh mục hoặc cùng bộ sưu tập)
    const relatedProducts = await Product.find({
      $or: [
        { category: product.category },
        { collections: { $in: productCollections }}
      ],
      _id: { $ne: product._id } // Loại trừ sản phẩm hiện tại
    });

    if (!relatedProducts || relatedProducts.length === 0) {
      return new NextResponse(JSON.stringify({ message: "No related products found" }), { status: 404 });
    }

    // Đảm bảo dữ liệu trả về có cấu trúc nhất quán
    const safeRelatedProducts = relatedProducts.map(relatedProduct => {
      const productObj = relatedProduct.toObject();
      
      // Đảm bảo các trường mảng là mảng
      productObj.collections = ensureArray(productObj.collections);
      productObj.media = ensureArray(productObj.media);
      productObj.tags = ensureArray(productObj.tags);
      productObj.sizes = ensureArray(productObj.sizes);
      productObj.colors = ensureArray(productObj.colors);
      
      return productObj;
    });

    return NextResponse.json(safeRelatedProducts, { status: 200 });
  } catch (err) {
    console.log("[related_GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

export const dynamic = "force-dynamic";