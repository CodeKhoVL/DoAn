"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

// Create a separate component for the actions cell
const OrderItemActions = ({
  status,
  orderId,
  productId,
}: {
  status: string;
  orderId: string;
  productId: string;
}) => {
  const updateBookStatus = async (newStatus: string) => {
    try {
      console.log("Updating book status:", {
        orderId,
        productId,
        newStatus,
      });

      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          productStatus: newStatus,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update book status");
      }

      toast.success("Book status updated successfully");
      // Use a short timeout to ensure the state is updated on the server
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("[bookStatus_UPDATE]", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update book status"
      );
    }
  };

  return (
    <div className="flex gap-2">
      {status === "pending" && (
        <Button
          size="sm"
          onClick={() => updateBookStatus("confirmed")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Confirm Borrow Request
        </Button>
      )}
      {status === "confirmed" && (
        <Button
          size="sm"
          onClick={() => updateBookStatus("borrowed")}
          className="bg-green-600 hover:bg-green-700"
        >
          Mark as Borrowed
        </Button>
      )}
      {status === "borrowed" && (
        <>
          <Button
            size="sm"
            onClick={() => updateBookStatus("returned")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Mark as Returned
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => updateBookStatus("overdue")}
          >
            Mark as Overdue
          </Button>
        </>
      )}
    </div>
  );
};

export const createColumns = (orderId: string): ColumnDef<OrderItemType>[] => [
  {
    accessorKey: "product.title",
    header: "Book Title",
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
  },
  {
    accessorKey: "borrowDuration",
    header: "Borrow Duration (Days)",
  },
  {
    accessorKey: "returnDate",
    header: "Return Date",
    cell: ({ row }) => {
      const date = row.original.returnDate;
      return date ? format(new Date(date), "MMM dd, yyyy") : "-";
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      let color = "";
      switch (status) {
        case "pending":
          color = "text-yellow-600";
          break;
        case "confirmed":
          color = "text-purple-600";
          break;
        case "borrowed":
          color = "text-blue-600";
          break;
        case "returned":
          color = "text-green-600";
          break;
        case "overdue":
          color = "text-red-600";
          break;
      }
      return <span className={color}>{status}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const status = row.original.status;
      const productId = row.original.product._id;

      return (
        <OrderItemActions
          status={status}
          orderId={orderId}
          productId={productId}
        />
      );
    },
  },
];
