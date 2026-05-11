"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ProjectSpecs } from '@/lib/material-ai/types';
import { Briefcase, DollarSign, Thermometer, Zap, Sun, CloudRain, Wind, Flame, Droplets, type LucideIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface SpecificationFormProps {
    onSubmit: (specs: ProjectSpecs) => void;
    isLoading?: boolean;
}

const DEFAULT_STRESS_VALUES = {
    sun: 5,
    wind: 5,
    rain: 5,
    fire: 5,
    humidity: 5,
} as const;

type StressFactorId = keyof typeof DEFAULT_STRESS_VALUES;

type StressFactor = {
    id: StressFactorId;
    label: string;
    icon: LucideIcon;
    color: string;
};

const stressFactors: StressFactor[] = [
    { id: 'sun', label: 'Heat / UV Exposure', icon: Sun, color: 'text-orange-500' },
    { id: 'wind', label: 'Airflow / Drafts', icon: Wind, color: 'text-sky-500' },
    { id: 'rain', label: 'Rain / Precipitation', icon: CloudRain, color: 'text-cyan-500' },
    { id: 'fire', label: 'Extreme Temperature / Fire Risk', icon: Flame, color: 'text-amber-500' },
    { id: 'humidity', label: 'Humidity / Moisture Levels', icon: Droplets, color: 'text-indigo-500' },
];

function clampStressValue(value: number) {
    if (!Number.isFinite(value)) return 1;
    return Math.min(10, Math.max(1, value));
}

export function SpecificationForm({ onSubmit, isLoading }: SpecificationFormProps) {
    const [appType, setAppType] = useState<string>('Foundation');
    const [budget, setBudget] = useState<number>(50000);
    const [strength, setStrength] = useState<number>(0);
    const [stressValues, setStressValues] = useState<Record<StressFactorId, number>>(DEFAULT_STRESS_VALUES);
    const [installTime, setInstallTime] = useState<'low' | 'high' | null>(null);

    const updateStressValue = (id: StressFactorId, value: number) => {
        setStressValues((current) => ({
            ...current,
            [id]: clampStressValue(value),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            application_type: appType,
            budget_constraint: budget,
            min_strength_mpa: strength > 0 ? strength : undefined,
            environmental_conditions: stressValues,
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
                            {stressFactors.map(({ id, label, icon: Icon, color }) => (
                                <div key={id} className="grid grid-cols-[24px_1fr_72px] items-center gap-3">
                                    <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
                                    <div className="space-y-1">
                                        <div className="text-xs font-medium text-slate-500">{label}</div>
                                        <Slider
                                            value={[stressValues[id]]}
                                            min={1}
                                            max={10}
                                            step={1}
                                            onValueChange={(value) => updateStressValue(id, value[0] ?? stressValues[id])}
                                            className="flex-1"
                                            aria-label={label}
                                        />
                                    </div>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={stressValues[id]}
                                        onChange={(e) => updateStressValue(id, Number(e.target.value))}
                                        className="h-9 w-16 rounded-md border-slate-200 text-center"
                                        aria-label={`${label} value`}
                                    />
                                </div>
                            ))}
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
