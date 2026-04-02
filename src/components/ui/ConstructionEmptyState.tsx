import { LucideIcon, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConstructionEmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function ConstructionEmptyState({
    title,
    description,
    icon: Icon = HardHat,
    actionLabel,
    onAction,
    className,
}: ConstructionEmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border rounded-xl bg-secondary/20 animate-fade-in-up",
                className
            )}
        >
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                <div className="relative h-16 w-16 bg-background rounded-full flex items-center justify-center border-2 border-primary/20 shadow-sm">
                    <Icon className="h-8 w-8 text-primary" />
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-bounce delay-75"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-muted-foreground rounded-full"></div>
            </div>

            <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">
                {title}
            </h3>
            <p className="text-muted-foreground max-w-sm mb-6 font-medium">
                {description}
            </p>

            {actionLabel && (
                <Button
                    onClick={onAction}
                    variant="outline"
                    className="border-primary/50 text-foreground hover:bg-primary hover:text-primary-foreground font-bold uppercase tracking-wider"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
