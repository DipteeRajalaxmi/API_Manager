"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { isLoggedIn } from "@/lib/auth";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    if (!isLoggedIn()) router.push("/login");
  }, [router]);
  useEffect(() => {
    const ping = () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/actuator/health`)
        .catch(() => {});

    ping(); // immediate ping on dashboard load
    const interval = setInterval(ping, 8 * 60 * 1000); // every 8 min
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F4F7FE]">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}