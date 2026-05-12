"use client";

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createMaterialCatalogEntry } from '@/lib/material-ai/client';
import { DEFAULT_ENVIRONMENTAL_STRESS_PROFILE } from '@/lib/material-ai/constants';
import { PlusCircle } from 'lucide-react';

export function ManualEntryForm() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState('Concrete');
    const [cost, setCost] = useState(1000);
    const [strength, setStrength] = useState(25);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        try {
            setIsSaving(true);

            await createMaterialCatalogEntry({
                name,
                type,
                applications: ['Structural'],
                strength_mpa: strength,
                durability_years: 50,
                thermal_conductivity: 1.5,
                fire_resistance_hours: 2,
                water_resistance: 8,
                eco_friendly_score: 5,
                cost_per_unit: cost,
                availability: 10,
                maintenance_requirement: 5,
                weather_resistance: DEFAULT_ENVIRONMENTAL_STRESS_PROFILE,
                installation_complexity: 5,
                supplier_id: 'MANUAL',
            });

            setOpen(false);
            alert("Material added to the database.");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to save the material.";
            alert(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="gap-2 bg-white text-slate-900 hover:bg-slate-100 border-none shadow-md">
                    <PlusCircle className="h-4 w-4 text-emerald-600" />
                    Add Custom Material
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Material</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Material Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Super Brick" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Concrete">Concrete</SelectItem>
                                    <SelectItem value="Steel">Steel</SelectItem>
                                    <SelectItem value="Wood">Wood</SelectItem>
                                    <SelectItem value="Brick">Brick</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Cost per Unit</Label>
                            <Input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Strength (MPa)</Label>
                        <Input type="number" value={strength} onChange={e => setStrength(Number(e.target.value))} />
                    </div>
                    <Button onClick={() => void handleSave()} className="w-full" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save to Database"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
