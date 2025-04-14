import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import BookReservation from "@/lib/models/BookReservation";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const reservations = await BookReservation.find()
      .populate({
        path: 'productId',
        select: 'title media category price'
      })
      .sort({ createdAt: -1 });

    // Transform data to match the expected format
    const formattedReservations = reservations.map(reservation => {
      const reservationObj = reservation.toObject();
      return {
        ...reservationObj,
        product: reservationObj.productId, // Move productId data to product field
        productId: reservationObj.productId._id // Keep the ID in productId
      };
    });

    return NextResponse.json(formattedReservations);
  } catch (error) {
    console.error("[RESERVATIONS_GET]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";