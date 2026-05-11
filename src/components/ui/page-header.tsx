import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  actionIcon?: React.ElementType;
  actionLoading?: boolean;
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionHref,
  onActionClick,
  actionIcon: Icon = Plus,
  actionLoading = false,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          {title}
        </h1>
        {description && <p className="text-slate-500 mt-1">{description}</p>}
      </div>
      <div className="flex gap-3">
        {children}
        {actionLabel && actionHref && (
          <Link href={actionHref}>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-full px-6">
              <Icon className={`h-4 w-4 mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
              {actionLabel}
            </Button>
          </Link>
        )}
        {actionLabel && onActionClick && (
          <Button
            onClick={onActionClick}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-full px-6"
            disabled={actionLoading}
          >
            <Icon className={`h-4 w-4 mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
