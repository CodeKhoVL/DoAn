"use client";

import { useEffect, useState } from "react";
import ProductForm from "@/components/products/ProductForm";
import Loader from "@/components/custom ui/Loader";

const ProductDetails = ({ params }: { params: { productId: string } }) => {
  const [loading, setLoading] = useState(true);
  const [productDetails, setProductDetails] = useState<any>(null);

  const getProductDetails = async () => {
    try {
      const res = await fetch(`/api/products/${params.productId}`, {
        method: "GET",
      });
      const data = await res.json();
      setProductDetails(data);
      setLoading(false);
    } catch (err) {
      console.error("[productId_GET]", err);
    }
  };

  useEffect(() => {
    getProductDetails();
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <ProductForm initialData={productDetails} />
  );
};

export default ProductDetails;