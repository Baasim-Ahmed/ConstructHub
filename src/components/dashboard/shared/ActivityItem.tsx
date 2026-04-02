import { Button } from '@/components/ui/button';
import { Briefcase, CheckSquare, AlertCircle, Clock, ArrowUpRight } from 'lucide-react';

interface ActivityItemProps {
    title: string;
    time: string;
    type: 'project' | 'task' | 'alert' | 'other';
}

export function ActivityItem({ title, time, type }: ActivityItemProps) {
    const getIcon = () => {
        switch (type) {
            case 'project': return <Briefcase className="h-4 w-4 text-blue-600" />;
            case 'task': return <CheckSquare className="h-4 w-4 text-indigo-600" />;
            case 'alert': return <AlertCircle className="h-4 w-4 text-orange-600" />;
            default: return <Clock className="h-4 w-4 text-slate-500" />;
        }
    };

    const getBg = () => {
        switch (type) {
            case 'project': return 'bg-blue-100';
            case 'task': return 'bg-indigo-100';
            case 'alert': return 'bg-orange-100';
            default: return 'bg-slate-100';
        }
    };

    return (
        <div className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border-b border-slate-100 last:border-0">
            <div className={`h-9 w-9 rounded-full ${getBg()} flex items-center justify-center shrink-0`}>
                {getIcon()}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 leading-snug">{title}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {time}
                </p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400">
                <ArrowUpRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
