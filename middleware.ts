import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Đánh dấu route public
const isPublicRoute = createRouteMatcher([
  "/api/webhooks", // 👈 Webhook Stripe cần public
]);

const middleware = clerkMiddleware((auth, request) => {
  // Bỏ qua xác thực nếu là public route
  if (isPublicRoute(request)) {
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }

    return response;
  }

  // Các route còn lại dùng Clerk như bình thường
  return NextResponse.next();
});

export default middleware;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
