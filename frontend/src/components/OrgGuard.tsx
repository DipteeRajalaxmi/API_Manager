// "use client";
// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { getUser } from "@/lib/auth";

// export default function OrgGuard({ children }: { children: React.ReactNode }) {
//   const router = useRouter();
//   const user = getUser();

//   useEffect(() => {
//     if (user && !user.orgId) router.push("/developer/dashboard");
//   }, []);

//   if (!user?.orgId) return null; // hides the page instantly

//   return <>{children}</>;
// }


"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";

export default function OrgGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = getUser();
    if (user && !user.orgId) router.push("/developer/dashboard");
  }, []);

  // Don't render anything until client side is ready
  if (!mounted) return null;

  const user = getUser();
  if (!user?.orgId) return null;

  return <>{children}</>;
}


