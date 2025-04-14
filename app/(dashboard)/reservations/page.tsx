"use client";

import { useEffect, useState } from "react";
import { columns } from "@/components/reservations/ReservationColumns";
import { DataTable } from "@/components/custom ui/DataTable";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/custom ui/Loader";

export default function ReservationsPage() {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);

  const getReservations = async () => {
    try {
      const res = await fetch("/api/reservations", {
        method: "GET",
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setReservations(data);
    } catch (err) {
      console.error("[reservations_GET]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getReservations();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="px-10 py-5">
      <p className="text-heading2-bold">Quản lý đơn mượn sách</p>
      <Separator className="bg-grey-1 my-4" />
      <DataTable
        columns={columns}
        data={reservations}
        searchKey="product.title"
      />
    </div>
  );
}
