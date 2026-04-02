"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Calculator, AlertCircle, CheckCircle2, Download, RotateCcw, Save, FolderOpen, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MaterialRow } from "@/components/estimator/MaterialRow";
import {
  Material,
  EstimatorState,
  EstimationResult,
  formatCurrency,
  calculateEstimate,
  validateEstimator,
  generateId,
} from "@/lib/estimator";
import { generateEstimationPDF } from "@/lib/pdf-generator";
import { PageHeader } from "@/components/ui/page-header";
import { PROJECT_TEMPLATES, ProjectTemplate } from "@/lib/estimator-data";
import { LayoutTemplate } from "lucide-react";

export default function EstimatorPage() {
  const [state, setState] = useState<EstimatorState>({
    sqft: 0,
    laborCost: 0,
    autoLabor: true,
    laborRate: 1000,
    laborCount: 5,
    projectDurationDays: 180,
    profitMargin: 15,
    baseRate: 500,
    bedroomCount: 0,
    livingRoomCount: 0,
    kitchenCount: 0,
    bathroomCount: 0,
    floors: 1,
    materials: [
      {
        id: generateId(),
        name: "Cement",
        unitCost: 1200,
        quantity: 50,
      },
      {
        id: generateId(),
        name: "Steel",
        unitCost: 250000,
        quantity: 1,
      },
    ],
  });

  const [result, setResult] = useState<EstimationResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);

  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  // Load saved projects on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("constructhub_saved_estimates");
      if (saved) {
        try {
          setSavedProjects(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved projects", e);
        }
      }
    }
  }, []);

  const handleSaveProject = () => {
    const name = window.prompt("Enter a name for this project:", `Estimate - ${new Date().toLocaleDateString()}`);
    if (!name) return;

    const newProject = {
      id: generateId(),
      name,
      date: new Date().toISOString(),
      data: state
    };

    const updated = [newProject, ...savedProjects];
    setSavedProjects(updated);
    localStorage.setItem("constructhub_saved_estimates", JSON.stringify(updated));
  };

  const handleLoadProject = (project: any) => {
    if (confirm(`Load "${project.name}"? Unsaved changes will be lost.`)) {
      setState(project.data);
      setErrors([]);
      setLoadDialogOpen(false); // Close modal

      // Auto-calculate results
      const validation = validateEstimator(project.data);
      if (validation.valid) {
        const estimation = calculateEstimate(project.data);
        setResult(estimation);
      } else {
        setResult(null); // Or show errors?
      }
    }
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this saved project?")) {
      const updated = savedProjects.filter(p => p.id !== id);
      setSavedProjects(updated);
      localStorage.setItem("constructhub_saved_estimates", JSON.stringify(updated));
    }
  };

  // Creative Auto-Adjust Logic
  // Creative Auto-Adjust Logic
  const handleLayoutChange = (field: keyof EstimatorState, value: number) => {
    // 1. Update the state field
    const newState = { ...state, [field]: value };

    // 2. Derive new quantities based on the updated layout
    const { bedroomCount, livingRoomCount, kitchenCount, bathroomCount, floors } = newState;
    const floorCount = Math.max(1, floors || 1);

    // Helper to check case-insensitive match
    const matches = (name: string, keyword: string) => name.toLowerCase().includes(keyword.toLowerCase());

    const newMaterials = newState.materials.map(m => {
      // Sensitivity checks
      const isDoor = matches(m.name, "Door");
      const isWardrobe = matches(m.name, "Wardrobe");
      const isKitchen = matches(m.name, "Kitchen Woodwork");
      const isCeiling = matches(m.name, "False Ceiling");
      const isSanitary = matches(m.name, "Commode") || matches(m.name, "Vanity");
      const isWiring = matches(m.name, "Wiring");
      const isMedia = matches(m.name, "Media Wall");

      // Structural Checks
      const isCement = matches(m.name, "Cement");
      const isSteel = matches(m.name, "Steel");
      const isBricks = matches(m.name, "Bricks");
      const isSand = matches(m.name, "Sand");
      const isCrush = matches(m.name, "Crush");
      const isStairs = matches(m.name, "Stairs");

      // Calculate Total "Room Units" for structural scaling
      // A bedroom is a full unit, bath is 0.5, kitchen is 0.8, living is 1.5
      const constructionUnits = (bedroomCount || 0) + ((livingRoomCount || 0) * 1.5) + ((kitchenCount || 0) * 0.8) + ((bathroomCount || 0) * 0.5);

      if (isDoor) {
        // 1 Main Door (Always) + 1 per Bedroom + 1 per Kitchen + 1 per Bath
        return { ...m, quantity: 1 + (bedroomCount || 0) + (kitchenCount || 0) + (bathroomCount || 0) };
      }
      if (isWardrobe) {
        return { ...m, quantity: (bedroomCount || 0) * 45 };
      }
      if (isKitchen) {
        return { ...m, quantity: (kitchenCount || 0) * 20 };
      }
      if (isCeiling) {
        return { ...m, quantity: (livingRoomCount || 0) * 250 };
      }
      if (isMedia) {
        return { ...m, quantity: (livingRoomCount || 0) * 60 };
      }
      if (isSanitary) {
        return { ...m, quantity: (bathroomCount || 0) };
      }
      if (isWiring) {
        const totalRooms = (bedroomCount || 0) + (livingRoomCount || 0) + (kitchenCount || 0);
        return { ...m, quantity: Math.max(1, totalRooms * 2) };
      }
      if (isStairs) {
        return { ...m, quantity: Math.max(0, floorCount - 1) };
      }

      // -- Structural Scaling --
      // Scale based on TOTAL units.
      if (isCement) {
        // Base ~200 + 40 per unit
        return { ...m, quantity: 200 + (constructionUnits * 40) };
      }
      if (isBricks) {
        // Base 15000 + 4000 per unit
        return { ...m, quantity: 15000 + (constructionUnits * 4000) };
      }
      if (isSteel) {
        // Base 1000 + 200 per unit
        // Multi-story factor: extra steel
        const multiStoryFactor = 1 + ((floorCount - 1) * 0.15);
        return { ...m, quantity: (1000 + (constructionUnits * 200)) * multiStoryFactor };
      }
      if (isSand) {
        return { ...m, quantity: 500 + (constructionUnits * 150) };
      }
      if (isCrush) {
        return { ...m, quantity: 400 + (constructionUnits * 120) };
      }

      return m;
    });

    // Check if we need to ADD missing creative items that aren't in the list yet
    const ensureItem = (keywords: string[], defaultName: string, defaultCost: number, qty: number) => {
      const exists = newMaterials.some(m => keywords.some(k => matches(m.name, k)));
      if (!exists && qty > 0) {
        newMaterials.push({
          id: generateId(),
          name: defaultName,
          unitCost: defaultCost,
          quantity: qty
        });
      }
    };

    if (bedroomCount > 0) ensureItem(["Wardrobe"], "Wardrobe (Melamine) (sqft)", 1400, bedroomCount * 45);
    if (kitchenCount > 0) ensureItem(["Kitchen"], "Kitchen Woodwork (uv/Acrylic) (rft)", 18000, kitchenCount * 20);
    if (livingRoomCount > 0) ensureItem(["Ceiling"], "False Ceiling (Gypsum) (sqft)", 160, livingRoomCount * 250);
    if (livingRoomCount > 0) ensureItem(["Media"], "Media Wall (Decorative) (sqft)", 2500, livingRoomCount * 60);

    // Also ensure Doors are added if missing
    if ((bedroomCount + bathroomCount + kitchenCount) > 0) {
      ensureItem(["Door"], "Door - Ply/Flush (Standard)", 15000, 1 + bedroomCount + bathroomCount + kitchenCount);
    }

    // Ensure Stairs
    if (floorCount > 1) {
      ensureItem(["Stairs", "Railing"], "Stairs (Marble & Railing) (flight)", 75000, floorCount - 1);
    }

    setState({ ...newState, materials: newMaterials });
    setErrors([]);
  };

  const handleInputChange = (field: keyof EstimatorState, value: any) => {
    setState((prev) => {
      let newState = { ...prev, [field]: value };

      // Parse numbers safely
      if (typeof value === "string") {
        const floatVal = parseFloat(value) || 0;
        newState = { ...prev, [field]: floatVal };
      }

      // Auto-Calculate Labor Logic
      if (newState.autoLabor && (field === 'sqft' || field === 'laborRate' || field === 'projectDurationDays' || field === 'laborCount' || field === 'autoLabor')) {
        // Labor = Daily Rate * Count * Duration
        newState.laborCost = (newState.laborRate || 0) * (newState.projectDurationDays || 0) * (newState.laborCount || 0);
      }

      // If autoLabor was just turned ON
      if (field === 'autoLabor' && value === true) {
        newState.laborCost = (newState.laborRate || 0) * (newState.projectDurationDays || 0) * (newState.laborCount || 0);
      }

      return newState;
    });
    setErrors([]);
  };

  const handleMaterialUpdate = (id: string, field: keyof Material, value: any) => {
    setState((prev) => ({
      ...prev,
      materials: prev.materials.map((material) =>
        material.id === id ? { ...material, [field]: value } : material
      ),
    }));
    setErrors([]);
  };

  const handleAddMaterial = () => {
    setState((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        {
          id: generateId(),
          name: "",
          unitCost: 0,
          quantity: 0,
        },
      ],
    }));
  };

  const handleRemoveMaterial = (id: string) => {
    setState((prev) => ({
      ...prev,
      materials: prev.materials.filter((material) => material.id !== id),
    }));
  };

  const handleCalculate = () => {
    const validation = validateEstimator(state);
    if (!validation.valid) {
      setErrors(validation.errors);
      setResult(null);
      return;
    }

    setErrors([]);
    const estimation = calculateEstimate(state);
    setResult(estimation);
  };

  const handleReset = () => {
    setState({
      sqft: 0,
      laborCost: 0,
      autoLabor: true,
      laborRate: 1000,
      laborCount: 5,
      projectDurationDays: 180,
      profitMargin: 15,
      baseRate: 500,
      bedroomCount: 0,
      livingRoomCount: 0,
      kitchenCount: 0,
      bathroomCount: 0,
      floors: 1,
      materials: [
        {
          id: generateId(),
          name: "Cement",
          unitCost: 1200,
          quantity: 50,
        },
        {
          id: generateId(),
          name: "Steel",
          unitCost: 250000,
          quantity: 1,
        },
      ],
    });
    setResult(null);
    setErrors([]);
  };

  const handleDownloadPDF = () => {
    if (result) {
      generateEstimationPDF(result, state);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up" >
      <PageHeader
        title="Project Estimator"
        description="Calculate detailed cost estimates with material breakdowns and profit margins."
      />

      {/* Project Templates */}
      <Card className="bg-primary/5 border-primary/20" >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            <CardTitle className="text-base text-primary">Quick Start Templates</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {PROJECT_TEMPLATES.map((template, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="bg-white hover:bg-primary hover:text-white border-primary/30 transition-all text-xs"
                onClick={() => {
                  if (template.data) {
                    setState(prev => ({
                      ...prev,
                      ...template.data,
                      // Ensure materials have unique IDs
                      materials: template.data.materials?.map(m => ({ ...m, id: generateId() })) || []
                    }));
                    setResult(null);
                    setErrors([]);
                  }
                }}
              >
                {template.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card >

      {/* Error Alerts */}
      {
        errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="mt-2 space-y-1">
                {errors.map((error, idx) => (
                  <div key={idx} className="text-sm">
                    • {error}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )
      }

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Dimensions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Dimensions & Layout</CardTitle>
              <CardDescription>Enter project size, rates, and layout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sqft">Area (Sq Yards / Sqft)</Label>
                  <Input
                    id="sqft"
                    type="number"
                    placeholder="Enter project size"
                    value={state.sqft || ""}
                    onChange={(e) => handleInputChange("sqft", e.target.value)}
                    className="text-base"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseRate">Base Rate (Rs.)</Label>
                  <Input
                    id="baseRate"
                    type="number"
                    placeholder="Cost per unit"
                    value={state.baseRate || ""}
                    onChange={(e) => handleInputChange("baseRate", e.target.value)}
                    className="text-base"
                    min="0"
                  />
                </div>

                {/* Detailed Layout Inputs */}
                <div className="col-span-1 md:col-span-2 space-y-3 pt-2">
                  <Label className="text-primary font-semibold">Layout Details (Auto-Adjusts Materials)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="floors" className="text-xs text-muted-foreground">Floors</Label>
                      <Input
                        id="floors"
                        type="number"
                        value={state.floors || ""}
                        onChange={(e) => handleLayoutChange("floors", parseFloat(e.target.value) || 0)}
                        className="h-9"
                        placeholder="Stories"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="bedroomCount" className="text-xs text-muted-foreground">Bedrooms</Label>
                      <Input
                        id="bedroomCount"
                        type="number"
                        value={state.bedroomCount || ""}
                        onChange={(e) => handleLayoutChange("bedroomCount", parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="kitchenCount" className="text-xs text-muted-foreground">Kitchens</Label>
                      <Input
                        id="kitchenCount"
                        type="number"
                        value={state.kitchenCount || ""}
                        onChange={(e) => handleLayoutChange("kitchenCount", parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="livingRoomCount" className="text-xs text-muted-foreground">Living / Lounges</Label>
                      <Input
                        id="livingRoomCount"
                        type="number"
                        value={state.livingRoomCount || ""}
                        onChange={(e) => handleLayoutChange("livingRoomCount", parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="bathroomCount" className="text-xs text-muted-foreground">Bathrooms</Label>
                      <Input
                        id="bathroomCount"
                        type="number"
                        value={state.bathroomCount || ""}
                        onChange={(e) => handleLayoutChange("bathroomCount", parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Labor Cost Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Labor Cost</CardTitle>
                  <CardDescription>Total labor expenses</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="checkbox"
                    id="autoLabor"
                    className="h-4 w-4"
                    checked={state.autoLabor}
                    onChange={(e) => handleInputChange("autoLabor", e.target.checked)}
                  />
                  <Label htmlFor="autoLabor" className="text-sm cursor-pointer">Auto-Calculate</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.autoLabor && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="laborRate">Daily Labor Cost (Rs.)</Label>
                      <Input
                        id="laborRate"
                        type="number"
                        placeholder="e.g. 5000"
                        value={state.laborRate || ""}
                        onChange={(e) => handleInputChange("laborRate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="projectDurationDays">Duration (Days)</Label>
                      <Input
                        id="projectDurationDays"
                        type="number"
                        placeholder="e.g. 180"
                        value={state.projectDurationDays || ""}
                        onChange={(e) => handleInputChange("projectDurationDays", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="laborCount">No. of Laborers</Label>
                      <Input
                        id="laborCount"
                        type="number"
                        placeholder="e.g. 5"
                        value={state.laborCount || ""}
                        onChange={(e) => handleInputChange("laborCount", e.target.value)}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="laborCost">Total Labor Cost (PKR)</Label>
                  <Input
                    id="laborCost"
                    type="number"
                    placeholder="Total labor cost"
                    value={state.laborCost || ""}
                    onChange={(e) => handleInputChange("laborCost", e.target.value)}
                    className="text-base"
                    min="0"
                    disabled={state.autoLabor}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Materials Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Materials</CardTitle>
                <CardDescription>Add materials required for the project</CardDescription>
              </div>
              <Button onClick={handleAddMaterial} size="sm" variant="secondary" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Material
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Helper to render a group */}
                {(() => {
                  const groups = {
                    Structure: ["Cement", "Sand", "Crush", "Bricks", "Steel", "Kassu", "Earthfill", "Bitumen"],
                    Finishing: ["Tiles", "Paint", "Ceiling", "Windows", "Glass", "Wiring", "Switch", "Fan", "Light"],
                    Fixtures: ["Door", "Wardrobe", "Kitchen", "Sanitary", "Stairs", "Media", "Commode", "Vanity", "Railing"],
                  };

                  const getGroup = (name: string) => {
                    if (groups.Structure.some(k => name.toLowerCase().includes(k.toLowerCase()))) return "Structure (Grey Structure)";
                    if (groups.Finishing.some(k => name.toLowerCase().includes(k.toLowerCase()))) return "Finishing";
                    if (groups.Fixtures.some(k => name.toLowerCase().includes(k.toLowerCase()))) return "Fixtures & Woodwork";
                    return "Other";
                  };

                  const groupedMaterials = state.materials.reduce((acc, m) => {
                    const group = getGroup(m.name);
                    if (!acc[group]) acc[group] = [];
                    acc[group].push(m);
                    return acc;
                  }, {} as Record<string, typeof state.materials>);

                  // Order: Structure, Finishing, Fixtures, Other
                  const sortedGroups = ["Structure (Grey Structure)", "Finishing", "Fixtures & Woodwork", "Other"];

                  return sortedGroups.map(groupName => {
                    const materials = groupedMaterials[groupName];
                    if (!materials || materials.length === 0) return null;

                    return (
                      <div key={groupName} className="border rounded-lg overflow-hidden">
                        <div className="bg-muted/40 px-4 py-2 border-b font-medium text-sm text-primary flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${groupName.includes("Structure") ? "bg-orange-500" :
                            groupName.includes("Finishing") ? "bg-blue-500" :
                              groupName.includes("Fixtures") ? "bg-emerald-500" : "bg-gray-400"
                            }`}></div>
                          {groupName}
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[40%]">Material Name</TableHead>
                                <TableHead>Unit Cost</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead className="text-right">Total Cost</TableHead>
                                <TableHead className="text-right w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {materials.map((material) => (
                                <MaterialRow
                                  key={material.id}
                                  material={material}
                                  onUpdate={handleMaterialUpdate}
                                  onRemove={handleRemoveMaterial}
                                />
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Profit Margin Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profit Margin</CardTitle>
              <CardDescription>Set your profit margin percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="profitMargin">Profit Margin (%)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="profitMargin"
                    type="number"
                    placeholder="Enter profit margin"
                    value={state.profitMargin || ""}
                    onChange={(e) => handleInputChange("profitMargin", e.target.value)}
                    className="text-base flex-1"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm font-semibold text-gray-600 min-w-12">
                    {state.profitMargin}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleCalculate} size="lg" className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md">
              <Calculator className="h-5 w-5" />
              Calculate Estimate
            </Button>

            {/* Save Button */}
            <Button onClick={handleSaveProject} variant="outline" size="lg" className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>

            {/* Load Button (Dialog) */}
            <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Load
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Saved Projects</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {savedProjects.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No saved projects found.</p>
                  ) : (
                    savedProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                        onClick={() => handleLoadProject(project)}
                      >
                        <div>
                          <p className="font-medium text-sm text-gray-900">{project.name}</p>
                          <p className="text-xs text-gray-500">{new Date(project.date).toLocaleDateString()} • {new Date(project.date).toLocaleTimeString()}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                          onClick={(e) => handleDeleteProject(project.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={handleReset} variant="outline" size="lg" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Right Column: Results Section */}
        <div className="lg:col-span-1">
          {result ? (
            <div className="space-y-4 sticky top-6">
              {/* Success Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">Calculation Complete</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="h-8 gap-2">
                  <Download className="h-3 w-3" />
                  PDF
                </Button>
              </div>

              {/* Results Card */}
              <Card className="border-emerald-200 bg-gradient-to-b from-white to-emerald-50 shadow-lg overflow-hidden">
                <div className="bg-emerald-600 h-2 w-full"></div>
                <CardHeader>
                  <CardTitle className="text-lg text-emerald-900">Estimated Cost Range</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Main Result */}
                  <div className="bg-white rounded-xl p-6 border border-emerald-100 shadow-sm text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">Total Project Value</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {formatCurrency(result.minRange)} - {formatCurrency(result.maxRange)}
                    </p>
                  </div>

                  <Separator className="bg-emerald-200/50" />

                  {/* Breakdown */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 font-medium">
                        Material Cost
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(result.totalMaterialCost)}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 font-medium">
                        Base Cost <span className="text-xs text-gray-400 font-normal">(incl. Labor)</span>
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(result.baseCost)}
                      </p>
                    </div>

                    <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg -mx-2">
                      <p className="text-sm text-blue-700 font-medium">
                        Profit ({state.profitMargin}%)
                      </p>
                      <p className="text-sm font-bold text-blue-700">
                        + {formatCurrency(result.profitAmount)}
                      </p>
                    </div>

                    <Separator className="bg-emerald-200/50" />

                    <div className="pt-2">
                      <p className="text-xs text-center text-gray-500 mb-1">Final Estimated Cost</p>
                      <p className="text-3xl font-bold text-center text-gray-900 tracking-tight">
                        {formatCurrency(result.finalCost)}
                      </p>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="bg-emerald-100/50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 leading-relaxed">
                    <p>
                      <strong>Note:</strong> The range represents ±10% variance from the base
                      calculated cost to account for market fluctuations and contingencies.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-dashed border-2 sticky top-6">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Calculator className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Estimate Calculator</h3>
                <p className="text-sm text-gray-500 max-w-[200px]">
                  Fill in the project details and click <strong>Calculate</strong> to see the cost breakdown.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div >
  );
}
