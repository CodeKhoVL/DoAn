import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { connectToDB } from "@/lib/mongoDB";
import Product from "@/lib/models/Product";
import Collection from "@/lib/models/Collection";

// Ensure values are arrays
const ensureArray = (value: any): any[] => {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  return value;
};

// Ensure values are numbers
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

// Handle OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export const POST = async (req: NextRequest) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectToDB();

    // Read body and ensure array values are valid
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

    // Ensure collections is an array
    const collections = ensureArray(rawCollections);
    
    // Convert price and expense to numbers
    const price = ensureNumber(rawPrice);
    const expense = ensureNumber(rawExpense);

    if (!title || !description || !media || !category || price < 0.1 || expense < 0.1) {
      return new NextResponse("Not enough data to create a product", {
        status: 400,
      });
    }

    // Create new product with safe array values
    const newProduct = await Product.create({
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
    });

    await newProduct.save();

    // Update collections if they exist
    if (collections && collections.length > 0) {
      try {
        await Promise.all(
          collections.map(async (collectionId) => {
            if (!collectionId) return;
            
            const collection = await Collection.findById(collectionId);
            if (collection) {
              if (!collection.products.includes(newProduct._id)) {
                collection.products.push(newProduct._id);
                await collection.save();
              }
            }
          })
        );
      } catch (collectionError) {
        console.error("Error updating collections:", collectionError);
      }
    }

    return NextResponse.json(newProduct, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (err) {
    console.log("[products_POST]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
};

export const GET = async (req: NextRequest) => {
  try {
    console.log("Fetching products...");
    await connectToDB();

    const products = await Product.find()
      .sort({ createdAt: "desc" })
      .populate({ path: "collections", model: Collection });

    // Ensure response has consistent structure
    const safeProducts = products.map(product => {
      const productObj = product.toObject();
      
      // Ensure array fields are arrays
      productObj.collections = ensureArray(productObj.collections);
      productObj.media = ensureArray(productObj.media);
      productObj.tags = ensureArray(productObj.tags);
      productObj.sizes = ensureArray(productObj.sizes);
      productObj.colors = ensureArray(productObj.colors);
      
      // Ensure price and expense are numbers
      productObj.price = ensureNumber(productObj.price);
      productObj.expense = ensureNumber(productObj.expense);
      
      return productObj;
    });

    console.log(`Successfully fetched ${safeProducts.length} products`);
    
    return NextResponse.json(safeProducts, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (err) {
    console.log("[products_GET]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
};

export const dynamic = "force-dynamic";