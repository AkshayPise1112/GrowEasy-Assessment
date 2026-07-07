import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
});

import cors from "cors";
import express from "express";

import { importRouter } from "./routes/import.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

const allowedOrigins = new Set([
  process.env.WEB_ORIGIN ?? "http://localhost:3000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/import", importRouter);

app.use((error: Error, _req: express.Request, res: express.Response) => {
  console.error(error);
  res.status(500).json({
    message: "Something went wrong while processing the import.",
  });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
