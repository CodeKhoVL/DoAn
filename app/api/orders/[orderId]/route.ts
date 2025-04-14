import Customer from "@/lib/models/Customer";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

export const GET = async (req: NextRequest, { params }: { params: { orderId: String }}) => {
  try {
    await connectToDB()

    const orderDetails = await Order.findById(params.orderId).populate({
      path: "products.product",
      model: Product
    })

    if (!orderDetails) {
      return new NextResponse(JSON.stringify({ message: "Order Not Found" }), { status: 404 })
    }

    const customer = await Customer.findOne({ clerkId: orderDetails.customerClerkId})

    return NextResponse.json({ orderDetails, customer }, { status: 200 })
  } catch (err) {
    console.log("[orderId_GET]", err)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export const PATCH = async (
  req: NextRequest,
  { params }: { params: { orderId: string } }
) => {
  try {
    const body = await req.json();
    const { orderStatus, productId, productStatus } = body;

    console.log('Received update request:', { orderStatus, productId, productStatus });

    await connectToDB();

    const order = await Order.findById(params.orderId);
    if (!order) {
      console.log('Order not found:', params.orderId);
      return new NextResponse(JSON.stringify({ message: "Order not found" }), {
        status: 404,
      });
    }

    if (orderStatus) {
      console.log('Updating order status from', order.orderStatus, 'to', orderStatus);
      order.orderStatus = orderStatus;
    }

    if (productId && productStatus) {
      try {
        // Ensure productId is a valid ObjectId
        const productObjectId = new mongoose.Types.ObjectId(productId);
        
        // Find product in order using ObjectId
        const productIndex = order.products.findIndex(
          (p: any) => p.product.equals(productObjectId)
        );
        
        if (productIndex !== -1) {
          const productItem = order.products[productIndex];
          console.log('Found product at index', productIndex);
          console.log('Current product status:', productItem.status);
          console.log('Updating to status:', productStatus);
          
          // Update product status
          order.products[productIndex].status = productStatus;
          
          // Set return date if status is borrowed
          if (productStatus === 'borrowed' && order.products[productIndex].borrowDuration) {
            const returnDate = new Date();
            returnDate.setDate(returnDate.getDate() + order.products[productIndex].borrowDuration);
            order.products[productIndex].returnDate = returnDate;
            console.log('Set return date to:', returnDate);
          }
        } else {
          console.log('Product not found in order. ProductId:', productId);
          return new NextResponse(JSON.stringify({ 
            message: "Product not found in order",
            productId,
            availableProducts: order.products.map((p: any) => p.product.toString())
          }), {
            status: 404,
          });
        }
      } catch (error) {
        console.error('Error processing productId:', error);
        return new NextResponse(JSON.stringify({ 
          message: "Invalid product ID format",
          error: error instanceof Error ? error.message : String(error)
        }), {
          status: 400,
        });
      }
    }

    order.updatedAt = new Date();
    await order.save();
    console.log('Order saved successfully');

    // Populate product details before sending response
    const updatedOrder = await Order.findById(params.orderId).populate({
      path: "products.product",
      model: Product
    });

    return NextResponse.json(updatedOrder);
  } catch (err) {
    console.error("[orderId_PATCH]", err);
    return new NextResponse(JSON.stringify({ 
      message: "Internal Server Error",
      error: err instanceof Error ? err.message : String(err)
    }), { 
      status: 500 
    });
  }
};

export const dynamic = "force-dynamic";
