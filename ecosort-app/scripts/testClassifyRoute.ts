import { generateText } from "../src/lib/ai/watsonxClient";
import "dotenv/config";
import fs from "fs";

async function test() {
  try {
    console.log("Testing Vision model...");
    const result = await generateText({
      modelId: "ibm/granite-vision-3-2-2b",
      input: "<|system|>\nYou are an assistant.\n<|user|>\nHello\n<|assistant|>",
      parameters: { max_new_tokens: 10 },
    });
    console.log("Result:", result);
  } catch (error) {
    console.error("Direct API Error:");
    console.error(error);
  }
}

test();

