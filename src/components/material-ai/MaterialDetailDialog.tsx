"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScoredMaterial } from "@/lib/material-ai/types";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Button } from "@/components/ui/button";

interface MaterialDetailDialogProps {
    material: ScoredMaterial | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCompare: (material: ScoredMaterial) => void;
}

export function MaterialDetailDialog({ material, open, onOpenChange, onCompare }: MaterialDetailDialogProps) {
    if (!material) return null;

    const radarData = [
        { subject: 'Strength', A: Math.min(100, material.strength_mpa), fullMark: 100 },
        { subject: 'Durability', A: Math.min(100, material.durability_years), fullMark: 100 },
        { subject: 'Cost (Inv)', A: Math.min(100, (1000 / Math.max(material.cost_per_unit, 1)) * 5000), fullMark: 100 },
        { subject: 'Eco', A: material.eco_friendly_score * 10, fullMark: 100 },
        { subject: 'Water Res', A: material.water_resistance * 10, fullMark: 100 },
        { subject: 'Fire Res', A: Math.min(100, material.fire_resistance_hours * 20), fullMark: 100 },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white">
                <DialogHeader>
                    <div className="flex justify-between items-start pr-8">
                        <div>
                            <Badge className="mb-2 bg-slate-900 text-white hover:bg-slate-800">{material.type}</Badge>
                            <DialogTitle className="text-2xl font-bold text-slate-900">{material.name}</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Supplied by {material.supplier_name ?? material.supplier_id} | Match Score: <span className="font-bold text-emerald-600">{material.match_score}%</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h4 className="font-semibold text-sm text-slate-800 mb-3">Key Performance Indicators</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Cost per Unit</span>
                                    <span className="font-bold text-slate-900">Rs. {material.cost_per_unit.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Compressive Strength</span>
                                    <span className="font-bold text-slate-900">{material.strength_mpa} MPa</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Est. Durability</span>
                                    <span className="font-bold text-slate-900">{material.durability_years} Years</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Eco-Friendliness</span>
                                    <span className="font-bold text-emerald-600">{material.eco_friendly_score}/10</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-slate-800">Additional Properties</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 border rounded bg-white">
                                    <div className="text-slate-400">Fire Resistance</div>
                                    <div className="font-medium">{material.fire_resistance_hours} Hours</div>
                                </div>
                                <div className="p-2 border rounded bg-white">
                                    <div className="text-slate-400">Water Res.</div>
                                    <div className="font-medium">{material.water_resistance}/10</div>
                                </div>
                                <div className="p-2 border rounded bg-white">
                                    <div className="text-slate-400">Thermal Cond.</div>
                                    <div className="font-medium">{material.thermal_conductivity} W/mK</div>
                                </div>
                                <div className="p-2 border rounded bg-white">
                                    <div className="text-slate-400">Installation</div>
                                    <div className="font-medium">{material.installation_complexity}/10 (Diff.)</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full bg-slate-50 rounded-xl relative">
                        <div className="absolute top-2 left-0 w-full text-center text-xs font-semibold text-slate-400">Capability Map</div>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name={material.name}
                                    dataKey="A"
                                    stroke="#10b981"
                                    fill="#10b981"
                                    fillOpacity={0.5}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => onCompare(material)}>Add to Compare</Button>
                    <Button onClick={() => onOpenChange(false)} className="bg-slate-900 text-white">Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
