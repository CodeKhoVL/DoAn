"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { navLinks } from "@/lib/constants";

const LeftNavBar = () => {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  return (
    <header className="fixed top-0 left-0 w-full bg-blue-2 shadow-md p-3 flex items-center justify-between z-10">
      <div className="flex items-center gap-8">
        <Image src="/logo.png" alt="logo" width={100} height={40} />

        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              href={link.url}
              key={link.label}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                pathname === link.url
                  ? "text-blue-1 bg-white/10 font-medium"
                  : "text-grey-1 hover:bg-white/5"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="text-sm">{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4 pr-4">
        {!isSignedIn ? (
          <>
            <Link
              href="/sign-in"
              className="px-4 py-2 rounded-lg bg-blue-1 text-white hover:bg-blue-600 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 rounded-lg border border-blue-1 text-blue-1 hover:bg-blue-50 transition-colors"
            >
              Đăng ký
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <UserButton />
            <p className="text-sm text-grey-1 hover:text-blue-1 cursor-pointer">
              Chỉnh sửa hồ sơ
            </p>
          </div>
        )}
      </div>
    </header>
  );
};

export default LeftNavBar;
