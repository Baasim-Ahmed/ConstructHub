"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BuildWisePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/material-ai");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting to ConstructHUB Material AI...</p>
    </div>
  );
}
