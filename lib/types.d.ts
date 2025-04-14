type CollectionType = {
  _id: string;
  title: string;
  description: string;
  image: string;
  products: ProductType[];
}

type ProductType = {
  _id: string;
  title: string;
  description: string;
  media: [string];
  category: string;
  collections: [CollectionType];
  tags: [string];
  sizes: [string];
  colors: [string];
  price: number;
  expense: number;
  createdAt: Date;
  updatedAt: Date;
}

type OrderColumnType = {
  _id: string;
  customer: string;
  products: number;
  totalAmount: number;
  createdAt: string;
  orderStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

type OrderItemType = {
  product: ProductType;
  quantity: number;
  borrowDuration: number;
  returnDate: Date;
  status: 'pending' | 'confirmed' | 'borrowed' | 'returned' | 'overdue';
}

type CustomerType = {
  clerkId: string;
  name: string;
  email: string;
}

type ReservationType = {
  _id: string;
  userId: string;
  product: ProductType;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reservationDate: Date;
  pickupDate: Date;
  returnDate: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
};