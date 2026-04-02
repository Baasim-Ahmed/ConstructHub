"use client";

import { Toaster } from "sonner";
import { DevRoleProvider, getDevRoleFromStorage } from "@/context/DevRoleContext";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Removed monkey-patching of window.fetch as it was overriding the actual role
    }, []);

    return (
        <DevRoleProvider>
            {children}
            <Toaster />
        </DevRoleProvider>
    );
}
