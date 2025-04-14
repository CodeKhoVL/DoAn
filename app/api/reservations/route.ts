import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import BookReservation from "@/lib/models/BookReservation";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const reservations = await BookReservation.find()
      .populate('productId')
      .sort({ createdAt: -1 });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("[RESERVATIONS_GET]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";