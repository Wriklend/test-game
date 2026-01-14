import { defineConfig } from "vite";
import path from "path";
import dotenv from "dotenv";
import type { IncomingMessage, ServerResponse } from "http";
import { viteSingleFile } from "vite-plugin-singlefile";

// Load environment variables
dotenv.config();

const apiKey = process.env.CLAUDE_API_KEY;

export default defineConfig({
  root: "./",
  publicDir: "public",
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@models": path.resolve(__dirname, "./src/models"),
      "@ai": path.resolve(__dirname, "./src/ai"),
      "@ui": path.resolve(__dirname, "./src/ui"),
      "@game": path.resolve(__dirname, "./src/game"),
      "@data": path.resolve(__dirname, "./src/data"),
      "@integrations": path.resolve(__dirname, "./src/integrations"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  plugins: [
    {
      name: "claude-api-proxy",
      configureServer(server) {
        server.middlewares.use(
          "/api/claude",
          (req: IncomingMessage, res: ServerResponse) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.end("Method not allowed");
              return;
            }

            let body = "";
            req.on("data", (chunk: Buffer) => {
              body += chunk.toString();
            });

            req.on("end", async () => {
              try {
                console.log("[Proxy] Forwarding request to Claude API...");

                const response = await fetch(
                  "https://api.anthropic.com/v1/messages",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-api-key": apiKey!,
                      "anthropic-version": "2023-06-01",
                    },
                    body: body,
                  }
                );

                const data = await response.text();
                console.log("[Proxy] Response status:", response.status);

                res.statusCode = response.status;
                res.setHeader("Content-Type", "application/json");
                res.end(data);
              } catch (error) {
                console.error("[Proxy] Error:", error);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
          }
        );
      },
    },
    viteSingleFile(),
  ],
});

