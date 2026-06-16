import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const apiKey = process.env.WATSONX_API_KEY!;
  const iamUrl = process.env.WATSONX_IAM_URL!;
  const baseUrl = process.env.WATSONX_BASE_URL!;

  console.log("Getting IAM token...");
  const authRes = await fetch(iamUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
  });
  const authData = await authRes.json();
  const token = authData.access_token;

  console.log("Getting models...");
  const url = `${baseUrl}/ml/v1/foundation_model_specs?version=2023-05-29`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  
  if (data.resources) {
    const graniteModels = data.resources
      .map((r: any) => r.model_id)
      .filter((id: string) => id.includes("vision") || id.includes("llama") || id.includes("pixtral"));
    console.log("Granite Models:", graniteModels);
  } else {
    console.log("Error:", data);
  }
}

main().catch(console.error);
