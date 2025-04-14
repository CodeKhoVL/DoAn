import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { cartItems, customer } = await req.json();

    console.log("📦 Received cartItems:", JSON.stringify(cartItems, null, 2));
    console.log("👤 Received customer:", customer);

    if (!cartItems || !customer) {
      console.warn("⚠️ Thiếu dữ liệu cart hoặc customer");
      return new NextResponse("Not enough data to checkout", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ["VN", "US"],
      },
      shipping_options: [
        { shipping_rate: "shr_1RCHd9Ra98mO2gvI3TUgVBwD" },
        { shipping_rate: "shr_1RCHcgRa98mO2gvIo2whqOte" },
      ],
      line_items: cartItems.map((cartItem: any) => {
        const rawPrice = cartItem.item.price;
        const price =
          typeof rawPrice === "object" && rawPrice?.$numberDecimal
            ? parseFloat(rawPrice.$numberDecimal)
            : Number(rawPrice);

        const item = {
          price_data: {
            currency: "vnd",
            product_data: {
              name: cartItem.item.title || "No name",
              metadata: {
                productId: cartItem.item._id || "unknown",
                borrowDuration: cartItem.borrowDuration || "7",
                ...(cartItem.size && { size: cartItem.size }),
                ...(cartItem.color && { color: cartItem.color }),
              },
            },
            unit_amount: Math.round(price * 100), // Nhân với 100 vì Stripe làm việc với đơn vị xu
          },
          quantity: cartItem.quantity || 1,
        };

        console.log("🧾 Stripe Line Item:", item);
        return item;
      }),
      client_reference_id: customer.clerkId,
      customer_email: customer.email,
      success_url: `${process.env.ECOMMERCE_STORE_URL}/payment_success`,
      cancel_url: `${process.env.ECOMMERCE_STORE_URL}/cart`,
    });

    console.log("✅ Stripe session created:", session.id);
    return NextResponse.json(session, { headers: corsHeaders });
  } catch (err: any) {
    console.error("❌ [checkout_POST] Internal error:", err.message || err);
    return new NextResponse("Internal Server Error", {
      status: 500,
      headers: corsHeaders,
    });
  }
}
