import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectToDB } from "@/lib/mongoDB";
import Customer from "@/lib/models/Customer";
import Order from "@/lib/models/Order";

// Định nghĩa kiểu dữ liệu cho orderItems
interface OrderItem {
  product: string | null;
  color: string;
  size: string;
  quantity: number;
}

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

      // Cải thiện việc xử lý địa chỉ - lấy từ customer_details thay vì shipping_details
      let shippingAddress = null;

      // Kiểm tra cả customer_details.address
      if (session.customer_details && session.customer_details.address) {
        const address = session.customer_details.address;
        console.log("📦 Customer address found:", address);
        
        // Chỉ tạo đối tượng shippingAddress nếu có ít nhất một trường có giá trị
        if (address.line1 || address.city || address.state || address.postal_code || address.country) {
          shippingAddress = {
            street: address.line1 || "",
            city: address.city || "",
            state: address.state || "",
            postalCode: address.postal_code || "",
            country: address.country || "",
          };
        }
      } else if (session.shipping_details && session.shipping_details.address) {
        // Giữ lại code kiểm tra shipping_details như backup
        const shipping = session.shipping_details.address;
        console.log("📦 Shipping details found:", shipping);
        
        if (shipping.line1 || shipping.city || shipping.state || shipping.postal_code || shipping.country) {
          shippingAddress = {
            street: shipping.line1 || "",
            city: shipping.city || "",
            state: shipping.state || "",
            postalCode: shipping.postal_code || "",
            country: shipping.country || "",
          };
        }
      } else {
        console.log("⚠️ No address information in session");
      }

      const lineItems = fullSession.line_items?.data || [];
      console.log("🛍️ Line items count:", lineItems.length);

      const orderItems: OrderItem[] = lineItems.map((item: any) => {
        const metadata = item.price?.product?.metadata || {};
        console.log("🏷️ Product metadata:", metadata);
        
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
        shippingAddress: shippingAddress,  // Có thể null nếu không có thông tin
        shippingRate: session.shipping_cost?.shipping_rate || "",
        totalAmount: session.amount_total ? session.amount_total / 100 : 0, // Đổi /1 thành /100
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