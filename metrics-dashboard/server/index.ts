import "dotenv/config";
import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { apiRouter } from "./routes.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());
app.use("/api", apiRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const serverDir = dirname(fileURLToPath(import.meta.url));
const webDistCandidates = [
  join(serverDir, "..", "web", "dist"),
  join(serverDir, "..", "..", "web", "dist"),
];
const webDist =
  webDistCandidates.find(candidate => existsSync(join(candidate, "index.html"))) ?? webDistCandidates[0];
app.use(express.static(webDist));
app.get("*", (_req, res) => {
  res.sendFile(join(webDist, "index.html"), error => {
    if (error) {
      res.status(404).json({ error: "Not found" });
    }
  });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ error: message });
});

app.listen(port, () => {
  console.log(`Metrics dashboard API listening on http://localhost:${port}`);
});
