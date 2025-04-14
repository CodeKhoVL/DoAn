import Collection from "@/lib/models/Collection";
import Product from "@/lib/models/Product";
import { connectToDB } from "@/lib/mongoDB";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(product, { 
      status: 200,
      headers: corsHeaders
    });
  } catch (err) {
    console.error("[productId_GET]", err);
    return new NextResponse(
      JSON.stringify({ message: "Internal server error" }), 
      { status: 500, headers: corsHeaders }
    );
  }
};

export const PATCH = async (
  req: NextRequest,
  { params }: { params: { productId: string } }
) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    
    await connectToDB();

    const updatedProduct = await Product.findByIdAndUpdate(
      params.productId,
      { ...body },
      { new: true }
    ).populate("collections");

    if (!updatedProduct) {
      return new NextResponse("Product not found", { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (err) {
    console.error("[productId_PATCH]", err);
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
      return new NextResponse("Product not found", { status: 404 });
    }

    // Remove product from all collections
    await Collection.updateMany(
      { products: product._id },
      { $pull: { products: product._id } }
    );

    await product.deleteOne();

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("[productId_DELETE]", err);
    return new NextResponse("Internal error", { status: 500 });
  }
};

export const dynamic = "force-dynamic";