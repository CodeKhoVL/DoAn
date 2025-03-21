import { connectToDB } from "@/lib/mongoDB";
// import { getAuth } from "@clerk/nextjs/server"; // Tạm thời comment lại
import { NextRequest, NextResponse } from "next/server";

import Collection from "@/lib/models/Collection";

export const POST = async (req: NextRequest) => {
  try {
    // Tạm thời bỏ qua phần xác thực
    // const { userId } = getAuth(req);
    // if (!userId) {
    //   return new NextResponse("Unauthorized", { status: 403 })
    // }

    console.log("[collections_POST] Starting collection creation");
    
    await connectToDB()
    console.log("[collections_POST] Connected to DB");

    let body;
    try {
      body = await req.json();
      console.log("[collections_POST] Request body:", body);
    } catch (err) {
      console.error("[collections_POST] Error parsing request body:", err);
      return NextResponse.json({ message: "Invalid request format" }, { status: 400 });
    }

    const { title, description, image } = body;
    console.log("[collections_POST] Extracted fields:", { title, description, imageLength: image?.length || 0 });

    if (!title || !image) {
      console.log("[collections_POST] Missing required fields");
      return NextResponse.json({ message: "Title and image are required" }, { status: 400 });
    }

    // Kiểm tra collection đã tồn tại
    const existingCollection = await Collection.findOne({ title });
    if (existingCollection) {
      console.log("[collections_POST] Collection already exists:", title);
      return NextResponse.json({ message: "Collection already exists" }, { status: 400 });
    }

    console.log("[collections_POST] Creating new collection");
    const newCollection = new Collection({
      title,
      description,
      image,
    });

    console.log("[collections_POST] Saving collection");
    await newCollection.save();
    console.log("[collections_POST] Collection saved successfully:", newCollection._id);

    return NextResponse.json(newCollection, { status: 201 });
  } catch (err) {
    console.error("[collections_POST]", err);
    return NextResponse.json(
      { message: "Internal Server Error", error: (err as Error).message },
      { status: 500 }
    );
  }
}

export const GET = async (req: NextRequest) => {
  try {
    console.log("[collections_GET] Fetching collections");
    await connectToDB();

    const collections = await Collection.find().sort({ createdAt: "desc" });
    console.log(`[collections_GET] Found ${collections.length} collections`);

    return NextResponse.json(collections, { status: 200 });
  } catch (err) {
    console.error("[collections_GET]", err);
    return NextResponse.json(
      { message: "Internal Server Error", error: (err as Error).message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";