"use client";

import { useEffect } from "react";
import { useUserStore } from "@/zustand/userStore";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetchMe = useUserStore((state) => state.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return <>{children}</>;
}
