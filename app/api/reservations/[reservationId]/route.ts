import { connectToDB } from "@/lib/mongoDB";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import BookReservation from "@/lib/models/BookReservation";
import Order from "@/lib/models/Order";
import { Types } from "mongoose";

interface OrderProduct {
  product: Types.ObjectId;
  status: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    await connectToDB();

    const reservation = await BookReservation.findById(params.reservationId)
      .populate('productId');

    if (!reservation) {
      return new NextResponse("Reservation not found", { status: 404 });
    }

    try {
      // Lấy thông tin user từ Clerk
      const user = await fetch(`https://api.clerk.dev/v1/users/${reservation.userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }).then(res => res.json());

      const reservationWithUser = {
        ...reservation.toObject(),
        user: {
          name: `${user.first_name} ${user.last_name}`,
          email: user.email_addresses?.[0]?.email_address
        }
      };

      return NextResponse.json(reservationWithUser);
    } catch (clerkError) {
      console.error("[CLERK_API_ERROR]", clerkError);
      // Vẫn trả về reservation nếu không lấy được thông tin user
      return NextResponse.json(reservation);
    }
  } catch (error) {
    console.error("[RESERVATION_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    const { status } = await req.json();
    if (!status) {
      return new NextResponse("Status is required", { status: 400 });
    }

    await connectToDB();

    // Cập nhật reservation
    const reservation = await BookReservation.findById(params.reservationId);
    if (!reservation) {
      return new NextResponse("Reservation not found", { status: 404 });
    }

    reservation.status = status;
    await reservation.save();

    // Tìm và cập nhật order tương ứng
    const order = await Order.findOne({
      customerClerkId: reservation.userId,
      "products.product": reservation.productId
    });

    if (order) {
      // Map trạng thái từ reservation sang order
      let orderStatus;
      let productStatus;
      switch (status) {
        case 'approved':
          orderStatus = 'confirmed';
          productStatus = 'confirmed';
          break;
        case 'rejected':
          orderStatus = 'cancelled';
          productStatus = 'cancelled';
          break;
        case 'completed':
          orderStatus = 'completed';
          productStatus = 'returned';
          break;
        default:
          orderStatus = 'pending';
          productStatus = 'pending';
      }

      // Cập nhật trạng thái order
      order.orderStatus = orderStatus;
      
      // Cập nhật trạng thái sản phẩm trong order
      const productIndex = order.products.findIndex(
        (p: OrderProduct) => p.product.toString() === reservation.productId.toString()
      );
      
      if (productIndex !== -1) {
        order.products[productIndex].status = productStatus;
      }

      await order.save();
    }

    return NextResponse.json({ 
      message: "Updated successfully",
      reservation,
      order 
    });
  } catch (error) {
    console.error("[RESERVATION_PATCH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}