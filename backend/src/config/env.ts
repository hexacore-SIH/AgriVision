import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: required("DATABASE_URL"),
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  internalApiKey: required("INTERNAL_API_KEY"),
  llmServiceUrl: process.env.LLM_SERVICE_URL
    ? (process.env.LLM_SERVICE_URL.startsWith("http")
        ? process.env.LLM_SERVICE_URL
        : `http://${process.env.LLM_SERVICE_URL}`)
    : "http://localhost:8000",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  sarvamApiKey: process.env.SARVAM_API_KEY || "sk_f50n2e85_nG2TlezM48G9frrxddeEOlNO",
};

export const isProduction = env.nodeEnv === "production";
