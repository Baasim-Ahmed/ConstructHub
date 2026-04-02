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

    // --- Flooring / Marble ---
    { name: "Marble - Sunny Grey (sqft)", unitCost: 85, category: "Flooring" },
    { name: "Marble - Badal Grey (sqft)", unitCost: 75, category: "Flooring" },
    { name: "Marble - Ziarat White (sqft)", unitCost: 360, category: "Flooring" },
    { name: "Marble - Verona (sqft)", unitCost: 160, category: "Flooring" },
    { name: "Marble - Michael Angelo (sqft)", unitCost: 250, category: "Flooring" },
    { name: "Granite - Black (Galaxy) (sqft)", unitCost: 1200, category: "Flooring" },
    { name: "Tile (Porcelain) - 24x24 (sqft)", unitCost: 350, category: "Flooring" },
    { name: "Tile (Ceramic) - 12x24 (sqft)", unitCost: 220, category: "Flooring" },
    { name: "Tile Bond (Bag)", unitCost: 850, category: "Flooring" },

    // --- Finishing & Wood ---
    { name: "Paint (Gallon) - ICI/Dulux", unitCost: 4800, category: "Finishing" },
    { name: "Paint (Gallon) - Master/Local", unitCost: 3200, category: "Finishing" },
    { name: "False Ceiling (Gypsum) (sqft)", unitCost: 160, category: "Finishing" },
    { name: "Kitchen Woodwork (uv/Acrylic) (rft)", unitCost: 18000, category: "Woodwork" },
    { name: "Wardrobe (Melamine) (sqft)", unitCost: 1400, category: "Woodwork" },
    { name: "Media Wall (Decorative) (sqft)", unitCost: 2500, category: "Woodwork" },
    { name: "Wood - Ash (cft)", unitCost: 11000, category: "Woodwork" },
    { name: "Wood - Teak/Sagwan (cft)", unitCost: 22000, category: "Woodwork" },
    { name: "Wood - Diyar (cft)", unitCost: 9500, category: "Woodwork" },
    { name: "Door - Ash Wood (Solid)", unitCost: 45000, category: "Woodwork" },
    { name: "Door - Ply/Flush (Standard)", unitCost: 15000, category: "Woodwork" },
    { name: "Aluminium Windows (sqft) - 1.6mm", unitCost: 1300, category: "Finishing" },

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
        description: "Double story (2200 sqft), 3 Bed. Structure only. (5 Marla)",
        data: {
            sqft: 2200,
            baseRate: 3300,
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
        description: "Double story (3600 sqft), 5 Bed. High-end finish. (10 Marla)",
        data: {
            sqft: 3600,
            baseRate: 7800,
            laborCost: 2600000,
            profitMargin: 20,
            materials: [
                { id: "t2-1", name: "Cement (Bag) - Bestway/Maple", unitCost: 1450, quantity: 1100 },
                { id: "t2-2", name: "Steel / Rebar (kg) - Grade 60", unitCost: 260, quantity: 6500 },
                { id: "t2-3", name: "Bricks (1000 pcs) - Awal Class", unitCost: 18000, quantity: 95 },
                { id: "t2-4", name: "Sand (Chenab) (cft)", unitCost: 55, quantity: 5500 },
                { id: "t2-5", name: "Marble - Verona (sqft)", unitCost: 160, quantity: 2800 },
                { id: "t2-6", name: "Paint (Gallon) - ICI/Dulux", unitCost: 4800, quantity: 180 },
                { id: "t2-7", name: "Wood - Teak/Sagwan (cft)", unitCost: 22000, quantity: 40 },
                { id: "t2-8", name: "Aluminium Windows (sqft) - 1.6mm", unitCost: 1300, quantity: 450 },
            ],
        },
    },
    {
        label: "500 Sq Yards House (Luxury)",
        description: "Double story (5500 sqft) + Basement. 1 Kanal.",
        data: {
            sqft: 5500,
            baseRate: 9500, // Premium luxury
            laborCost: 4500000,
            profitMargin: 20,
            materials: [
                { id: "t3-1", name: "Cement (Bag) - Bestway/Maple", unitCost: 1450, quantity: 2200 },
                { id: "t3-2", name: "Steel / Rebar (kg) - Grade 60", unitCost: 260, quantity: 11000 },
                { id: "t3-3", name: "Marble - Ziarat White (sqft)", unitCost: 360, quantity: 4500 },
                { id: "t3-4", name: "Wood - Teak/Sagwan (cft)", unitCost: 22000, quantity: 150 },
                { id: "t3-5", name: "Granite - Black (Galaxy) (sqft)", unitCost: 1200, quantity: 400 },
                { id: "t3-6", name: "Aluminium Windows (sqft) - 1.6mm", unitCost: 1300, quantity: 800 },
            ],
        },
    },
    {
        label: "Commercial Plaza (3 Floors)",
        description: "3000 sqft per floor. Grey structure commercial.",
        data: {
            sqft: 9000,
            baseRate: 4500, // Commercial grey structure is stronger
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
