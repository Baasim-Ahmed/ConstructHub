import { HammerLoader } from "@/components/ui/HammerLoader";

export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
            <HammerLoader className="scale-150" />
            <p className="text-muted-foreground font-semibold uppercase tracking-wider animate-pulse">Loading Site Data...</p>
        </div>
    );
}
