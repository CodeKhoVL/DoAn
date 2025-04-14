"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export const columns: ColumnDef<ReservationType>[] = [
  {
    accessorKey: "product.title",
    header: "Tên sách",
  },
  {
    accessorKey: "pickupDate",
    header: "Ngày mượn",
    cell: ({ row }) => format(new Date(row.original.pickupDate), "dd/MM/yyyy"),
  },
  {
    accessorKey: "returnDate",
    header: "Ngày trả",
    cell: ({ row }) => format(new Date(row.original.returnDate), "dd/MM/yyyy"),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.original.status;
      let color = "";
      switch (status) {
        case "pending":
          color = "text-yellow-600";
          break;
        case "approved":
          color = "text-green-600";
          break;
        case "rejected":
          color = "text-red-600";
          break;
        case "completed":
          color = "text-blue-600";
          break;
      }
      return <span className={color}>{status}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const status = row.original.status;
      const reservationId = row.original._id;

      const updateStatus = async (newStatus: string) => {
        try {
          const res = await fetch(`/api/reservations/${reservationId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: newStatus }),
          });

          if (!res.ok) {
            throw new Error("Failed to update reservation status");
          }

          toast.success("Cập nhật trạng thái thành công");
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch (err) {
          console.error("[reservationStatus_UPDATE]", err);
          toast.error("Lỗi khi cập nhật trạng thái");
        }
      };

      return (
        <div className="flex gap-2">
          {status === "pending" && (
            <>
              <Button
                size="sm"
                onClick={() => updateStatus("approved")}
                className="bg-green-600 hover:bg-green-700"
              >
                Duyệt
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateStatus("rejected")}
              >
                Từ chối
              </Button>
            </>
          )}
          {status === "approved" && (
            <Button
              size="sm"
              onClick={() => updateStatus("completed")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Đánh dấu đã trả
            </Button>
          )}
        </div>
      );
    },
  },
];
