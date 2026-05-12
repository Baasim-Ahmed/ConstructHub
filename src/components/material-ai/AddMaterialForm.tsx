"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateMaterialInput } from "@/lib/material-ai/types";
import { Plus } from "lucide-react";
import {
    DEFAULT_ENVIRONMENTAL_STRESS_PROFILE,
    ENVIRONMENTAL_STRESS_FIELDS,
    MATERIAL_APPLICATIONS,
    MaterialApplication,
    type EnvironmentalStressField,
} from "@/lib/material-ai/constants";

interface AddMaterialFormProps {
    onAdd: (material: CreateMaterialInput) => Promise<void>;
}

const MATERIAL_TYPES = ["Concrete", "Steel", "Stone", "Wood", "Ceramic", "Glass", "Bitumen", "Coating", "Other"];

function clampStressValue(value: number) {
    if (!Number.isFinite(value)) return 1;
    return Math.min(10, Math.max(1, value));
}

export function AddMaterialForm({ onAdd }: AddMaterialFormProps) {
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [type, setType] = useState("Other");
    const [cost, setCost] = useState(0);
    const [strength, setStrength] = useState(0);
    const [durability, setDurability] = useState(0);

    const [eco, setEco] = useState(5);
    const [maintenance, setMaintenance] = useState(5);
    const [complexity, setComplexity] = useState(5);
    const [waterRes, setWaterRes] = useState(5);

    // Weather Resistance
    const [environmentalStress, setEnvironmentalStress] = useState(DEFAULT_ENVIRONMENTAL_STRESS_PROFILE);

    const [selectedApps, setSelectedApps] = useState<MaterialApplication[]>([]);

    const handleAppToggle = (app: MaterialApplication) => {
        if (selectedApps.includes(app)) {
            setSelectedApps(selectedApps.filter(a => a !== app));
        } else {
            setSelectedApps([...selectedApps, app]);
        }
    };

    const updateEnvironmentalStress = (field: EnvironmentalStressField, value: number) => {
        setEnvironmentalStress((current) => ({
            ...current,
            [field]: clampStressValue(value),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedApps.length === 0) {
            alert("Select at least one compatible application.");
            return;
        }

        const newMaterial: CreateMaterialInput = {
            name,
            type,
            applications: selectedApps,
            cost_per_unit: Number(cost),
            strength_mpa: Number(strength),
            durability_years: Number(durability),
            eco_friendly_score: eco,
            maintenance_requirement: maintenance,
            installation_complexity: complexity,
            water_resistance: waterRes,
            weather_resistance: environmentalStress,
            thermal_conductivity: 0.5,
            fire_resistance_hours: 2,
            availability: 8,
            supplier_id: "Custom",
        };

        try {
            setIsSaving(true);
            await onAdd(newMaterial);
            setOpen(false);
            resetForm();
            alert(`Successfully added ${newMaterial.name} to the material catalog.`);
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Unable to save the material right now.";
            alert(message);
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setName("");
        setType("Other");
        setCost(0);
        setStrength(0);
        setDurability(0);
        setEco(5);
        setMaintenance(5);
        setComplexity(5);
        setWaterRes(5);
        setEnvironmentalStress(DEFAULT_ENVIRONMENTAL_STRESS_PROFILE);
        setSelectedApps([]);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-slate-900 text-white hover:bg-slate-800">
                    <Plus className="w-4 h-4 mr-2" /> Add Custom Material
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Custom Material</DialogTitle>
                    <DialogDescription>
                        Enter all the technical factors so the AI can accurately evaluate this material.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Material Name</Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Titanium Alloy" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MATERIAL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Critical Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cost">Cost (PKR per unit)</Label>
                            <Input id="cost" type="number" value={cost} onChange={e => setCost(Number(e.target.value))} required min={0} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="strength">Strength (MPa)</Label>
                            <Input id="strength" type="number" value={strength} onChange={e => setStrength(Number(e.target.value))} required min={0} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="durability">Durability (Years)</Label>
                            <Input id="durability" type="number" value={durability} onChange={e => setDurability(Number(e.target.value))} required min={0} />
                        </div>
                    </div>

                    {/* Applications */}
                    <div className="space-y-3 border p-4 rounded-lg bg-slate-50">
                        <Label className="text-base font-semibold">Compatible Applications (Required)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {MATERIAL_APPLICATIONS.map(app => (
                                <div key={app} className="flex items-center space-x-2">
                                    <Checkbox id={app} checked={selectedApps.includes(app)} onCheckedChange={() => handleAppToggle(app)} />
                                    <Label htmlFor={app} className="font-normal text-xs">{app}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 1-10 Scores */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label>Eco-Friendly Score</Label>
                                    <span className="text-sm font-bold text-emerald-600">{eco}/10</span>
                                </div>
                                <Slider value={[eco]} min={1} max={10} step={1} onValueChange={vals => setEco(vals[0])} className="[&>.relative>.absolute]:bg-emerald-500" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label>Complexity (1 = Easy)</Label>
                                    <span className="text-sm font-bold text-amber-600">{complexity}/10</span>
                                </div>
                                <Slider value={[complexity]} min={1} max={10} step={1} onValueChange={vals => setComplexity(vals[0])} className="[&>.relative>.absolute]:bg-amber-500" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label>Maintenance (1 = Low)</Label>
                                    <span className="text-sm font-bold text-blue-600">{maintenance}/10</span>
                                </div>
                                <Slider value={[maintenance]} min={1} max={10} step={1} onValueChange={vals => setMaintenance(vals[0])} />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label>Water Resistance</Label>
                                    <span className="text-sm font-bold text-cyan-600">{waterRes}/10</span>
                                </div>
                                <Slider value={[waterRes]} min={1} max={10} step={1} onValueChange={vals => setWaterRes(vals[0])} />
                            </div>
                        </div>
                    </div>

                    {/* Environmental Stress Profile */}
                    <div className="border-t pt-4">
                        <Label className="block mb-4 font-semibold">Environmental Stress Profile (1-10)</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ENVIRONMENTAL_STRESS_FIELDS.map(({ id, label }) => (
                                <div key={id} className="space-y-2">
                                    <Label className="text-xs">{label}</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={environmentalStress[id]}
                                        onChange={(e) => updateEnvironmentalStress(id, Number(e.target.value))}
                                        className="h-9"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Material"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
