import { cn } from "@/lib/utils";
import { Hammer } from "lucide-react";

export function HammerLoader({ className }: { className?: string }) {
    return (
        <div className={cn("relative flex items-center justify-center w-12 h-12", className)}>
            {/* Sparks Container - only visible on impact */}
            <div className="absolute bottom-2 right-2 w-8 h-8 pointer-events-none">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-1 h-1 bg-yellow-400 rounded-full animate-[spark-fly_2s_infinite]"
                        style={{
                            left: '50%',
                            top: '50%',
                            animationDelay: '1s', // Sync with hammer hit (50% of 2s)
                            "--tx": `${(i - 1) * 15}px`,
                            "--ty": `-${10 + Math.random() * 15}px`
                        } as React.CSSProperties}
                    />
                ))}
            </div>

            {/* Hammer */}
            <Hammer
                className="w-full h-full text-primary origin-bottom-right animate-hammer-swing drop-shadow-md"
                strokeWidth={2.5}
                style={{ transformBox: "fill-box" }}
            />
            {/* Nail (Simple line) */}
            <div className="absolute bottom-1 right-2 w-1 h-4 bg-foreground rounded-sm animate-nail-drive origin-bottom"></div>
        </div>
    );
}
