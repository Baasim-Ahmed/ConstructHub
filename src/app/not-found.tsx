import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Construction, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
            <div className="p-6 rounded-full bg-primary/10 mb-6 animate-bounce">
                <Construction className="w-16 h-16 text-primary" />
            </div>
            <h1 className="text-6xl font-black text-foreground mb-4 uppercase">404</h1>
            <h2 className="text-2xl font-bold text-muted-foreground mb-8 uppercase tracking-wide">Site Under Maintenance</h2>
            <p className="text-muted-foreground max-w-md text-center mb-8">
                The page you are looking for has been demolished or moved to a new foundation.
            </p>

            <Link href="/dashboard">
                <Button size="lg" className="uppercase font-bold tracking-wider">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to Site
                </Button>
            </Link>
        </div>
    );
}
