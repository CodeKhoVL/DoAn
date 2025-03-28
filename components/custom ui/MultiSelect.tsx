"use client";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useState, useEffect, forwardRef } from "react";
import { Badge } from "../ui/badge";
import { X } from "lucide-react";

// Đảm bảo một giá trị luôn là mảng
const ensureArray = (arr: any): any[] => {
  if (!arr) return [];
  if (!Array.isArray(arr)) return [];
  return arr;
};

// Kiểm tra collection hợp lệ
const isValidCollection = (collection: any): boolean => {
  return Boolean(
    collection &&
      typeof collection === "object" &&
      collection._id &&
      collection.title
  );
};

interface MultiSelectProps {
  placeholder: string;
  collections: any;
  value: any;
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
}

// Component MultiSelect hoàn toàn đơn giản hóa để tránh các vấn đề với cmdk
const MultiSelect: React.FC<MultiSelectProps> = ({
  placeholder = "Search...",
  collections,
  value,
  onChange,
  onRemove,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);

  // Đảm bảo dữ liệu an toàn
  const safeCollections = ensureArray(collections).filter(isValidCollection);
  const safeValue = ensureArray(value);

  // Tìm các collection đã chọn
  const selected = safeCollections.filter((collection) =>
    safeValue.includes(collection._id)
  );

  // Tìm các collection có thể chọn
  const selectables = safeCollections.filter(
    (collection) => !safeValue.includes(collection._id)
  );

  // Tránh sử dụng CMDK Command nếu có vấn đề
  if (typeof window !== "undefined" && (window as any).__DISABLE_CMDK__) {
    // Fallback UI không sử dụng Command
    return (
      <div className="border rounded-md p-2">
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map((collection) => (
            <div
              key={collection._id}
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center text-sm"
            >
              {collection.title}
              <button
                type="button"
                className="ml-1 text-blue-500 hover:text-red-500"
                onClick={() => onRemove(collection._id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 100)}
          className="w-full border rounded-md p-2"
        />

        {open && selectables.length > 0 && (
          <div className="mt-1 border rounded-md shadow-md max-h-48 overflow-y-auto">
            {selectables.map((collection) => (
              <div
                key={collection._id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(collection._id);
                  setInputValue("");
                }}
              >
                {collection.title}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // UI sử dụng CMDK Command
  return (
    <div className="relative w-full">
      <div className="flex flex-wrap gap-1 border rounded-md p-2">
        {selected.map((collection) => (
          <Badge key={collection._id} className="bg-blue-100 text-blue-800">
            {collection.title}
            <button
              type="button"
              className="ml-1 hover:text-red-500"
              onClick={() => onRemove(collection._id)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        <input
          className="flex-1 outline-none border-none"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 100)}
        />
      </div>

      {open && selectables.length > 0 && (
        <div className="absolute w-full z-30 top-full mt-1 overflow-auto border rounded-md shadow-md bg-white max-h-60">
          {selectables.map((collection) => (
            <div
              key={collection._id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(collection._id);
                setInputValue("");
              }}
            >
              {collection.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
