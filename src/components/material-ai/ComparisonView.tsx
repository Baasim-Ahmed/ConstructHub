"use client";

import { ScoredMaterial } from '@/lib/material-ai/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { X, Truck, DollarSign } from 'lucide-react';

interface ComparisonViewProps {
    materials: ScoredMaterial[];
    onRemove: (id: number) => void;
}

export function ComparisonView({ materials, onRemove }: ComparisonViewProps) {
    if (materials.length === 0) return null;

    // Prepare data for charts
    const costData = materials.map(m => ({
        name: m.name,
        cost: m.cost_per_unit,
        strength: m.strength_mpa,
        durability: m.durability_years,
        score: m.match_score
    }));

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-800">Material Comparison</h2>
                <span className="text-sm text-muted-foreground">Comparing {materials.length} items</span>
            </div>

            {/* Side by Side Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map(m => (
                    <Card key={m.id} className="relative border-slate-200 shadow-sm">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-rose-500"
                            onClick={() => onRemove(m.id)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold truncate pr-6">{m.name}</CardTitle>
                            <CardDescription>{m.type} • {m.supplier_id}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                            <div className="flex justify-between border-b pb-1">
                                <span>Cost</span>
                                <span className="font-semibold">Rs. {m.cost_per_unit.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                                <span>Strength</span>
                                <span className="font-semibold">{m.strength_mpa} MPa</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                                <span>Durability</span>
                                <span className="font-semibold">{m.durability_years} yrs</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                                <span>Supplier Rating</span>
                                <div className="flex items-center text-amber-500">
                                    {'★'.repeat(4)}{'☆'.repeat(1)}
                                    <span className="text-slate-400 ml-1 text-[10px]">(Est.)</span>
                                </div>
                            </div>
                            <div className="flex justify-between pt-1">
                                <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Delivery</span>
                                <span>3-5 Days</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Cost Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={costData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="cost" fill="#f43f5e" name="Cost (Rs.)" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Performance vs Durability</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={costData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="strength" fill="#3b82f6" name="Strength (MPa)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="durability" fill="#10b981" name="Durability (Yrs)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
