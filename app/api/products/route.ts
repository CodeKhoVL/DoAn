import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { connectToDB } from "@/lib/mongoDB";
import Product from "@/lib/models/Product";
import Collection from "@/lib/models/Collection";

// Hàm tiện ích để đảm bảo giá trị là mảng
const ensureArray = (value: any): any[] => {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  return value;
};

// Đảm bảo giá trị là số
const ensureNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0.1 : parsed;
  }
  if (value && typeof value === 'object') {
    if (value.toString) {
      try {
        const parsed = parseFloat(value.toString());
        return isNaN(parsed) ? 0.1 : parsed;
      } catch (error) {
        return 0.1;
      }
    }
  }
  return 0.1;
};

export const POST = async (req: NextRequest) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectToDB();

    // Đọc body và đảm bảo các giá trị mảng đều hợp lệ
    const body = await req.json();
    
    const {
      title,
      description,
      media,
      category,
      collections: rawCollections,
      tags,
      sizes,
      colors,
      price: rawPrice,
      expense: rawExpense,
    } = body;

    // Đảm bảo collections là mảng
    const collections = ensureArray(rawCollections);
    
    // Chuyển đổi price và expense thành số
    const price = ensureNumber(rawPrice);
    const expense = ensureNumber(rawExpense);

    if (!title || !description || !media || !category || price < 0.1 || expense < 0.1) {
      return new NextResponse("Not enough data to create a product", {
        status: 400,
      });
    }

    // Tạo product mới với các giá trị mảng an toàn
    const newProduct = await Product.create({
      title,
      description,
      media: ensureArray(media),
      category,
      collections,
      tags: ensureArray(tags),
      sizes: ensureArray(sizes),
      colors: ensureArray(colors),
      price,  // Đã được chuyển đổi thành số
      expense, // Đã được chuyển đổi thành số
    });

    await newProduct.save();

    // Cập nhật collections - chỉ xử lý nếu có collections
    if (collections && collections.length > 0) {
      try {
        await Promise.all(
          collections.map(async (collectionId) => {
            if (!collectionId) return; // Bỏ qua nếu ID không hợp lệ
            
            const collection = await Collection.findById(collectionId);
            if (collection) {
              // Kiểm tra xem product đã tồn tại trong collection chưa
              if (!collection.products.includes(newProduct._id)) {
                collection.products.push(newProduct._id);
                await collection.save();
              }
            }
          })
        );
      } catch (collectionError) {
        console.error("Error updating collections:", collectionError);
        // Tiếp tục thực hiện mà không dừng lại
      }
    }

    return NextResponse.json(newProduct, { status: 200 });
  } catch (err) {
    console.log("[products_POST]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
};

export const GET = async (req: NextRequest) => {
  try {
    await connectToDB();

    const products = await Product.find()
      .sort({ createdAt: "desc" })
      .populate({ path: "collections", model: Collection });

    // Đảm bảo response trả về đúng cấu trúc
    const safeProducts = products.map(product => {
      const productObj = product.toObject();
      
      // Đảm bảo các trường mảng luôn là mảng
      productObj.collections = ensureArray(productObj.collections);
      productObj.media = ensureArray(productObj.media);
      productObj.tags = ensureArray(productObj.tags);
      productObj.sizes = ensureArray(productObj.sizes);
      productObj.colors = ensureArray(productObj.colors);
      
      // Đảm bảo price và expense là số
      productObj.price = ensureNumber(productObj.price);
      productObj.expense = ensureNumber(productObj.expense);
      
      return productObj;
    });

    return NextResponse.json(safeProducts, { status: 200 });
  } catch (err) {
    console.log("[products_GET]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
};

export const dynamic = "force-dynamic";