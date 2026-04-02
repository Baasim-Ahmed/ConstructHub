import { Material } from './types';

// Pricing estimates based on approximate Pakistani Market Rates (PKR)
// Units approx:
// Concrete: per cubic meter (~25,000 - 35,000)
// Steel: per ton (~280,000 - 350,000)
// Wood: per cubic meter (~150,000+)
// Brick: per 1000 units (~18,000 - 25,000) -> Normalized to ~20,000 per unit batch
// Finishing (Tiles/Glass): per sq meter (~3,000 - 15,000)

export const MATERIALS: Material[] = [
    // Concrete
    {
        id: 1,
        name: "Standard Portland Cement Concrete",
        type: "Concrete",
        applications: ["Foundation", "Structural", "Flooring"],
        strength_mpa: 25.0,
        durability_years: 50,
        thermal_conductivity: 1.7,
        fire_resistance_hours: 4,
        water_resistance: 8,
        eco_friendly_score: 4,
        cost_per_unit: 25000.0, // Rs. 25k per m3
        availability: 9,
        maintenance_requirement: 3,
        weather_resistance: { heat: 9, cold: 7, humidity: 8, uv: 8 },
        installation_complexity: 5,
        supplier_id: "SUP001",
    },
    {
        id: 2,
        name: "High-Strength Concrete",
        type: "Concrete",
        applications: ["Foundation", "Structural"],
        strength_mpa: 60.0,
        durability_years: 75,
        thermal_conductivity: 1.8,
        fire_resistance_hours: 4,
        water_resistance: 9,
        eco_friendly_score: 5,
        cost_per_unit: 32000.0, // Rs. 32k per m3
        availability: 8,
        maintenance_requirement: 3,
        weather_resistance: { heat: 9, cold: 8, humidity: 9, uv: 9 },
        installation_complexity: 6,
        supplier_id: "SUP002",
    },
    // Steel
    {
        id: 3,
        name: "Structural Steel (Grade 60)",
        type: "Steel",
        applications: ["Structural"],
        strength_mpa: 420.0, // Grade 60 is approx 420 MPa
        durability_years: 60,
        thermal_conductivity: 45.0,
        fire_resistance_hours: 0.5,
        water_resistance: 4,
        eco_friendly_score: 6,
        cost_per_unit: 285000.0, // Rs. 285k per ton
        availability: 8,
        maintenance_requirement: 5,
        weather_resistance: { heat: 6, cold: 8, humidity: 3, uv: 7 },
        installation_complexity: 7,
        supplier_id: "SUP003",
    },
    {
        id: 4,
        name: "Stainless Steel (304)",
        type: "Steel",
        applications: ["Structural", "Facade", "Interior Finishing"],
        strength_mpa: 515.0,
        durability_years: 80,
        thermal_conductivity: 16.0,
        fire_resistance_hours: 0.8,
        water_resistance: 10,
        eco_friendly_score: 7,
        cost_per_unit: 850000.0, // Premium imported steel
        availability: 7,
        maintenance_requirement: 2,
        weather_resistance: { heat: 8, cold: 9, humidity: 10, uv: 9 },
        installation_complexity: 7,
        supplier_id: "SUP003",
    },
    // Wood
    {
        id: 5,
        name: "Deodar (Diyar) Wood",
        type: "Wood",
        applications: ["Structural", "Flooring", "Wall"],
        strength_mpa: 85.0,
        durability_years: 25,
        thermal_conductivity: 0.12,
        fire_resistance_hours: 0.75,
        water_resistance: 3,
        eco_friendly_score: 8,
        cost_per_unit: 180000.0, // Expensive local timber per m3 estimate
        availability: 7,
        maintenance_requirement: 7,
        weather_resistance: { heat: 5, cold: 7, humidity: 4, uv: 3 },
        installation_complexity: 4,
        supplier_id: "SUP005",
    },
    // Brick
    {
        id: 7,
        name: "First Class Clay Brick",
        type: "Brick",
        applications: ["Wall", "Facade"],
        strength_mpa: 15.0,
        durability_years: 100,
        thermal_conductivity: 0.6,
        fire_resistance_hours: 6,
        water_resistance: 7,
        eco_friendly_score: 7,
        cost_per_unit: 22000.0, // Per 1000 bricks
        availability: 9,
        maintenance_requirement: 2,
        weather_resistance: { heat: 9, cold: 8, humidity: 7, uv: 9 },
        installation_complexity: 6,
        supplier_id: "SUP007",
    },
    // Glass
    {
        id: 8,
        name: "Tempered Glass (12mm)",
        type: "Glass",
        applications: ["Windows", "Doors", "Facade"],
        strength_mpa: 100.0,
        durability_years: 30,
        thermal_conductivity: 1.0,
        fire_resistance_hours: 0.25,
        water_resistance: 10,
        eco_friendly_score: 6,
        cost_per_unit: 12000.0, // Per sqm
        availability: 8,
        maintenance_requirement: 4,
        weather_resistance: { heat: 7, cold: 7, humidity: 10, uv: 7 },
        installation_complexity: 7,
        supplier_id: "SUP008",
    },
    // Aluminum
    {
        id: 10,
        name: "Aluminum Section (Powder Coated)",
        type: "Aluminum",
        applications: ["Structural", "Facade", "Windows", "Doors"],
        strength_mpa: 310.0,
        durability_years: 40,
        thermal_conductivity: 167.0,
        fire_resistance_hours: 0.1,
        water_resistance: 8,
        eco_friendly_score: 8,
        cost_per_unit: 45000.0, // Per unit/window estimate
        availability: 8,
        maintenance_requirement: 3,
        weather_resistance: { heat: 7, cold: 9, humidity: 8, uv: 9 },
        installation_complexity: 5,
        supplier_id: "SUP010",
    },
    // Stone
    {
        id: 11,
        name: "Local Granite",
        type: "Stone",
        applications: ["Flooring", "Facade", "Interior Finishing"],
        strength_mpa: 170.0,
        durability_years: 100,
        thermal_conductivity: 2.8,
        fire_resistance_hours: 6,
        water_resistance: 8,
        eco_friendly_score: 6,
        cost_per_unit: 8500.0, // Per sqm
        availability: 6,
        maintenance_requirement: 3,
        weather_resistance: { heat: 9, cold: 9, humidity: 8, uv: 9 },
        installation_complexity: 7,
        supplier_id: "SUP011",
    },
    // Ceramic
    {
        id: 12,
        name: "Porcelain Master Tiles",
        type: "Ceramic",
        applications: ["Flooring", "Wall", "Interior Finishing"],
        strength_mpa: 35.0,
        durability_years: 50,
        thermal_conductivity: 1.5,
        fire_resistance_hours: 5,
        water_resistance: 9,
        eco_friendly_score: 6,
        cost_per_unit: 3500.0, // Per sqm
        availability: 9,
        maintenance_requirement: 2,
        weather_resistance: { heat: 9, cold: 8, humidity: 9, uv: 9 },
        installation_complexity: 5,
        supplier_id: "SUP012",
    },
    // Plastic
    {
        id: 13,
        name: "PVC Paneling",
        type: "Plastic",
        applications: ["Doors", "Windows", "Interior Finishing"],
        strength_mpa: 55.0,
        durability_years: 35,
        thermal_conductivity: 0.19,
        fire_resistance_hours: 0.2,
        water_resistance: 10,
        eco_friendly_score: 3,
        cost_per_unit: 1800.0, // Per sqm
        availability: 10,
        maintenance_requirement: 2,
        weather_resistance: { heat: 5, cold: 8, humidity: 10, uv: 4 },
        installation_complexity: 3,
        supplier_id: "SUP013",
    },
    // New Materials (Pakistan Context)
    // Marble
    {
        id: 14,
        name: "Ziarat White Marble",
        type: "Stone",
        applications: ["Flooring", "Stairs", "Interior Finishing"],
        strength_mpa: 120.0,
        durability_years: 80,
        thermal_conductivity: 2.5,
        fire_resistance_hours: 4,
        water_resistance: 7,
        eco_friendly_score: 5,
        cost_per_unit: 5500.0, // Per sqm (Mid-range)
        availability: 8,
        maintenance_requirement: 6, // Needs polishing
        weather_resistance: { heat: 8, cold: 8, humidity: 6, uv: 8 },
        installation_complexity: 7,
        supplier_id: "SUP014",
    },
    // Concrete Blocks
    {
        id: 15,
        name: "Hollow Concrete Blocks (8-inch)",
        type: "Concrete",
        applications: ["Wall", "Boundary", "Structural"],
        strength_mpa: 15.0,
        durability_years: 60,
        thermal_conductivity: 1.1, // Better insulation than brick
        fire_resistance_hours: 4,
        water_resistance: 8,
        eco_friendly_score: 6,
        cost_per_unit: 120.0, // Per block (approx)
        availability: 9,
        maintenance_requirement: 2,
        weather_resistance: { heat: 9, cold: 8, humidity: 8, uv: 9 },
        installation_complexity: 4, // Faster than brick
        supplier_id: "SUP015",
    },
    // Gypsum
    {
        id: 16,
        name: "Gypsum False Ceiling Board",
        type: "Gypsum",
        applications: ["Ceiling", "Interior Finishing"],
        strength_mpa: 10.0,
        durability_years: 20,
        thermal_conductivity: 0.17,
        fire_resistance_hours: 2,
        water_resistance: 3,
        eco_friendly_score: 7,
        cost_per_unit: 1200.0, // Per sqm board
        availability: 9,
        maintenance_requirement: 4,
        weather_resistance: { heat: 7, cold: 9, humidity: 3, uv: 2 },
        installation_complexity: 5,
        supplier_id: "SUP016",
    },
    // Waterproofing
    {
        id: 17,
        name: "Bitumen Membrane (4mm)",
        type: "Bitumen",
        applications: ["Roofing", "Foundation"],
        strength_mpa: 5.0, // Tensile strength
        durability_years: 15,
        thermal_conductivity: 0.5,
        fire_resistance_hours: 0.5,
        water_resistance: 10,
        eco_friendly_score: 3,
        cost_per_unit: 850.0, // Per sqm
        availability: 8,
        maintenance_requirement: 3,
        weather_resistance: { heat: 4, cold: 8, humidity: 10, uv: 6 },
        installation_complexity: 6, // Needs torch application
        supplier_id: "SUP017",
    },
    // Premium Wood
    {
        id: 18,
        name: "Teak (Sagwan) Wood",
        type: "Wood",
        applications: ["Doors", "Windows", "Interior Finishing"],
        strength_mpa: 95.0,
        durability_years: 40,
        thermal_conductivity: 0.14,
        fire_resistance_hours: 0.8,
        water_resistance: 6,
        eco_friendly_score: 7,
        cost_per_unit: 450000.0, // Very expensive per m3
        availability: 5, // Imported/Premium
        maintenance_requirement: 6,
        weather_resistance: { heat: 6, cold: 6, humidity: 6, uv: 5 },
        installation_complexity: 5,
        supplier_id: "SUP018",
    }
];
