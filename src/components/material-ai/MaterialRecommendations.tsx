"use client";

import { ScoredMaterial } from '@/lib/material-ai/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Check, Plus, BarChart2 } from 'lucide-react';

interface MaterialRecommendationsProps {
    recommendations: ScoredMaterial[];
    onCompare?: (material: ScoredMaterial) => void;
    onViewDetails?: (material: ScoredMaterial) => void;
}

export function MaterialRecommendations({ recommendations, onCompare, onViewDetails }: MaterialRecommendationsProps) {
    if (recommendations.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                No recommendations found. Try adjusting your specifications.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
            {/* ... rest of mapping ... */}
            {recommendations.map((mat) => (
                <Card key={mat.id} className="border-none shadow-md hover:shadow-xl transition-shadow duration-300 relative overflow-hidden flex flex-col">
                    {mat.match_score > 90 && (
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs px-3 py-1 rounded-bl-lg font-bold">
                            TOP MATCH
                        </div>
                    )}
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <Badge variant="outline" className="mb-2">{mat.type}</Badge>
                                <CardTitle className="text-lg leading-tight">{mat.name}</CardTitle>
                            </div>
                            <div className="text-center min-w-[3rem]">
                                <span className={`text-2xl font-bold ${getScoreColor(mat.match_score)}`}>
                                    {mat.match_score}
                                </span>
                                <div className="text-[10px] text-muted-foreground uppercase">Score</div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm flex-1">
                        {/* Human Reason */}
                        {mat.reason && (
                            <div className="bg-blue-50/50 p-2.5 rounded-md text-xs text-slate-600 border border-blue-100/50 leading-relaxed">
                                <span className="font-semibold text-blue-700 block mb-1">Why this?</span>
                                {mat.reason}
                            </div>
                        )}

                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Durability</span>
                                <span>{mat.durability_years} years</span>
                            </div>
                            <Progress value={Math.min(100, (mat.durability_years / 100) * 100)} className="h-1.5" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Cost Efficiency</span>
                                <span>Rs. {mat.cost_per_unit.toLocaleString()}</span>
                            </div>
                            <Progress value={mat.breakdown.cost * 10} className="h-1.5 bg-secondary [&>div]:bg-amber-500" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <div className="bg-slate-50 p-2 rounded text-center">
                                <div className="text-xs text-muted-foreground">Strength</div>
                                <div className="font-semibold">{mat.strength_mpa} MPa</div>
                            </div>
                            <div className="bg-slate-50 p-2 rounded text-center">
                                <div className="text-xs text-muted-foreground">Eco Score</div>
                                <div className="font-semibold">{mat.eco_friendly_score}/10</div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 text-xs h-9"
                            onClick={() => onCompare?.(mat)}
                        >
                            <Plus className="h-3 w-3 mr-1" /> Compare
                        </Button>
                        <Button
                            className="flex-1 bg-slate-900 text-white text-xs h-9 hover:bg-slate-800"
                            onClick={() => onViewDetails?.(mat)}
                        >
                            View Details
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

function getScoreColor(score: number) {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
}
