import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtext: string;
    icon: LucideIcon;
    gradient: string;
    trend: string;
}

export function StatCard({ title, value, subtext, icon: Icon, gradient, trend }: StatCardProps) {
    return (
        <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 group relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
            <CardContent className="p-6 relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md group-hover:scale-110 transition-transform`}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600 flex items-center font-medium bg-green-50 px-2 py-0.5 rounded-full">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {trend}
                    </span>
                    <span className="text-slate-400 ml-2">{subtext}</span>
                </div>
            </CardContent>
        </Card>
    );
}
