import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongoDB";
import Collection from "@/lib/models/Collection";
import Product from "@/lib/models/Product";

export const GET = async (
  req: NextRequest,
  { params }: { params: { collectionId: string } }
) => {
  try {
    await connectToDB();

    const collection = await Collection.findById(params.collectionId).populate({ path: "products", model: Product });

    if (!collection) {
      return NextResponse.json(
        { message: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(collection, { status: 200 });
  } catch (err) {
    console.log("[collectionId_GET]", err);
    return NextResponse.json(
      { message: "Internal server error", error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
};

export const POST = async (
  req: NextRequest,
  { params }: { params: { collectionId: string } }
) => {
  try {
    // Thêm log để debug authentication
    console.log("Starting collection update process");
    
    let userId;
    try {
      const auth = getAuth(req);
      userId = auth.userId;
      console.log("Authentication successful, userId:", userId);
    } catch (authError) {
      console.error("Authentication error:", authError);
      return NextResponse.json(
        { message: "Authentication failed", error: String(authError) },
        { status: 401 }
      );
    }

    if (!userId) {
      console.log("No userId found");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log("Connecting to database");
    await connectToDB();

    console.log("Finding collection with ID:", params.collectionId);
    let collection = await Collection.findById(params.collectionId);

    if (!collection) {
      console.log("Collection not found");
      return NextResponse.json({ message: "Collection not found" }, { status: 404 });
    }

    console.log("Parsing request body");
    const body = await req.json();
    const { title, description, image } = body;
    console.log("Request data:", { title, hasDescription: !!description, hasImage: !!image });

    if (!title || !image) {
      console.log("Missing required fields");
      return NextResponse.json(
        { message: "Title and image are required" },
        { status: 400 }
      );
    }

    console.log("Updating collection");
    collection = await Collection.findByIdAndUpdate(
      params.collectionId,
      { title, description, image },
      { new: true }
    );

    console.log("Collection updated successfully");
    return NextResponse.json(collection, { status: 200 });
  } catch (err) {
    console.error("[collectionId_POST] Error:", err);
    return NextResponse.json(
      { message: "Internal server error", error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: { collectionId: string } }
) => {
  try {
    let userId;
    try {
      const auth = getAuth(req);
      userId = auth.userId;
    } catch (authError) {
      console.error("Authentication error:", authError);
      return NextResponse.json(
        { message: "Authentication failed" },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDB();

    await Collection.findByIdAndDelete(params.collectionId);

    await Product.updateMany(
      { collections: params.collectionId },
      { $pull: { collections: params.collectionId } }
    );

    return NextResponse.json(
      { message: "Collection deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.log("[collectionId_DELETE]", err);
    return NextResponse.json(
      { message: "Internal server error", error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";
