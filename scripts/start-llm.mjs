import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const llmDir = path.resolve(__dirname, "..", "llm-service");
const isWindows = process.platform === "win32";
const pythonPath = path.join(
  llmDir,
  ".venv",
  isWindows ? "Scripts" : "bin",
  isWindows ? "python.exe" : "python"
);

if (!existsSync(pythonPath)) {
  console.error(`Python virtualenv not found at: ${pythonPath}`);
  console.error("Set it up first:");
  console.error("  cd llm-service");
  console.error("  py -m venv .venv");
  const pip = isWindows ? ".venv\\Scripts\\pip" : ".venv/bin/pip";
  console.error(`  ${pip} install -r requirements.txt`);
  process.exit(1);
}

const child = spawn(
  pythonPath,
  ["-m", "uvicorn", "app.main:app", "--port", "8000", "--reload"],
  { cwd: llmDir, stdio: "inherit" }
);

child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (error) => {
  console.error("Failed to start llm-service:", error);
  process.exit(1);
});
