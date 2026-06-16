import { generateText } from "../src/lib/ai/watsonxClient";
import "dotenv/config";

async function test() {
  try {
    console.log("Testing text generation...");
    const result = await generateText({
      modelId: "ibm/granite-vision-3-2-2b", // or the correct model ID
      input: "<|system|>\nYou are an assistant.\n<|user|>\nHello\n<|assistant|>",
      parameters: { max_new_tokens: 10 },
    });
    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
