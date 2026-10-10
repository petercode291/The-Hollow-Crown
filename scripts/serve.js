import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(process.argv[2] || ".");
const port = Number(process.argv[3] || 5173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};
http
  .createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const safePath = path.resolve(root, "." + urlPath);
      if (safePath !== root && !safePath.startsWith(root + path.sep))
        throw new Error("Invalid path");
      let file = safePath;
      try {
        if ((await stat(file)).isDirectory())
          file = path.join(file, "index.html");
      } catch {}
      const data = await readFile(file);
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(data);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
  })
  .listen(port, "0.0.0.0", () =>
    console.log(`The Hollow Crown: http://localhost:${port}`),
  );
