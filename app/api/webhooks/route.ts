import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectToDB } from "@/lib/mongoDB";
import Customer from "@/lib/models/Customer";
import Order from "@/lib/models/Order";
import BookReservation from "@/lib/models/BookReservation";

interface OrderItem {
  product: string;
  quantity: number;
  borrowDuration: number;
  status: 'pending' | 'confirmed' | 'borrowed' | 'returned' | 'overdue';
}

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    let body;
    
    try {
      body = JSON.parse(text);
    } catch (e) {
      console.log("Raw body received:", text);
      body = {};
    }

    // Handle reservation webhook
    if (body.type === 'reservation.created') {
      await connectToDB();
      console.log("📚 Processing reservation webhook");
      
      const { reservation, userName, userEmail } = body.data;
      
      // Create or update customer
      let customer = await Customer.findOne({ clerkId: reservation.userId });
      if (!customer) {
        customer = await Customer.create({
          clerkId: reservation.userId,
          name: userName || 'Unknown',
          email: userEmail || 'unknown@example.com'
        });
      }

      // Create new order from reservation
      const order = await Order.create({
        customerClerkId: reservation.userId,
        products: [{
          product: reservation.productId,
          quantity: 1,
          borrowDuration: Math.ceil(
            (new Date(reservation.returnDate).getTime() - new Date(reservation.pickupDate).getTime()) 
            / (1000 * 60 * 60 * 24)
          ),
          status: 'pending'
        }],
        totalAmount: 0,
        orderStatus: 'pending',
        note: reservation.note
      });

      console.log("✅ Created order from reservation:", order._id);
      return NextResponse.json({ success: true });
    }

    // Handle Stripe webhook
    const signature = req.headers.get("Stripe-Signature");
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("❌ Missing Stripe-Signature or Webhook Secret");
      return new NextResponse("Unauthorized", { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      text,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("🧾 session.id from event:", session.id);

      // Ghi log đầy đủ để debug
      console.log("💳 Session data:", JSON.stringify({
        id: session.id,
        customer_details: session.customer_details,
        shipping_details: session.shipping_details,
        amount_total: session.amount_total,
      }, null, 2));

      // Expand để lấy metadata từ sản phẩm
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items", "line_items.data.price.product"],
      });

      const customerInfo = {
        clerkId: session.client_reference_id || "unknown",
        name: session.customer_details?.name || "Unknown",
        email: session.customer_details?.email || "unknown@example.com",
      };

      let shippingAddress = null;
      if (session.customer_details && session.customer_details.address) {
        const address = session.customer_details.address;
        console.log("📦 Customer address found:", address);
        
        if (address.line1 || address.city || address.state || address.postal_code || address.country) {
          shippingAddress = {
            street: address.line1 || "",
            city: address.city || "",
            state: address.state || "",
            postalCode: address.postal_code || "",
            country: address.country || "",
          };
        }
      }

      const lineItems = fullSession.line_items?.data || [];
      console.log("🛍️ Line items count:", lineItems.length);

      const orderItems: OrderItem[] = lineItems.map((item: any) => {
        const metadata = item.price?.product?.metadata || {};
        console.log("🏷️ Product metadata:", metadata);
        
        return {
          product: metadata.productId || null,
          quantity: item.quantity || 1,
          borrowDuration: metadata.borrowDuration ? parseInt(metadata.borrowDuration) : 7, // Default 7 days
          status: 'pending'
        };
      });

      await connectToDB();
      console.log("✅ Connected to MongoDB");

      const newOrder = new Order({
        customerClerkId: customerInfo.clerkId,
        products: orderItems,
        shippingAddress: shippingAddress,
        totalAmount: session.amount_total ? session.amount_total / 100 : 0,
      });

      await newOrder.save();
      console.log("💾 Order saved:", newOrder._id);

      let customer = await Customer.findOne({ clerkId: customerInfo.clerkId });

      if (customer) {
        customer.orders.push(newOrder._id);
        customer.updatedAt = new Date();
        await customer.save();
        console.log("🔄 Updated customer:", customer._id);
      } else {
        customer = new Customer({
          ...customerInfo,
          orders: [newOrder._id],
        });
        await customer.save();
        console.log("✨ Created new customer:", customer._id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}