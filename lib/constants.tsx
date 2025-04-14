import {
  LayoutDashboard,
  Shapes,
  ShoppingBag,
  Tag,
  UsersRound,
  BookOpen,
} from "lucide-react";

export const navLinks = [
  {
    url: "/",
    icon: <LayoutDashboard />,
    label: "Dashboard",
  },
  {
    url: "/collections",
    icon: <Shapes />,
    label: "Danh mục",
  },
  {
    url: "/products",
    icon: <Tag />,
    label: "Sản phẩm",
  },
  {
    url: "/orders",
    icon: <ShoppingBag />,
    label: "Orders",
  },
  {
    url: "/customers",
    icon: <UsersRound />,
    label: "Khách hàng",
  },
  {
    url: "/reservations",
    icon: <BookOpen />,
    label: "Mượn sách",
  },
];
