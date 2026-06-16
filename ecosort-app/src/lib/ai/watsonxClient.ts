/**
 * IBM watsonx.ai Client
 *
 * Handles IAM token authentication with automatic refresh.
 * IBM IAM tokens expire after 60 minutes — we refresh at 55 minutes
 * to provide a buffer against clock skew.
 *
 * Usage:
 *   const token = await getWatsonxToken();
 *   const response = await watsonxFetch('/ml/v1/text/generation', { ... });
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface IAMTokenResponse {
  access_token: string;
  expiration: number; // Unix timestamp (seconds)
  token_type: string;
}

interface TokenCache {
  token: string;
  expiresAt: number; // Date.now() ms timestamp
}

interface WatsonxGenerateParams {
  modelId: string;
  input: string;
  parameters?: {
    max_new_tokens?: number;
    temperature?: number;
    top_p?: number;
    stop_sequences?: string[];
  };
}

interface WatsonxGenerateResult {
  generated_text: string;
  stop_reason: string;
  input_token_count: number;
  generated_token_count: number;
}

interface WatsonxEmbedParams {
  modelId: string;
  inputs: string[];
}

interface WatsonxEmbedResult {
  results: Array<{ embedding: number[] }>;
}

// ─── Token Cache (module-level singleton) ────────────────────────────────────

let _tokenCache: TokenCache | null = null;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 min before expiry

// ─── IAM Token Authentication ─────────────────────────────────────────────────

/**
 * Fetches a fresh IBM IAM access token using the API key.
 */
async function fetchFreshToken(): Promise<TokenCache> {
  const apiKey = process.env.WATSONX_API_KEY;
  const iamUrl =
    process.env.WATSONX_IAM_URL ?? "https://iam.cloud.ibm.com/identity/token";

  if (!apiKey) {
    throw new Error(
      "WATSONX_API_KEY environment variable is not set. " +
        "Get your API key from IBM Cloud → Manage → Access (IAM) → API Keys."
    );
  }

  const response = await fetch(iamUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: apiKey,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `IBM IAM token fetch failed (${response.status}): ${body}`
    );
  }

  const data: IAMTokenResponse = await response.json();

  return {
    token: data.access_token,
    // Convert IAM expiry (seconds) to ms timestamp, minus buffer
    expiresAt: data.expiration * 1000 - TOKEN_REFRESH_BUFFER_MS,
  };
}

/**
 * Returns a valid IAM access token, refreshing if expired.
 * Token is cached in module scope for the lifetime of the server process.
 */
export async function getWatsonxToken(): Promise<string> {
  const now = Date.now();

  if (_tokenCache && _tokenCache.expiresAt > now) {
    return _tokenCache.token;
  }

  // Token is missing or expired — fetch a fresh one
  _tokenCache = await fetchFreshToken();
  return _tokenCache.token;
}

// ─── Base Fetch Wrapper ───────────────────────────────────────────────────────

/**
 * Authenticated fetch to the watsonx.ai REST API.
 * Automatically injects Bearer token and project_id.
 */
export async function watsonxFetch<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
  } = {}
): Promise<T> {
  const baseUrl =
    process.env.WATSONX_BASE_URL ?? "https://us-south.ml.cloud.ibm.com";
  const projectId = process.env.WATSONX_PROJECT_ID;

  if (!projectId) {
    throw new Error(
      "WATSONX_PROJECT_ID environment variable is not set. " +
        "Find it in watsonx.ai → Projects → [your project] → Manage → General."
    );
  }

  const token = await getWatsonxToken();

  // Append version query parameter (required by watsonx REST API)
  const url = new URL(`${baseUrl}${endpoint}`);
  url.searchParams.set("version", "2023-05-29");

  // Add timeout to prevent hanging connections (which causes 429 rate limits on free tier)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  let response;
  try {
    response = await fetch(url.toString(), {
      method: options.method ?? "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
      ...(options.body && { body: JSON.stringify(options.body) }),
    });
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`watsonx API error: Connection timed out after 8 seconds.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `watsonx API error on ${endpoint} (${response.status} ${response.statusText}): ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}

// ─── Text Generation ──────────────────────────────────────────────────────────

/**
 * Generate text using a watsonx Granite text model.
 */
export async function generateText(
  params: WatsonxGenerateParams
): Promise<WatsonxGenerateResult> {
  const projectId = process.env.WATSONX_PROJECT_ID!;
  const maxTokens = parseInt(
    process.env.WATSONX_MAX_TOKENS ?? "512",
    10
  );

  interface GenerateResponse {
    results: WatsonxGenerateResult[];
  }

  const response = await watsonxFetch<GenerateResponse>(
    "/ml/v1/text/generation",
    {
      body: {
        model_id: params.modelId,
        project_id: projectId,
        input: params.input,
        parameters: {
          max_new_tokens: maxTokens,
          temperature: 0.3,
          top_p: 0.9,
          ...params.parameters,
        },
      },
    }
  );

  const result = response.results?.[0];
  if (!result) {
    throw new Error("watsonx text generation returned no results");
  }

  return result;
}

// ─── Embeddings ───────────────────────────────────────────────────────────────

/**
 * Generate text embeddings using watsonx.
 * Returns an array of 768-dimensional float vectors.
 */
export async function generateEmbeddings(
  params: WatsonxEmbedParams
): Promise<number[][]> {
  const projectId = process.env.WATSONX_PROJECT_ID!;

  const response = await watsonxFetch<WatsonxEmbedResult>(
    "/ml/v1/text/embeddings",
    {
      body: {
        model_id: params.modelId,
        project_id: projectId,
        inputs: params.inputs,
        parameters: {
          truncate_input_tokens: 512,
        },
      },
    }
  );

  if (!response.results?.length) {
    throw new Error("watsonx embeddings returned no results");
  }

  return response.results.map((r) => r.embedding);
}
