import { DataTable } from "@/components/custom ui/DataTable";
import { columns } from "@/components/orderItems/OrderItemsColums";

const OrderDetails = async ({ params }: { params: { orderId: string } }) => {
  const res = await fetch(
    `${process.env.ADMIN_DASHBOARD_URL}/api/orders/${params.orderId}`
  );
  const { orderDetails, customer } = await res.json();

  // ✅ Tránh lỗi nếu shippingAddress bị null
  const {
    street = "Em đang fix",
    city = "Em đang fix",
    state = "Em đang Fix",
    postalCode = "Em đang fix",
    country = "Em đang fix",
  } = orderDetails.shippingAddress || {};

  return (
    <div className="flex flex-col p-10 gap-5">
      <p className="text-base-bold">
        Order ID: <span className="text-base-medium">{orderDetails._id}</span>
      </p>
      <p className="text-base-bold">
        Tên khách hàng:{" "}
        <span className="text-base-medium">{customer.name}</span>
      </p>
      <p className="text-base-bold">
        Địa chỉ:{" "}
        <span className="text-base-medium">
          {street}, {city}, {state}, {postalCode}, {country}
        </span>
      </p>
      <p className="text-base-bold">
        Cái giá phải trả:{" "}
        <span className="text-base-medium">
          {orderDetails.totalAmount.toLocaleString("vi-VN")}₫
        </span>
      </p>

      <DataTable
        columns={columns}
        data={orderDetails.products}
        searchKey="product"
      />
    </div>
  );
};

export default OrderDetails;
