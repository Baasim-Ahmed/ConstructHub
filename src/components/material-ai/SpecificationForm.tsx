"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ProjectSpecs } from '@/lib/material-ai/types';
import { Briefcase, DollarSign, Thermometer, Zap, Clock, Sun, CloudRain, Wind, Flame } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface SpecificationFormProps {
    onSubmit: (specs: ProjectSpecs) => void;
    isLoading?: boolean;
}

export function SpecificationForm({ onSubmit, isLoading }: SpecificationFormProps) {
    const [appType, setAppType] = useState<string>('Foundation');
    const [budget, setBudget] = useState<number>(50000);
    const [strength, setStrength] = useState<number>(0);
    const [envHeat, setEnvHeat] = useState<number>(5);
    const [envCold, setEnvCold] = useState<number>(5);
    const [envHumidity, setEnvHumidity] = useState<number>(5);
    const [envUV, setEnvUV] = useState<number>(5);
    const [installTime, setInstallTime] = useState<'low' | 'high' | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            application_type: appType,
            budget_constraint: budget,
            min_strength_mpa: strength > 0 ? strength : undefined,
            environmental_conditions: { heat: envHeat, cold: envCold, humidity: envHumidity, uv: envUV },
            installation_time_constraint: installTime
        });
    };

    return (
        <Card className="w-full border shadow-xl shadow-slate-200/50 bg-white/90 backdrop-blur-md overflow-hidden">
            <div className="bg-slate-50 border-b p-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                        <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">Project Specs</h3>
                        <p className="text-xs text-slate-500 font-medium">Define your requirements</p>
                    </div>
                </div>
            </div>

            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Primary Inputs */}
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Application</Label>
                            <Select value={appType} onValueChange={setAppType}>
                                <SelectTrigger className="h-11 bg-slate-50 border-slate-200 hover:border-emerald-500 transition-colors">
                                    <SelectValue placeholder="Select Application" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Foundation">Foundation</SelectItem>
                                    <SelectItem value="Structural">Structural</SelectItem>
                                    <SelectItem value="Flooring">Flooring</SelectItem>
                                    <SelectItem value="Facade">Facade</SelectItem>
                                    <SelectItem value="Wall">Wall</SelectItem>
                                    <SelectItem value="Windows">Windows</SelectItem>
                                    <SelectItem value="Doors">Doors</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="flex items-center gap-2 text-sm font-medium">
                                    <DollarSign className="h-4 w-4 text-emerald-600" />
                                    Budget Limit (PKR)
                                </Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">Rs.</span>
                                    <Input
                                        type="number"
                                        value={budget}
                                        onChange={(e) => setBudget(Number(e.target.value))}
                                        className="h-7 w-24 text-right font-mono font-bold text-slate-700 bg-slate-100"
                                    />
                                </div>
                            </div>
                            <Slider
                                value={[budget]}
                                max={10000000}
                                step={5000}
                                onValueChange={(val) => setBudget(val[0])}
                                className="[&>.relative>.absolute]:bg-emerald-600"
                            />
                            <div className="flex justify-between text-xs text-slate-400 px-1">
                                <span>0</span>
                                <span>10M+</span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Technical Specs */}
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-500 font-semibold">Min Strength (MPa)</Label>
                                <div className="relative">
                                    <Zap className="absolute left-3 top-2.5 h-4 w-4 text-amber-500" />
                                    <Input
                                        type="number"
                                        className="pl-9 bg-slate-50"
                                        placeholder="Optional"
                                        value={strength || ''}
                                        onChange={(e) => setStrength(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-500 font-semibold">Install Priority</Label>
                                <Select
                                    value={installTime || 'normal'}
                                    onValueChange={(val) => setInstallTime(val === 'normal' ? null : val as 'low' | 'high')}
                                >
                                    <SelectTrigger className="bg-slate-50">
                                        <SelectValue placeholder="Normal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="low">Fast</SelectItem>
                                        <SelectItem value="high">Complex OK</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Environmental Controls */}
                    <div className="space-y-4">
                        <Label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <Thermometer className="h-4 w-4 text-rose-500" />
                            Environmental Stress (1-10)
                        </Label>

                        <div className="space-y-4">
                            <div className="grid grid-cols-[24px_1fr_60px] items-center gap-3">
                                <Sun className="h-4 w-4 text-orange-500" />
                                <Slider value={[envHeat]} max={10} step={1} onValueChange={(v) => setEnvHeat(v[0])} className="flex-1" />
                                <Input type="number" min={1} max={10} value={envHeat} onChange={e => setEnvHeat(Number(e.target.value))} className="h-7 w-14 text-center p-1" />
                            </div>
                            <div className="grid grid-cols-[24px_1fr_60px] items-center gap-3">
                                <Wind className="h-4 w-4 text-blue-400" />
                                <Slider value={[envCold]} max={10} step={1} onValueChange={(v) => setEnvCold(v[0])} className="flex-1" />
                                <Input type="number" min={1} max={10} value={envCold} onChange={e => setEnvCold(Number(e.target.value))} className="h-7 w-14 text-center p-1" />
                            </div>
                            <div className="grid grid-cols-[24px_1fr_60px] items-center gap-3">
                                <CloudRain className="h-4 w-4 text-indigo-500" />
                                <Slider value={[envHumidity]} max={10} step={1} onValueChange={(v) => setEnvHumidity(v[0])} className="flex-1" />
                                <Input type="number" min={1} max={10} value={envHumidity} onChange={e => setEnvHumidity(Number(e.target.value))} className="h-7 w-14 text-center p-1" />
                            </div>
                            <div className="grid grid-cols-[24px_1fr_60px] items-center gap-3">
                                <Flame className="h-4 w-4 text-yellow-500" />
                                <Slider value={[envUV]} max={10} step={1} onValueChange={(v) => setEnvUV(v[0])} className="flex-1" />
                                <Input type="number" min={1} max={10} value={envUV} onChange={e => setEnvUV(Number(e.target.value))} className="h-7 w-14 text-center p-1" />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02]"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </div>
                        ) : (
                            "Generate Recommendations"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
