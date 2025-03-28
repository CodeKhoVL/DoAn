import Collection from "@/lib/models/Collection";
import Product from "@/lib/models/Product";
import { connectToDB } from "@/lib/mongoDB";
import { getAuth } from "@clerk/nextjs/server";

import { NextRequest, NextResponse } from "next/server";

// Hàm tiện ích để đảm bảo giá trị là mảng
const ensureArray = (value: any): any[] => {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  return value;
};

// Hàm chuyển đổi ObjectId thành string
const normalizeId = (id: any): string | null => {
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id._id) {
    return typeof id._id === 'string' ? id._id : String(id._id);
  }
  return String(id);
};

export const GET = async (
  req: NextRequest,
  { params }: { params: { productId: string } }
) => {
  try {
    await connectToDB();

    const product = await Product.findById(params.productId).populate({
      path: "collections",
      model: Collection,
    });

    if (!product) {
      return new NextResponse(
        JSON.stringify({ message: "Product not found" }),
        { status: 404 }
      );
    }
    
    // Đảm bảo product có cấu trúc nhất quán
    const safeProduct = product.toObject();
    safeProduct.collections = ensureArray(safeProduct.collections);
    safeProduct.media = ensureArray(safeProduct.media);
    safeProduct.tags = ensureArray(safeProduct.tags);
    safeProduct.sizes = ensureArray(safeProduct.sizes);
    safeProduct.colors = ensureArray(safeProduct.colors);
    
    return new NextResponse(JSON.stringify(safeProduct), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": `${process.env.ECOMMERCE_STORE_URL}`,
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (err) {
    console.log("[productId_GET]", err);
    return new NextResponse("Internal error", { status: 500 });
  }
};

export const POST = async (
  req: NextRequest,
  { params }: { params: { productId: string } }
) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectToDB();

    const product = await Product.findById(params.productId);

    if (!product) {
      return new NextResponse(
        JSON.stringify({ message: "Product not found" }),
        { status: 404 }
      );
    }

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
      price,
      expense,
    } = body;

    // Đảm bảo collections là mảng
    const collections = ensureArray(rawCollections);

    if (!title || !description || !media || !category || !price || !expense) {
      return new NextResponse("Not enough data to update product", {
        status: 400,
      });
    }

    // Chuẩn hóa collections hiện tại của product
    const normalizedProductCollections = ensureArray(product.collections).map(
      collectionId => normalizeId(collectionId)
    ).filter(Boolean);

    // Tìm collections được thêm vào và xóa đi
    const addedCollections = collections.filter(
      collectionId => !normalizedProductCollections.includes(normalizeId(collectionId))
    );

    const removedCollections = normalizedProductCollections.filter(
      collectionId => !collections.map(id => normalizeId(id)).includes(collectionId)
    );

    // Xử lý collections
    try {
      // Xử lý collections được thêm vào
      if (addedCollections.length > 0) {
        await Promise.all(
          addedCollections.map(async (collectionId) => {
            const id = normalizeId(collectionId);
            if (!id) return;
            
            await Collection.findByIdAndUpdate(id, {
              $addToSet: { products: product._id }, // Sử dụng $addToSet để tránh trùng lặp
            });
          })
        );
      }
      
      // Xử lý collections bị xóa đi
      if (removedCollections.length > 0) {
        await Promise.all(
          removedCollections.map(async (collectionId) => {
            const id = normalizeId(collectionId);
            if (!id) return;
            
            await Collection.findByIdAndUpdate(id, {
              $pull: { products: product._id },
            });
          })
        );
      }
    } catch (collectionsError) {
      console.error("Error updating collections:", collectionsError);
      // Tiếp tục xử lý mà không dừng lại
    }

    // Cập nhật sản phẩm
    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      {
        title,
        description,
        media: ensureArray(media),
        category,
        collections,
        tags: ensureArray(tags),
        sizes: ensureArray(sizes),
        colors: ensureArray(colors),
        price,
        expense,
      },
      { new: true }
    ).populate({ path: "collections", model: Collection });

    await updatedProduct.save();

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (err) {
    console.log("[productId_POST]", err);
    return new NextResponse("Internal error", { status: 500 });
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: { productId: string } }
) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectToDB();

    const product = await Product.findById(params.productId);

    if (!product) {
      return new NextResponse(
        JSON.stringify({ message: "Product not found" }),
        { status: 404 }
      );
    }

    // Xóa sản phẩm khỏi tất cả collections
    try {
      const normalizedCollections = ensureArray(product.collections)
        .map(collectionId => normalizeId(collectionId))
        .filter(Boolean);
        
      if (normalizedCollections.length > 0) {
        await Promise.all(
          normalizedCollections.map(async (collectionId) => {
            await Collection.findByIdAndUpdate(collectionId, {
              $pull: { products: product._id },
            });
          })
        );
      }
    } catch (error) {
      console.error("Error removing product from collections:", error);
      // Tiếp tục xử lý mà không dừng lại
    }

    // Xóa sản phẩm
    await Product.findByIdAndDelete(product._id);

    return new NextResponse(JSON.stringify({ message: "Product deleted" }), {
      status: 200,
    });
  } catch (err) {
    console.log("[productId_DELETE]", err);
    return new NextResponse("Internal error", { status: 500 });
  }
};

export const dynamic = "force-dynamic";