// ===== ITEM TEMPLATES DATABASE (32 items) =====

import { ItemCategory } from '../types/enums';
import type { ItemTemplate } from '../types/interfaces';

export const ITEM_TEMPLATES: ItemTemplate[] = [
    // WEAPONS (8)
    { name: "Plasma Rifle", description: "Military-grade energy weapon", category: ItemCategory.WEAPON, basePrice: 450 },
    { name: "Neural Disruptor", description: "Non-lethal incapacitation device", category: ItemCategory.WEAPON, basePrice: 320 },
    { name: "Mono-Blade", description: "Monomolecular edge sword", category: ItemCategory.WEAPON, basePrice: 280 },
    { name: "Gravity Hammer", description: "Crushes targets with localized gravity fields", category: ItemCategory.WEAPON, basePrice: 550 },
    { name: "Arc Pistol", description: "Compact electrical discharge sidearm", category: ItemCategory.WEAPON, basePrice: 180 },
    { name: "Photon Lance", description: "Long-range beam weapon", category: ItemCategory.WEAPON, basePrice: 720 },
    { name: "Sonic Stunner", description: "Area-effect sound weapon", category: ItemCategory.WEAPON, basePrice: 240 },
    { name: "Nano-Swarm Grenade", description: "Deploys destructive nanobots", category: ItemCategory.WEAPON, basePrice: 390 },

    // TECH (10)
    { name: "Quantum Processor", description: "Advanced computing core", category: ItemCategory.TECH, basePrice: 680 },
    { name: "Holo-Projector", description: "3D holographic display system", category: ItemCategory.TECH, basePrice: 220 },
    { name: "Neural Interface", description: "Direct brain-computer connection", category: ItemCategory.TECH, basePrice: 510 },
    { name: "Fusion Cell", description: "Compact power source", category: ItemCategory.TECH, basePrice: 340 },
    { name: "Stealth Field Generator", description: "Personal cloaking device", category: ItemCategory.TECH, basePrice: 890 },
    { name: "Gravity Boots", description: "Walk on any surface", category: ItemCategory.TECH, basePrice: 420 },
    { name: "Translator Implant", description: "Universal language decoder", category: ItemCategory.TECH, basePrice: 290 },
    { name: "Repair Nanites", description: "Self-healing technology", category: ItemCategory.TECH, basePrice: 460 },
    { name: "Data Spike", description: "Hacking tool for electronic systems", category: ItemCategory.TECH, basePrice: 310 },
    { name: "Bio-Scanner", description: "Life-form detection and analysis", category: ItemCategory.TECH, basePrice: 270 },

    // ARTIFACTS (7)
    { name: "Precursor Orb", description: "Ancient alien artifact of unknown purpose", category: ItemCategory.ARTIFACT, basePrice: 950 },
    { name: "Psionic Crystal", description: "Amplifies mental abilities", category: ItemCategory.ARTIFACT, basePrice: 770 },
    { name: "Time Shard", description: "Fragment from a collapsed timeline", category: ItemCategory.ARTIFACT, basePrice: 1100 },
    { name: "Void Stone", description: "Absorbs exotic radiation", category: ItemCategory.ARTIFACT, basePrice: 640 },
    { name: "Star Chart", description: "Ancient navigation data", category: ItemCategory.ARTIFACT, basePrice: 530 },
    { name: "Memory Crystal", description: "Contains lost civilization's knowledge", category: ItemCategory.ARTIFACT, basePrice: 820 },
    { name: "Harmonic Resonator", description: "Emits reality-bending frequencies", category: ItemCategory.ARTIFACT, basePrice: 710 },

    // CONSUMABLES (7)
    { name: "Stim Pack", description: "Emergency medical injection", category: ItemCategory.CONSUMABLE, basePrice: 85 },
    { name: "Ration Bar", description: "Nutritionally complete food", category: ItemCategory.CONSUMABLE, basePrice: 25 },
    { name: "Anti-Radiation Serum", description: "Protects against ionizing radiation", category: ItemCategory.CONSUMABLE, basePrice: 140 },
    { name: "Oxygen Canister", description: "Emergency life support", category: ItemCategory.CONSUMABLE, basePrice: 60 },
    { name: "Boost Injectable", description: "Temporary physical enhancement", category: ItemCategory.CONSUMABLE, basePrice: 110 },
    { name: "Mind Shield Pill", description: "Blocks psionic intrusion", category: ItemCategory.CONSUMABLE, basePrice: 95 },
    { name: "Cryo Capsule", description: "Suspended animation pod", category: ItemCategory.CONSUMABLE, basePrice: 380 },
];
