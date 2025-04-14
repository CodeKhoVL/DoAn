import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Đánh dấu route public
const isPublicRoute = createRouteMatcher([
  "/api/products(.*)", // Allow all product routes
  "/api/collections(.*)", // Allow all collection routes
  "/api/webhooks",
  "/api/search(.*)"
]);

const middleware = clerkMiddleware((auth, request) => {
  const response = NextResponse.next();
  
  // Set CORS headers for all responses
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle OPTIONS requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    });
  }

  // Skip auth for public routes
  if (isPublicRoute(request)) {
    return response;
  }

  // Require auth for other routes
  return response;
});

export default middleware;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
