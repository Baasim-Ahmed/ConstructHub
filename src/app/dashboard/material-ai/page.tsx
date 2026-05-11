"use client";

import { useCallback, useEffect, useState } from 'react';

import { AddMaterialForm } from '@/components/material-ai/AddMaterialForm';
import { ComparisonView } from '@/components/material-ai/ComparisonView';
import { MaterialDetailDialog } from '@/components/material-ai/MaterialDetailDialog';
import { MaterialRecommendations } from '@/components/material-ai/MaterialRecommendations';
import { SpecificationForm } from '@/components/material-ai/SpecificationForm';
import { Button } from '@/components/ui/button';
import { createMaterialCatalogEntry, fetchMaterialCatalog } from '@/lib/material-ai/client';
import { RecommendationEngine } from '@/lib/material-ai/recommendation-engine';
import { CreateMaterialInput, Material, ProjectSpecs, ScoredMaterial } from '@/lib/material-ai/types';

export default function MaterialAIPage() {
    const [engine, setEngine] = useState<RecommendationEngine | null>(null);
    const [catalogError, setCatalogError] = useState<string | null>(null);
    const [isCatalogLoading, setIsCatalogLoading] = useState(true);

    const [recommendations, setRecommendations] = useState<ScoredMaterial[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [lastSpecs, setLastSpecs] = useState<ProjectSpecs | null>(null);

    const [selectedMaterial, setSelectedMaterial] = useState<ScoredMaterial | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [comparisonList, setComparisonList] = useState<ScoredMaterial[]>([]);

    const loadCatalog = useCallback(async (rerunSpecs?: ProjectSpecs | null) => {
        setIsCatalogLoading(true);
        setCatalogError(null);

        try {
            const materials = await fetchMaterialCatalog();
            const nextEngine = new RecommendationEngine(materials);
            setEngine(nextEngine);

            if (rerunSpecs) {
                setRecommendations(nextEngine.predict(rerunSpecs));
                setHasSearched(true);
            }
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Unable to load the material catalog right now.';
            setCatalogError(message);
            setEngine(null);
            setRecommendations([]);
        } finally {
            setIsCatalogLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadCatalog();
    }, [loadCatalog]);

    const handleSpecSubmit = async (specs: ProjectSpecs) => {
        if (!engine) {
            setCatalogError('The material catalog is still unavailable. Retry loading the data and try again.');
            return;
        }

        setIsAnalyzing(true);
        setHasSearched(true);
        setLastSpecs(specs);
        setComparisonList([]);

        try {
            await new Promise((resolve) => setTimeout(resolve, 350));
            const results = engine.predict(specs);
            setRecommendations(results);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAddCustomMaterial = async (material: Material) => {
        const payload: CreateMaterialInput = {
            ...material,
            id: material.id > 0 ? material.id : undefined,
        };

        await createMaterialCatalogEntry(payload);
        await loadCatalog(lastSpecs);
    };

    const addToComparison = (material: ScoredMaterial) => {
        if (!comparisonList.find((entry) => entry.id === material.id)) {
            if (comparisonList.length >= 3) {
                alert("You can compare up to 3 materials.");
                return;
            }

            setComparisonList([...comparisonList, material]);
        }
    };

    const removeFromComparison = (id: number) => {
        setComparisonList(comparisonList.filter((material) => material.id !== id));
    };

    const handleViewDetails = (material: ScoredMaterial) => {
        setSelectedMaterial(material);
        setDetailOpen(true);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto py-8 animate-fade-in-up">
            <MaterialDetailDialog
                material={selectedMaterial}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onCompare={(material) => {
                    addToComparison(material);
                    setDetailOpen(false);
                }}
            />

            <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold mb-4 border border-white/10">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            AI Model Active (Optimized Hybrid Ranking)
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight mb-3">ConstructHUB Material AI</h1>
                        <p className="text-slate-300 text-lg leading-relaxed">
                            Optimize your construction projects with intelligent material recommendations using hybrid machine learning algorithms.
                        </p>
                    </div>
                    <div className="flex-shrink-0 flex gap-3">
                        <AddMaterialForm onAdd={handleAddCustomMaterial} />
                    </div>
                </div>
            </div>

            {catalogError && (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                    <span>{catalogError}</span>
                    <Button variant="outline" className="border-rose-200 bg-white text-rose-700 hover:bg-rose-100" onClick={() => void loadCatalog(lastSpecs)}>
                        Retry
                    </Button>
                </div>
            )}

            {comparisonList.length > 0 && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 animate-in slide-in-from-top-4">
                    <ComparisonView materials={comparisonList} onRemove={removeFromComparison} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1">
                    <SpecificationForm onSubmit={handleSpecSubmit} isLoading={isAnalyzing || isCatalogLoading} />
                </div>

                <div className="lg:col-span-3 space-y-6">
                    {isCatalogLoading ? (
                        <div className="flex flex-col items-center justify-center h-[500px] rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500">
                            <div className="h-10 w-10 rounded-full border-2 border-slate-200 border-t-slate-700 animate-spin mb-4" />
                            Loading material catalog from Neon database...
                        </div>
                    ) : hasSearched ? (
                        <>
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-slate-800">
                                    Recommended Materials
                                </h2>
                                <span className="text-sm text-slate-400">
                                    {recommendations.length} matches found
                                </span>
                            </div>
                            <MaterialRecommendations
                                recommendations={recommendations}
                                onCompare={addToComparison}
                                onViewDetails={handleViewDetails}
                            />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[500px] border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 backdrop-blur-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-grid-slate-200/[0.4] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />

                            <div className="relative z-10 text-center p-8 max-w-md transition-transform duration-500 group-hover:scale-105">
                                <div className="w-24 h-24 bg-white rounded-full shadow-xl shadow-slate-200/50 flex items-center justify-center mx-auto mb-6">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center animate-pulse-slow">
                                        <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Analyze</h3>
                                <p className="text-slate-500 leading-relaxed">
                                    Configure your project requirements on the left to let our AI models find the perfect materials for your needs.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
