"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Separator } from "../ui/separator";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import ImageUpload from "../custom ui/ImageUpload";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Delete from "../custom ui/Delete";
import MultiText from "../custom ui/MultiText";
import MultiSelect from "../custom ui/MultiSelect";
import Loader from "../custom ui/Loader";

const formSchema = z.object({
  title: z.string().min(2).max(20),
  description: z.string().min(2).max(500).trim(),
  media: z.array(z.string()),
  category: z.string(),
  collections: z.array(z.string()),
  tags: z.array(z.string()),
  sizes: z.array(z.string()),
  colors: z.array(z.string()),
  price: z.coerce.number().min(0.1),
  expense: z.coerce.number().min(0.1),
});

interface ProductFormProps {
  initialData?: ProductType | null; // Must have "?" to make it optional
}

// Kiểm tra xem một giá trị có phải là mảng không và trả về mảng an toàn
const ensureArray = (value: any): any[] => {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  return value;
};

// Đảm bảo giá trị là số
const ensureNumber = (value: any): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0.1 : parsed;
  }
  if (value && typeof value === "object") {
    // Xử lý trường hợp Decimal128 từ MongoDB
    if (value.toString) {
      try {
        const parsed = parseFloat(value.toString());
        return isNaN(parsed) ? 0.1 : parsed;
      } catch (error) {
        return 0.1;
      }
    }
  }
  return 0.1;
};

// Trích xuất ID từ collection (xử lý cả trường hợp đối tượng hoặc string)
const extractId = (item: any): string | null => {
  if (!item) return null;
  if (typeof item === "string") return item;
  if (typeof item === "object" && item._id) {
    return typeof item._id === "string" ? item._id : String(item._id);
  }
  return null;
};

const ProductForm: React.FC<ProductFormProps> = ({ initialData }) => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<CollectionType[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Lấy danh sách collections với xử lý lỗi
  const getCollections = async () => {
    try {
      console.log("Fetching collections...");
      setError(null);

      const res = await fetch("/api/collections", {
        method: "GET",
      });

      if (!res.ok) {
        console.error(`API error (${res.status})`);
        setError(`Error fetching collections: ${res.status}`);
        setCollections([]);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("Collections API did not return an array:", data);
        setError("API data format error");
        setCollections([]);
      } else {
        const validCollections = data.filter(
          (item) => item && typeof item === "object" && item._id && item.title
        );
        console.log(`Found ${validCollections.length} valid collections`);
        setCollections(validCollections);
      }
    } catch (err) {
      console.error("[collections_GET]", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  // Lấy collections khi component mount
  useEffect(() => {
    getCollections();
  }, []);

  // Log initialData để debug
  useEffect(() => {
    if (initialData) {
      console.log("Initial data:", initialData);
      console.log("initialData.collections:", initialData.collections);
    }
  }, [initialData]);

  // Chuẩn bị giá trị mặc định an toàn
  const getDefaultValues = () => {
    if (!initialData) {
      console.log("Using empty default values");
      return {
        title: "",
        description: "",
        media: [],
        category: "",
        collections: [],
        tags: [],
        sizes: [],
        colors: [],
        price: 0.1,
        expense: 0.1,
      };
    }

    try {
      console.log("Creating form values from initialData");

      // Xử lý collections một cách an toàn
      let collectionsArray: string[] = [];

      if (initialData.collections) {
        try {
          collectionsArray = ensureArray(initialData.collections)
            .map((collection) => extractId(collection))
            .filter(Boolean) as string[];

          console.log("Extracted collection IDs:", collectionsArray);
        } catch (error) {
          console.error("Error processing collections:", error);
          collectionsArray = [];
        }
      }

      return {
        title: initialData.title || "",
        description: initialData.description || "",
        media: ensureArray(initialData.media),
        category: initialData.category || "",
        collections: collectionsArray,
        tags: ensureArray(initialData.tags),
        sizes: ensureArray(initialData.sizes),
        colors: ensureArray(initialData.colors),
        price: ensureNumber(initialData.price),
        expense: ensureNumber(initialData.expense),
      };
    } catch (error) {
      console.error("Error creating default values:", error);
      return {
        title: "",
        description: "",
        media: [],
        category: "",
        collections: [],
        tags: [],
        sizes: [],
        colors: [],
        price: 0.1,
        expense: 0.1,
      };
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  // Log form values khi chúng thay đổi
  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log("Form values changed:", value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleKeyPress = (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Đảm bảo price và expense là số
      const dataToSubmit = {
        ...values,
        price: ensureNumber(values.price),
        expense: ensureNumber(values.expense),
      };

      console.log("Submitting form with values:", dataToSubmit);
      setLoading(true);

      const url = initialData
        ? `/api/products/${initialData._id}`
        : "/api/products";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (res.ok) {
        toast.success(`Product ${initialData ? "updated" : "created"}`);
        window.location.href = "/products";
        router.push("/products");
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("API error:", errorData);
        toast.error(errorData.message || "Failed to save product");
      }
    } catch (err) {
      console.error("[products_POST]", err);
      toast.error("Something went wrong! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="p-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">lỗi khi tải collection</p>
          <p>{error}</p>
          <button
            onClick={() => getCollections()}
            className="mt-2 bg-blue-1 text-white px-4 py-2 rounded"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10">
      {initialData ? (
        <div className="flex items-center justify-between">
          <p className="text-heading2-bold">Chỉnh sửa sản phẩm</p>
          <Delete id={initialData._id} item="product" />
        </div>
      ) : (
        <p className="text-heading2-bold">Tạo sản phẩm</p>
      )}
      <Separator className="bg-grey-1 mt-4 mb-7" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên sách</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Title"
                    {...field}
                    onKeyDown={handleKeyPress}
                  />
                </FormControl>
                <FormMessage className="text-red-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mô tả</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Description"
                    {...field}
                    rows={5}
                    onKeyDown={handleKeyPress}
                  />
                </FormControl>
                <FormMessage className="text-red-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="media"
            render={({ field }) => {
              // Đảm bảo field.value là mảng
              const safeValue = ensureArray(field.value);

              return (
                <FormItem>
                  <FormLabel>Ảnh</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={safeValue}
                      onChange={(url) => {
                        field.onChange([...safeValue, url]);
                      }}
                      onRemove={(url) => {
                        field.onChange(
                          safeValue.filter((image) => image !== url)
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-red-1" />
                </FormItem>
              );
            }}
          />

          <div className="md:grid md:grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => {
                // Đảm bảo giá trị là số
                const value =
                  typeof field.value === "number"
                    ? field.value
                    : parseFloat(String(field.value)) || 0.1;

                return (
                  <FormItem>
                    <FormLabel>Giá</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.1"
                        placeholder="Price"
                        value={value}
                        onChange={(e) => {
                          // Chuyển đổi giá trị input thành số
                          const numValue = parseFloat(e.target.value) || 0.1;
                          field.onChange(numValue);
                        }}
                        onKeyDown={handleKeyPress}
                      />
                    </FormControl>
                    <FormMessage className="text-red-1" />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="expense"
              render={({ field }) => {
                // Đảm bảo giá trị là số
                const value =
                  typeof field.value === "number"
                    ? field.value
                    : parseFloat(String(field.value)) || 0.1;

                return (
                  <FormItem>
                    <FormLabel>Expense</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.1"
                        placeholder="Expense"
                        value={value}
                        onChange={(e) => {
                          // Chuyển đổi giá trị input thành số
                          const numValue = parseFloat(e.target.value) || 0.1;
                          field.onChange(numValue);
                        }}
                        onKeyDown={handleKeyPress}
                      />
                    </FormControl>
                    <FormMessage className="text-red-1" />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tác giả</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tác giả"
                      {...field}
                      onKeyDown={handleKeyPress}
                    />
                  </FormControl>
                  <FormMessage className="text-red-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => {
                const safeValue = ensureArray(field.value);

                return (
                  <FormItem>
                    <FormLabel>Thể loại</FormLabel>
                    <FormControl>
                      <MultiText
                        placeholder="Thể loại"
                        value={safeValue}
                        onChange={(tag) => {
                          field.onChange([...safeValue, tag]);
                        }}
                        onRemove={(tagToRemove) => {
                          field.onChange(
                            safeValue.filter((tag) => tag !== tagToRemove)
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-red-1" />
                  </FormItem>
                );
              }}
            />
            {collections.length > 0 && (
              <FormField
                control={form.control}
                name="collections"
                render={({ field }) => {
                  // Đảm bảo field.value là mảng
                  const safeValue = ensureArray(field.value);

                  console.log("Collections field value:", safeValue);

                  return (
                    <FormItem>
                      <FormLabel>Danh mục</FormLabel>
                      <FormControl>
                        <MultiSelect
                          placeholder="Collections"
                          collections={collections}
                          value={safeValue}
                          onChange={(_id) => {
                            // Kiểm tra và thêm ID mới nếu chưa tồn tại
                            if (!safeValue.includes(_id)) {
                              field.onChange([...safeValue, _id]);
                            }
                          }}
                          onRemove={(idToRemove) => {
                            field.onChange(
                              safeValue.filter((id) => id !== idToRemove)
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-red-1" />
                    </FormItem>
                  );
                }}
              />
            )}
            <FormField
              control={form.control}
              name="colors"
              render={({ field }) => {
                const safeValue = ensureArray(field.value);

                return (
                  <FormItem>
                    <FormLabel>Số tập</FormLabel>
                    <FormControl>
                      <MultiText
                        placeholder="số tập"
                        value={safeValue}
                        onChange={(color) => {
                          field.onChange([...safeValue, color]);
                        }}
                        onRemove={(colorToRemove) => {
                          field.onChange(
                            safeValue.filter((color) => color !== colorToRemove)
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-red-1" />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="sizes"
              render={({ field }) => {
                const safeValue = ensureArray(field.value);

                return (
                  <FormItem>
                    <FormLabel>Số phần</FormLabel>
                    <FormControl>
                      <MultiText
                        placeholder="Số Phân"
                        value={safeValue}
                        onChange={(size) => {
                          field.onChange([...safeValue, size]);
                        }}
                        onRemove={(sizeToRemove) => {
                          field.onChange(
                            safeValue.filter((size) => size !== sizeToRemove)
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-red-1" />
                  </FormItem>
                );
              }}
            />
          </div>

          <div className="flex gap-10">
            <Button type="submit" className="bg-blue-1 text-white">
              Xác nhận
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/products")}
              className="bg-blue-1 text-white"
            >
              Hủy bỏ
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProductForm;
