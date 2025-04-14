"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

export const columns: ColumnDef<OrderColumnType>[] = [
  {
    accessorKey: "_id",
    header: "ID",
    cell: ({ row }) => (
      <Link href={`/orders/${row.original._id}`} className="text-blue underline">
        {row.original._id}
      </Link>
    ),
  },
  {
    accessorKey: "customer",
    header: "Khách hàng",
  },
  {
    accessorKey: "products",
    header: "Số lượng sách",
  },
  {
    accessorKey: "totalAmount",
    header: "Tiền đặt cọc",
    cell: ({ row }) => (
      <span>{row.original.totalAmount.toLocaleString("vi-VN")} VNĐ</span>
    ),
  },
  {
    accessorKey: "orderStatus",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.original.orderStatus;
      let colorClass = "";
      let statusText = "";

      switch (status) {
        case "pending":
          colorClass = "text-yellow-600";
          statusText = "Chờ xác nhận";
          break;
        case "confirmed":
          colorClass = "text-blue-600";
          statusText = "Đã xác nhận";
          break;
        case "cancelled":
          colorClass = "text-red-600";
          statusText = "Đã hủy";
          break;
        case "completed":
          colorClass = "text-green-600";
          statusText = "Hoàn thành";
          break;
        default:
          colorClass = "text-gray-600";
          statusText = status;
      }

      return <span className={`font-medium ${colorClass}`}>{statusText}</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
  },
];
