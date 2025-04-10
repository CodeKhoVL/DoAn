import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectToDB } from "@/lib/mongoDB";
import Customer from "@/lib/models/Customer";
import Order from "@/lib/models/Order";

export async function POST(req: NextRequest) {
  try {
    console.log("✅ Webhook received");

    const rawBody = await req.text();
    const signature = req.headers.get("Stripe-Signature");

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("❌ Missing Stripe-Signature or Webhook Secret");
      return new NextResponse("Unauthorized", { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("🔔 Event Type:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("🧾 session.id from event:", session.id);

      // Expand to get full line_items and product metadata
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items", "line_items.data.price.product"],
      });

      const customerInfo = {
        clerkId: session.client_reference_id || "unknown",
        name: session.customer_details?.name || "Unknown",
        email: session.customer_details?.email || "unknown@example.com",
      };

      const shippingAddress = {
        street: session.shipping_details?.address?.line1 || "",
        city: session.shipping_details?.address?.city || "",
        state: session.shipping_details?.address?.state || "",
        postalCode: session.shipping_details?.address?.postal_code || "",
        country: session.shipping_details?.address?.country || "",
      };

      const lineItems = fullSession.line_items?.data || [];

      const orderItems = lineItems.map((item: any) => {
        const metadata = item.price?.product?.metadata || {};
        return {
          product: metadata.productId || null,
          color: metadata.color || "N/A",
          size: metadata.size || "N/A",
          quantity: item.quantity || 1,
        };
      });

      await connectToDB();
      console.log("✅ Connected to MongoDB");

      const newOrder = new Order({
        customerClerkId: customerInfo.clerkId,
        products: orderItems,
        shippingAddress,
        shippingRate: session.shipping_cost?.shipping_rate || "",
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

    return new NextResponse("✅ Webhook handled", { status: 200 });
  } catch (err: any) {
    console.error("❌ [webhooks_POST]", err.message);
    return new NextResponse("❌ Webhook error", { status: 500 });
  }
}
