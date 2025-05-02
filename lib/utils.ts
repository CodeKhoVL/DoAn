import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) 
{
  return twMerge(clsx(inputs))
}

export const formatPrice = (price: any): number => {
  if (!price) return 0;
  
  // Xử lý MongoDB Decimal128
  if (typeof price === 'object' && price !== null && '$numberDecimal' in price) {
    return parseFloat(price.$numberDecimal);
  }
  
  // Nếu đã là số
  if (typeof price === 'number') {
    return price;
  }
  
  // Trường hợp khác, cố gắng parse thành số
  return parseFloat(String(price)) || 0;
};

// Format price for display
export const formatPriceDisplay = (price: any): string => {
  return formatPrice(price).toLocaleString('vi-VN');
};
