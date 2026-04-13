/**
 * Estimator Data - All area measurements in Square Yards (SqYd)
 * All rates are per Square Yard (per SqYd)
 */
import { EstimatorState, generateId } from "./estimator";

export interface MaterialTemplate {
    name: string;
    unitCost: number;
    category: string;
}

export const MATERIAL_LIBRARY: MaterialTemplate[] = [
    // --- Structural ---
    { name: "Cement (Bag) - Bestway/Maple", unitCost: 1450, category: "Structural" },
    { name: "Steel / Rebar (kg) - Grade 60", unitCost: 260, category: "Structural" },
    { name: "Bricks (1000 pcs) - Awal Class", unitCost: 18000, category: "Structural" },
    { name: "Sand (Ravi) (cft)", unitCost: 40, category: "Structural" },
    { name: "Sand (Chenab) (cft)", unitCost: 55, category: "Structural" },
    { name: "Crush (Margalla) (cft)", unitCost: 115, category: "Structural" },
    { name: "Crush (Sargodha) (cft)", unitCost: 95, category: "Structural" },
    { name: "Earth Fill (Dumper)", unitCost: 7500, category: "Structural" },

    // --- Flooring / Marble (per SqYd) ---
    { name: "Marble - Sunny Grey (per SqYd)", unitCost: 765, category: "Flooring" },
    { name: "Marble - Badal Grey (per SqYd)", unitCost: 675, category: "Flooring" },
    { name: "Marble - Ziarat White (per SqYd)", unitCost: 3240, category: "Flooring" },
    { name: "Marble - Verona (per SqYd)", unitCost: 1440, category: "Flooring" },
    { name: "Marble - Michael Angelo (per SqYd)", unitCost: 2250, category: "Flooring" },
    { name: "Granite - Black (Galaxy) (per SqYd)", unitCost: 10800, category: "Flooring" },
    { name: "Tile (Porcelain) - 24x24 (per SqYd)", unitCost: 3150, category: "Flooring" },
    { name: "Tile (Ceramic) - 12x24 (per SqYd)", unitCost: 1980, category: "Flooring" },
    { name: "Tile Bond (Bag)", unitCost: 850, category: "Flooring" },

    // --- Finishing & Wood ---
    { name: "Paint (Gallon) - ICI/Dulux", unitCost: 4800, category: "Finishing" },
    { name: "Paint (Gallon) - Master/Local", unitCost: 3200, category: "Finishing" },
    { name: "False Ceiling (Gypsum) (per SqYd)", unitCost: 1440, category: "Finishing" },
    { name: "Kitchen Woodwork (uv/Acrylic) (rft)", unitCost: 18000, category: "Woodwork" },
    { name: "Wardrobe (Melamine) (per SqYd)", unitCost: 12600, category: "Woodwork" },
    { name: "Media Wall (Decorative) (per SqYd)", unitCost: 22500, category: "Woodwork" },
    { name: "Wood - Ash (cft)", unitCost: 11000, category: "Woodwork" },
    { name: "Wood - Teak/Sagwan (cft)", unitCost: 22000, category: "Woodwork" },
    { name: "Wood - Diyar (cft)", unitCost: 9500, category: "Woodwork" },
    { name: "Door - Ash Wood (Solid)", unitCost: 45000, category: "Woodwork" },
    { name: "Door - Ply/Flush (Standard)", unitCost: 15000, category: "Woodwork" },
    { name: "Aluminium Windows (per SqYd) - 1.6mm", unitCost: 11700, category: "Finishing" },

    // --- Systems ---
    { name: "Wiring (Coil) - GM/Pizza", unitCost: 15000, category: "Electrical" },
    { name: "Wiring (Coil) - Local", unitCost: 8000, category: "Electrical" },
    { name: "Pipes (PVC 4inch) (ft)", unitCost: 350, category: "Plumbing" },
    { name: "Commode - Porta/Sonex", unitCost: 22000, category: "Plumbing" },
    { name: "Vanity Set - Corian", unitCost: 35000, category: "Plumbing" },
];

export interface ProjectTemplate {
    label: string;
    description: string;
    data: Partial<EstimatorState>;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
    {
        label: "125 Sq Yards House (Grey Structure)",
        description: "Double story (125 sq yards), 3 Bed. Structure only. (5 Marla)",
        data: {
            areaInSqYd: 125,
            ratePerSqYd: 3300,
            laborCost: 1000000,
            profitMargin: 15,
            materials: [
                { id: "t1-1", name: "Cement (Bag) - Bestway/Maple", unitCost: 1450, quantity: 600 },
                { id: "t1-2", name: "Steel / Rebar (kg) - Grade 60", unitCost: 260, quantity: 3500 },
                { id: "t1-3", name: "Bricks (1000 pcs) - Awal Class", unitCost: 18000, quantity: 55 },
                { id: "t1-4", name: "Sand (Chenab) (cft)", unitCost: 55, quantity: 3200 },
                { id: "t1-5", name: "Crush (Margalla) (cft)", unitCost: 115, quantity: 1800 },
            ],
        },
    },
    {
        label: "250 Sq Yards House (Turnkey)",
        description: "Double story (250 sq yards), 5 Bed. High-end finish. (10 Marla)",
        data: {
            areaInSqYd: 250,
            ratePerSqYd: 7800,
            laborCost: 2600000,
            profitMargin: 20,
            materials: [
                { id: "t2-1", name: "Cement (Bag) - Bestway/Maple", unitCost: 1450, quantity: 1100 },
                { id: "t2-2", name: "Steel / Rebar (kg) - Grade 60", unitCost: 260, quantity: 6500 },
                { id: "t2-3", name: "Bricks (1000 pcs) - Awal Class", unitCost: 18000, quantity: 95 },
                { id: "t2-4", name: "Sand (Chenab) (cft)", unitCost: 55, quantity: 5500 },
                { id: "t2-5", name: "Marble - Verona (per SqYd)", unitCost: 1440, quantity: 250 },
                { id: "t2-6", name: "Paint (Gallon) - ICI/Dulux", unitCost: 4800, quantity: 180 },
                { id: "t2-7", name: "Wood - Teak/Sagwan (cft)", unitCost: 22000, quantity: 40 },
                { id: "t2-8", name: "Aluminium Windows (per SqYd) - 1.6mm", unitCost: 1300, quantity: 50 },
            ],
        },
    },
    {
        label: "500 Sq Yards House (Luxury)",
        description: "Double story (500 sq yards) + Basement. 1 Kanal.",
        data: {
            areaInSqYd: 500,
            ratePerSqYd: 9500, // Premium luxury
            laborCost: 4500000,
            profitMargin: 20,
            materials: [
                { id: "t3-1", name: "Cement (Bag) - Bestway/Maple", unitCost: 1450, quantity: 2200 },
                { id: "t3-2", name: "Steel / Rebar (kg) - Grade 60", unitCost: 260, quantity: 11000 },
                { id: "t3-3", name: "Marble - Ziarat White (per SqYd)", unitCost: 3240, quantity: 500 },
                { id: "t3-4", name: "Wood - Teak/Sagwan (cft)", unitCost: 22000, quantity: 150 },
                { id: "t3-5", name: "Granite - Black (Galaxy) (per SqYd)", unitCost: 10800, quantity: 44 },
                { id: "t3-6", name: "Aluminium Windows (per SqYd) - 1.6mm", unitCost: 1300, quantity: 89 },
            ],
        },
    },
    {
        label: "Commercial Plaza (3 Floors)",
        description: "1000 sq yards per floor. Grey structure commercial.",
        data: {
            areaInSqYd: 1000,
            ratePerSqYd: 4500, // Commercial grey structure is stronger
            laborCost: 3500000,
            profitMargin: 25,
            materials: [
                { id: "t4-1", name: "Cement (Bag) - Bestway/Maple", unitCost: 1450, quantity: 4000 },
                { id: "t4-2", name: "Steel / Rebar (kg) - Grade 60", unitCost: 260, quantity: 25000 },
                { id: "t4-3", name: "Sand (Ravi) (cft)", unitCost: 40, quantity: 12000 },
                { id: "t4-4", name: "Wiring (Coil) - GM/Pizza", unitCost: 15000, quantity: 50 },
            ],
        },
    },
];
