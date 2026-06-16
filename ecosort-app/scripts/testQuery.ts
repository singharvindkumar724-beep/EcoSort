import { config } from "dotenv";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const fakeEmbedding = Array(384).fill(0.1);
  const vectorStr = `[${fakeEmbedding.join(",")}]`;
  
  try {
    const rawResults = await prisma.$queryRaw`
      SELECT id, (embedding <=> CAST(${vectorStr} AS vector)) AS distance
      FROM waste_rules
      WHERE embedding IS NOT NULL
      LIMIT 1
    `;
    console.log("Success with CAST:", rawResults);
  } catch (e) {
    console.error("Failed with CAST:");
    console.error(e);
  }

  try {
    const rawResults2 = await prisma.$queryRaw`
      SELECT id, (embedding <=> ${vectorStr}::vector) AS distance
      FROM waste_rules
      WHERE embedding IS NOT NULL
      LIMIT 1
    `;
    console.log("Success with ::vector:", rawResults2);
  } catch (e) {
    console.error("Failed with ::vector:");
    console.error(e);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
