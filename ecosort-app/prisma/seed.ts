/**
 * EcoSort - Prisma Seed Script
 * Populates the database with:
 * 1. Varanasi locality (MVP pilot city)
 * 2. 40 common household waste rules per Varanasi/UP municipal guidelines
 *
 * Run with: npx prisma db seed
 * (Configured in package.json prisma.seed field)
 *
 * NOTE: Embeddings are seeded as null here.
 * Run `npm run embed:rules` separately to generate & store vectors.
 */

import { config } from "dotenv";
import path from "node:path";
import { PrismaClient, WasteCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Load env vars (Prisma 7 doesn't auto-load .env files)
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const pool = new Pool({
  connectionString:
    process.env.DIRECT_URL ??
    (process.env.DATABASE_URL ?? "").replace(/[?&]pgbouncer=true/g, ""),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Varanasi Waste Rules (per UP Municipal Guidelines) ───────────────────────
// Reference: Varanasi Nagar Nigam Solid Waste Management Guidelines, 2023
// Categories: WET_ORGANIC (green bin), DRY_RECYCLABLE (blue bin),
//             HAZARDOUS (red/orange bin), SANITARY (black bag)

const VARANASI_RULES: Array<{
  itemName: string;
  aliases: string[];
  category: WasteCategory;
  disposalInstructions: string;
  tips?: string;
  isRecyclable: boolean;
  source: string;
}> = [
  // ── WET / ORGANIC ──────────────────────────────────────────────────────────
  {
    itemName: "Vegetable and Fruit Peels",
    aliases: ["sabzi ke chhilke", "fruit skin", "vegetable scraps", "kitchen waste"],
    category: WasteCategory.WET_ORGANIC,
    disposalInstructions:
      "Place in the GREEN bin (wet waste). Varanasi Nagar Nigam collects green-bin wet waste daily. Can be composted at home using a compost pit or aerobic bin.",
    tips: "Do not mix with dry waste. Moist food waste contaminates recyclables.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Cooked Food Leftovers",
    aliases: ["bache hua khana", "leftover food", "stale food", "food scraps"],
    category: WasteCategory.WET_ORGANIC,
    disposalInstructions:
      "Place in the GREEN bin (wet waste). Avoid plastic bags — use a compostable or newspaper-lined container. Collected daily in Varanasi municipal zones.",
    tips: "Consider donating excess food to food banks or community kitchens before disposal.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Tea Leaves and Coffee Grounds",
    aliases: ["chai ki patti", "used tea bags", "coffee grounds", "tea waste"],
    category: WasteCategory.WET_ORGANIC,
    disposalInstructions:
      "Place in the GREEN bin (wet waste). Rich in nitrogen — excellent for home composting.",
    tips: "Remove staples from tea bags before disposing.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Garden Waste and Dry Leaves",
    aliases: ["garden waste", "sukhe patte", "dry leaves", "plant trimmings", "flower waste"],
    category: WasteCategory.WET_ORGANIC,
    disposalInstructions:
      "Place in the GREEN bin or a separate garden waste bag. Varanasi Nagar Nigam has specific garden waste collection in residential colonies.",
    tips: "Dry leaves can be composted or used as mulch in gardens.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Egg Shells",
    aliases: ["ande ke chhilke", "eggshells", "egg shells"],
    category: WasteCategory.WET_ORGANIC,
    disposalInstructions:
      "Place in the GREEN bin (wet waste). Excellent calcium source for composting.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Floral Waste and Pooja Flowers",
    aliases: ["phool", "pooja waste", "temple flowers", "floral offerings", "marigold"],
    category: WasteCategory.WET_ORGANIC,
    disposalInstructions:
      "Place in the GREEN bin. Do NOT immerse in the Ganga river. Varanasi Nagar Nigam has dedicated collection points near major ghats and temples.",
    tips: "Use designated 'Phool Waala' collection bins near Dashashwamedh and Assi ghats.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam / Clean Ganga Mission Guidelines",
  },

  // ── DRY RECYCLABLE ─────────────────────────────────────────────────────────
  {
    itemName: "PET Plastic Water Bottle",
    aliases: ["plastic bottle", "mineral water bottle", "bisleri bottle", "pet bottle", "drinking water bottle"],
    category: WasteCategory.DRY_RECYCLABLE,
    disposalInstructions:
      "Place in the BLUE bin (dry recyclable waste). Rinse and crush before disposal. Accepted by Varanasi Nagar Nigam's dry waste collection and local kabadiwallas.",
    tips: "Remove the cap (it's a different type of plastic). Both cap and bottle can be recycled separately.",
    isRecyclable: true,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Cardboard Box",
    aliases: ["cardboard", "corrugated box", "Amazon box", "courier box", "carton"],
    category: WasteCategory.DRY_RECYCLABLE,
    disposalInstructions:
      "Flatten and place in the BLUE bin (dry recyclable waste). Remove all plastic tape, bubble wrap, and styrofoam packing material first.",
    tips: "Kabadiwallas in Varanasi pay a good rate for cardboard (₹4–6/kg).",
    isRecyclable: true,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Newspaper and Office Paper",
    aliases: ["akhbar", "newspaper", "office paper", "paper", "waste paper", "raddi"],
    category: WasteCategory.DRY_RECYCLABLE,
    disposalInstructions:
      "Place in the BLUE bin (dry recyclable waste). Keep dry — wet newspaper cannot be recycled.",
    tips: "Bundling raddi (waste paper) and selling to local kabadiwallas is an eco-friendly and income-generating option.",
    isRecyclable: true,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Glass Bottle or Jar",
    aliases: ["glass bottle", "kach ki botal", "jam jar", "pickle jar", "glass container"],
    category: WasteCategory.DRY_RECYCLABLE,
    disposalInstructions:
      "Rinse and place in the BLUE bin (dry recyclable waste). Glass is 100% recyclable infinitely without quality loss.",
    tips: "Handle with care to avoid breakage. Wrap broken glass in newspaper before disposal to prevent injuries.",
    isRecyclable: true,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Aluminium Beverage Can",
    aliases: ["cola can", "beer can", "soft drink can", "aluminium can", "tin can", "pepsi can", "coke can"],
    category: WasteCategory.DRY_RECYCLABLE,
    disposalInstructions:
      "Rinse and crush, then place in the BLUE bin (dry recyclable waste). Aluminium is highly valuable — most kabadiwallas accept it at ₹60–80/kg.",
    tips: "Do not mix with food waste. Clean cans fetch higher scrap prices.",
    isRecyclable: true,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Steel or Iron Scrap",
    aliases: ["steel", "iron", "loha", "metal scrap", "tin lid", "steel container"],
    category: WasteCategory.DRY_RECYCLABLE,
    disposalInstructions:
      "Place in the BLUE bin (dry recyclable waste) or sell directly to a local kabadiwalla or scrap dealer.",
    isRecyclable: true,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "HDPE Plastic Container",
    aliases: ["shampoo bottle", "detergent bottle", "milk can", "HDPE", "oil container", "cleaning product bottle"],
    category: WasteCategory.DRY_RECYCLABLE,
    disposalInstructions:
      "Rinse thoroughly and place in the BLUE bin (dry recyclable waste). HDPE (#2 plastic) is widely recyclable in Varanasi.",
    tips: "Check for the recycling symbol #2 on the bottom.",
    isRecyclable: true,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Tetra Pak / Juice Carton",
    aliases: ["juice box", "milk carton", "tetra pack", "tetra pak", "paper carton", "amul carton"],
    category: WasteCategory.DRY_RECYCLABLE,
    disposalInstructions:
      "Rinse and place in the BLUE bin (dry recyclable waste). Tetra Paks are multi-layer (paper, plastic, aluminium) but ARE recyclable at specialized facilities.",
    tips: "Flatten the carton to save space. Some Varanasi collection points have separate Tetra Pak bins.",
    isRecyclable: true,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Plastic Carry Bag (Thin < 75 micron)",
    aliases: ["polythene bag", "plastic bag", "carry bag", "polybag", "shopping bag"],
    category: WasteCategory.INERT,
    disposalInstructions:
      "Thin plastic bags (< 75 microns) are BANNED in Uttar Pradesh under the Single-Use Plastic Ban 2022. Do NOT place in either bin. Return to retailer if possible, or place in general waste. Avoid using them.",
    tips: "Switch to cloth bags (jhola) or thick reusable bags. Thicker bags (> 75 microns) CAN go in the blue bin.",
    isRecyclable: false,
    source: "UP Single-Use Plastic Ban Notification 2022",
  },
  {
    itemName: "Thick Reusable Plastic Bag (>75 micron)",
    aliases: ["reusable plastic bag", "thick carry bag", "grocery bag"],
    category: WasteCategory.DRY_RECYCLABLE,
    disposalInstructions:
      "Place in the BLUE bin when no longer usable. Thicker plastics (> 75 microns) are accepted by Varanasi municipal recyclers.",
    isRecyclable: true,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },

  // ── HAZARDOUS ──────────────────────────────────────────────────────────────
  {
    itemName: "AA / AAA Battery",
    aliases: ["battery", "cell", "alkaline battery", "duracell", "energizer", "remote battery"],
    category: WasteCategory.HAZARDOUS,
    disposalInstructions:
      "Do NOT place in any regular bin. Batteries contain toxic heavy metals (mercury, cadmium, lead). Drop off at designated e-waste collection points in Varanasi (contact Varanasi Nagar Nigam for nearest point).",
    tips: "Switch to rechargeable batteries to reduce hazardous waste significantly.",
    isRecyclable: false,
    source: "CPCB E-Waste Management Rules 2022",
  },
  {
    itemName: "Mobile Phone / Smartphone",
    aliases: ["mobile", "phone", "smartphone", "old phone", "broken phone", "cell phone"],
    category: WasteCategory.HAZARDOUS,
    disposalInstructions:
      "Do NOT place in any regular bin. This is e-waste. Wipe your personal data first. Drop off at manufacturer take-back programs (Samsung, Apple, Jio stores often have collection points) or Varanasi Nagar Nigam e-waste drives.",
    tips: "Many brands offer trade-in programs or certified recyclers. Never burn or crush electronics.",
    isRecyclable: false,
    source: "CPCB E-Waste Management Rules 2022",
  },
  {
    itemName: "CFL / Fluorescent Light Bulb",
    aliases: ["tubelight", "CFL bulb", "fluorescent lamp", "mercury lamp", "energy saver bulb"],
    category: WasteCategory.HAZARDOUS,
    disposalInstructions:
      "Do NOT crush or place in regular bins. CFLs contain mercury. Wrap carefully in newspaper and drop at designated hazardous waste collection points. Ask Varanasi Nagar Nigam for the nearest facility.",
    tips: "LED bulbs are a safer and more energy-efficient alternative with no mercury.",
    isRecyclable: false,
    source: "CPCB Hazardous Waste Management Rules",
  },
  {
    itemName: "Paint Can (used or empty)",
    aliases: ["paint", "wall paint", "enamel paint", "paint container", "paint tin"],
    category: WasteCategory.HAZARDOUS,
    disposalInstructions:
      "Do NOT pour paint down the drain or in regular bins. Let leftover paint dry completely (add sawdust to speed up). Empty, dry cans can go in the BLUE bin (metal). Contact Varanasi Nagar Nigam for disposal of large quantities.",
    tips: "Donate unused paint to NGOs or community projects.",
    isRecyclable: false,
    source: "CPCB Hazardous Waste Management Rules",
  },
  {
    itemName: "Pesticide or Chemical Container",
    aliases: ["pesticide bottle", "insecticide", "fertilizer bag", "chemical container", "keetnashak"],
    category: WasteCategory.HAZARDOUS,
    disposalInstructions:
      "NEVER place in regular bins. Empty chemical containers still contain toxic residue. Return to the retailer/distributor or contact Varanasi Nagar Nigam's special collection drive for hazardous waste.",
    tips: "Triple-rinse containers before handling. Wear gloves.",
    isRecyclable: false,
    source: "CPCB Hazardous Waste Management Rules",
  },
  {
    itemName: "Expired Medicine / Pills",
    aliases: ["expired medicine", "old pills", "medicine", "tablet", "capsule", "dawa"],
    category: WasteCategory.HAZARDOUS,
    disposalInstructions:
      "Do NOT flush medicines down the toilet or drain. Many pharmacies in Varanasi participate in take-back programs. Otherwise, mix with an undesirable substance (coffee grounds) and seal in a bag before placing in general waste.",
    tips: "Never share or self-prescribe old medicines. Check your pharmacy for take-back programs.",
    isRecyclable: false,
    source: "Central Drugs Standard Control Organization Guidelines",
  },
  {
    itemName: "Laptop or Computer",
    aliases: ["laptop", "computer", "PC", "desktop", "monitor", "printer", "e-waste"],
    category: WasteCategory.HAZARDOUS,
    disposalInstructions:
      "This is e-waste. Do NOT dispose in regular bins. Wipe all personal data. Contact manufacturer's take-back program or Varanasi Nagar Nigam for scheduled e-waste collection events.",
    isRecyclable: false,
    source: "CPCB E-Waste Management Rules 2022",
  },

  // ── SANITARY ───────────────────────────────────────────────────────────────
  {
    itemName: "Sanitary Napkin / Pad",
    aliases: ["sanitary pad", "napkin", "menstrual pad", "whisper", "stayfree", "period pad"],
    category: WasteCategory.SANITARY,
    disposalInstructions:
      "Wrap in newspaper or the original wrapper and place in a BLACK bag for sanitary waste. In Varanasi, this goes in the general/sanitary waste bin (NOT the green or blue bin). Varanasi Nagar Nigam has door-to-door collection.",
    tips: "Consider reusable menstrual cups or cloth pads to reduce sanitary waste.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Disposable Diaper",
    aliases: ["diaper", "nappy", "pampers", "huggies", "baby diaper"],
    category: WasteCategory.SANITARY,
    disposalInstructions:
      "Wrap used diapers and place in a sealed BLACK bag for sanitary waste. Do NOT place in the green or blue bin — they cannot be composted or recycled.",
    tips: "Consider cloth diapers to significantly reduce plastic waste.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Used Tissue Paper / Napkin",
    aliases: ["tissue", "napkin", "paper napkin", "tissue paper", "kleenex"],
    category: WasteCategory.SANITARY,
    disposalInstructions:
      "Place in the general/sanitary waste bin (NOT the blue recyclable bin). Used tissues are contaminated and cannot be recycled.",
    tips: "Switch to reusable cloth handkerchiefs to reduce waste.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },

  // ── INERT / NON-RECYCLABLE ─────────────────────────────────────────────────
  {
    itemName: "Styrofoam / Thermocol",
    aliases: ["thermocol", "styrofoam", "foam packaging", "EPS foam", "expanded polystyrene"],
    category: WasteCategory.INERT,
    disposalInstructions:
      "Place in the general/inert waste bin. Thermocol is NOT recyclable at Varanasi's current municipal facilities. It is also banned in some formats under UP's plastic ban.",
    tips: "Reuse thermocol for craft projects or insulation. Avoid purchasing products packaged in thermocol.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Broken Ceramic / Pottery",
    aliases: ["broken plate", "ceramic", "pottery", "crockery", "china", "broken cup", "matka"],
    category: WasteCategory.INERT,
    disposalInstructions:
      "Wrap carefully in thick newspaper or cloth before disposal. Place in the general waste bin. Cannot be recycled via standard municipal streams.",
    tips: "Small amounts of broken terracotta can be used as drainage material in plant pots.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Single-Use Plastic Straw",
    aliases: ["straw", "plastic straw", "drinking straw"],
    category: WasteCategory.INERT,
    disposalInstructions:
      "Single-use plastic straws are BANNED in India (Single-Use Plastic Ban 2022). Place in general waste if you still have some. Do NOT buy or use going forward.",
    tips: "Switch to bamboo, steel, paper, or glass straws.",
    isRecyclable: false,
    source: "MoEFCC Single-Use Plastic Ban 2022",
  },
  {
    itemName: "Multi-Layer Plastic Packaging (Chips/Snack Wrappers)",
    aliases: ["chips packet", "snack wrapper", "biscuit wrapper", "lays packet", "kurkure packet", "MLP"],
    category: WasteCategory.INERT,
    disposalInstructions:
      "Multi-Layer Plastic (MLP) packaging cannot be recycled via standard Varanasi municipal streams. Place in the general waste bin.",
    tips: "Some brands have take-back programs. Check Teracycle India for MLP collection drives in Varanasi.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Bubble Wrap",
    aliases: ["bubble wrap", "air bubble wrap", "packaging wrap"],
    category: WasteCategory.INERT,
    disposalInstructions:
      "Bubble wrap (LDPE plastic #4) is difficult to recycle in standard municipal bins. Reuse if possible. If disposing, place in general waste.",
    tips: "Reuse multiple times before discarding. Some courier/logistics companies accept returned bubble wrap.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },

  // ── ADDITIONAL COMMON ITEMS ────────────────────────────────────────────────
  {
    itemName: "Plastic PVC Pipe or Fitting",
    aliases: ["PVC pipe", "plastic pipe", "plumbing scrap", "PVC fitting"],
    category: WasteCategory.DRY_RECYCLABLE,
    disposalInstructions:
      "PVC is recyclable. Place in the BLUE bin or sell to a scrap dealer in Varanasi.",
    tips: "PVC recycling is available at specialized recyclers. Kabadiwallas usually accept it.",
    isRecyclable: true,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Cloth / Old Clothing / Fabric",
    aliases: ["old clothes", "kapde", "fabric scrap", "clothing", "rags", "torn clothes"],
    category: WasteCategory.DRY_RECYCLABLE,
    disposalInstructions:
      "Donate wearable clothing to NGOs, Goonj, or local donation drives. Non-wearable fabric can be placed in the BLUE bin (recycled into industrial rags or insulation).",
    tips: "Use the 'Goonj' app or local donation drives before treating clothes as waste.",
    isRecyclable: true,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Electronic Component / Circuit Board",
    aliases: ["circuit board", "PCB", "electronic scrap", "motherboard", "chip"],
    category: WasteCategory.HAZARDOUS,
    disposalInstructions:
      "This is e-waste containing toxic materials (lead, arsenic, cadmium). Do NOT bin. Drop at designated e-waste collection points. Contact Varanasi Nagar Nigam for schedule.",
    isRecyclable: false,
    source: "CPCB E-Waste Management Rules 2022",
  },
  {
    itemName: "Cooking Oil (used)",
    aliases: ["used oil", "cooking oil", "tel", "waste oil", "frying oil"],
    category: WasteCategory.WET_ORGANIC,
    disposalInstructions:
      "NEVER pour cooking oil down the drain — it causes blockages and water pollution. Let it cool, pour into a sealed container, and place in the GREEN bin. Large quantities can be sold to biodiesel collectors.",
    tips: "In Varanasi, some organizations collect used cooking oil for biodiesel production.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "Coconut Shell and Husk",
    aliases: ["nariyal", "coconut shell", "coconut husk", "coconut waste"],
    category: WasteCategory.WET_ORGANIC,
    disposalInstructions:
      "Place in the GREEN bin (wet organic waste). Coconut shells are excellent for composting and are also used as fuel in some local industries.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam SWM Guidelines 2023",
  },
  {
    itemName: "LED Light Bulb",
    aliases: ["LED bulb", "LED light", "energy bulb"],
    category: WasteCategory.HAZARDOUS,
    disposalInstructions:
      "LED bulbs contain small amounts of circuit components and should be treated as e-waste. Do not place in regular bins. Return to retailer or drop at e-waste collection points.",
    tips: "LEDs last 25x longer than incandescent bulbs — buy quality LEDs to reduce disposal frequency.",
    isRecyclable: false,
    source: "CPCB E-Waste Management Rules 2022",
  },
  
  // ── E_WASTE ────────────────────────────────────────────────────────────────
  {
    itemName: "Electronic Appliance",
    aliases: ["tv", "computer", "laptop", "toaster", "microwave", "appliance", "electronic", "e-waste", "e waste"],
    category: WasteCategory.E_WASTE,
    disposalInstructions:
      "Do NOT place in regular bins. Drop off at designated e-waste collection points in Varanasi or contact the municipality for special pickup.",
    tips: "Wipe personal data from computers/phones before disposal.",
    isRecyclable: true,
    source: "CPCB E-Waste Management Rules 2022",
  },

  // ── BIOMEDICAL ────────────────────────────────────────────────────────────
  {
    itemName: "Medical Waste",
    aliases: ["syringe", "medicines", "bandages", "blood", "medical", "clinical", "biomedical"],
    category: WasteCategory.BIOMEDICAL,
    disposalInstructions:
      "Wrap securely in a yellow or red bag depending on the type of waste. Hand over directly to sanitation workers; do NOT mix with general waste.",
    tips: "Expired medicines should be kept separate from sharp items like syringes.",
    isRecyclable: false,
    source: "Biomedical Waste Management Rules 2016",
  },

  // ── BULKY ─────────────────────────────────────────────────────────────────
  {
    itemName: "Bulky Furniture",
    aliases: ["sofa", "mattress", "chair", "table", "bulky", "furniture"],
    category: WasteCategory.BULKY,
    disposalInstructions:
      "Too large for regular bins. Schedule a special bulky waste pickup with Varanasi Nagar Nigam or donate if still usable.",
    tips: "Broken wooden furniture can sometimes be repurposed by local carpenters.",
    isRecyclable: false,
    source: "Varanasi Nagar Nigam SWM Guidelines",
  },

  // ── TEXTILE ───────────────────────────────────────────────────────────────
  {
    itemName: "Old Clothes / Shoes",
    aliases: ["shirt", "pants", "shoes", "cloth", "textile", "fabric", "rags"],
    category: WasteCategory.TEXTILE,
    disposalInstructions:
      "Donate to local NGOs or Goonj collection centers if in good condition. Torn or soiled clothes should go in dry waste (BLUE bin) for textile recycling.",
    tips: "Wash clothes before donating.",
    isRecyclable: true,
    source: "General Waste Management Best Practices",
  },

  // ── METAL_SCRAP ───────────────────────────────────────────────────────────
  {
    itemName: "Metal Tools and Scrap",
    aliases: ["wrench", "hammer", "nails", "scrap metal", "iron", "steel piece", "hardware"],
    category: WasteCategory.METAL_SCRAP,
    disposalInstructions:
      "Keep separate from regular dry waste and sell directly to a local kabadiwalla (scrap dealer) for recycling.",
    tips: "Store sharp metal items safely to prevent injury.",
    isRecyclable: true,
    source: "Varanasi Nagar Nigam SWM Guidelines",
  },
];

async function main() {
  console.log("🌱 Starting EcoSort seed...");

  // 1. Upsert Varanasi locality
  const varanasi = await prisma.locality.upsert({
    where: { name: "Varanasi" },
    update: {},
    create: {
      name: "Varanasi",
      state: "Uttar Pradesh",
      country: "India",
      timezone: "Asia/Kolkata",
    },
  });
  console.log(`✅ Locality: ${varanasi.name} (${varanasi.id})`);

  // 2. Seed waste rules (upsert by itemName + localityId)
  let created = 0;
  let updated = 0;

  for (const rule of VARANASI_RULES) {
    const existing = await prisma.wasteRule.findFirst({
      where: { itemName: rule.itemName, localityId: varanasi.id },
    });

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ...updateData } = rule; // embedding is null by default, don't update
      await prisma.wasteRule.update({
        where: { id: existing.id },
        data: {
          itemName: updateData.itemName,
          aliases: updateData.aliases,
          category: updateData.category,
          disposalInstructions: updateData.disposalInstructions,
          tips: updateData.tips,
          isRecyclable: updateData.isRecyclable,
          source: updateData.source,
          // NOTE: embedding is intentionally NOT updated here
          // Run `npm run embed:rules` to generate/update embeddings
        },
      });
      updated++;
    } else {
      await prisma.wasteRule.create({
        data: {
          ...rule,
          localityId: varanasi.id,
          // embedding is null — set later via embed:rules script
        },
      });
      created++;
    }
  }

  console.log(`✅ Waste Rules: ${created} created, ${updated} updated`);
  console.log(
    "⚠️  Embeddings not set. Run `npm run embed:rules` to generate pgvector embeddings."
  );
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
