"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Role } from "@agrivision/shared-types";
import { useAuth } from "@/lib/AuthContext";

export function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { user, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!roles.includes(user.role)) {
      router.replace("/");
    }
  }, [initializing, user, roles, router]);

  if (initializing || !user || !roles.includes(user.role)) {
    return (
      <div className="flex flex-1 items-center justify-center p-10 text-stone-500">
      <div className="flex flex-1 items-center justify-center p-10 text-stone-600 font-medium">
        ...
      </div>
    );
  }

  return <>{children}</>;
}
