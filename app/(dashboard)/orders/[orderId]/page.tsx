"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/custom ui/DataTable";
import { columns } from "@/components/orderItems/OrderItemsColums";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import Loader from "@/components/custom ui/Loader";

const OrderDetails = ({ params }: { params: { orderId: string } }) => {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`/api/orders/${params.orderId}`);
      const data = await res.json();
      setOrderDetails(data.orderDetails);
      setCustomer(data.customer);
      setLoading(false);
    } catch (err) {
      console.error("[orderDetails_GET]", err);
      toast.error("Failed to load order details");
    }
  };

  const updateOrderStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/orders/${params.orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderStatus: status }),
      });

      if (!res.ok) throw new Error("Failed to update order status");
      
      toast.success("Order status updated successfully");
      fetchOrderDetails();
    } catch (err) {
      console.error("[orderStatus_UPDATE]", err);
      toast.error("Failed to update order status");
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [params.orderId]);

  if (loading) return <Loader />;

  return (
    <div className="flex flex-col p-10 gap-5">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <div className="flex gap-2">
          {orderDetails?.orderStatus === "pending" && (
            <>
              <Button onClick={() => updateOrderStatus("confirmed")}>
                Confirm Order
              </Button>
              <Button 
                variant="destructive"
                onClick={() => updateOrderStatus("cancelled")}
              >
                Cancel Order
              </Button>
            </>
          )}
          {orderDetails?.orderStatus === "confirmed" && (
            <Button onClick={() => updateOrderStatus("completed")}>
              Mark as Completed
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid gap-4">
        <p><span className="font-bold">Order ID:</span> {orderDetails?._id}</p>
        <p><span className="font-bold">Customer:</span> {customer?.name}</p>
        <p><span className="font-bold">Status:</span> {orderDetails?.orderStatus}</p>
        <p><span className="font-bold">Total Amount:</span> {orderDetails?.totalAmount?.toLocaleString("vi-VN")}₫</p>
        <p><span className="font-bold">Created At:</span> {new Date(orderDetails?.createdAt).toLocaleString("vi-VN")}</p>
      </div>

      <div className="mt-5">
        <h2 className="text-xl font-bold mb-3">Borrowed Books</h2>
        {orderDetails?.products && (
          <DataTable
            columns={columns}
            data={orderDetails.products}
            searchKey="product.title"
          />
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
