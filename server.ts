import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import net from "net";
import dns from "dns";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Port Scanner
  app.post("/api/scan/ports", async (req, res) => {
    const { host, ports } = req.body;
    if (!host || !ports || !Array.isArray(ports)) {
      return res.status(400).json({ error: "Invalid host or ports" });
    }

    const results = [];
    const chunkSize = 25; // Smaller chunks for better reliability
    
    for (let i = 0; i < ports.length; i += chunkSize) {
      const chunk = ports.slice(i, i + chunkSize);
      const scanPromises = chunk.map((port) => {
        return new Promise((resolve) => {
          const socket = new net.Socket();
          const start = Date.now();
          socket.setTimeout(2000); // 2s timeout

          socket.on("connect", () => {
            const duration = Date.now() - start;
            socket.destroy();
            resolve({ port, status: "OPEN", statusText: "Connected", duration, message: "Connection established" });
          });

          socket.on("timeout", () => {
            socket.destroy();
            resolve({ port, status: "TIMEOUT", statusText: "Connection timed out", message: "Timeout" });
          });

          socket.on("error", (err: any) => {
            socket.destroy();
            resolve({ port, status: err.code || "CLOSED", statusText: err.message, message: err.message });
          });

          socket.connect(port, host);
        });
      });
      results.push(...(await Promise.all(scanPromises)));
    }

    res.json({ results });
  });

  // Subdomain Enumeration
  app.post("/api/scan/subdomains", async (req, res) => {
    const { domain, subdomains } = req.body;
    if (!domain || !subdomains || !Array.isArray(subdomains)) {
      return res.status(400).json({ error: "Invalid domain or subdomains" });
    }

    const results = [];
    const chunkSize = 15;
    for (let i = 0; i < subdomains.length; i += chunkSize) {
      const chunk = subdomains.slice(i, i + chunkSize);
      const dnsPromises = chunk.map((sub) => {
        const fullDomain = `${sub}.${domain}`;
        return new Promise((resolve) => {
          const start = Date.now();
          dns.lookup(fullDomain, (err: any, address, family) => {
            const duration = Date.now() - start;
            if (err) {
              resolve({ subdomain: fullDomain, status: err.code || "NOT_FOUND", statusText: err.message, message: err.code });
            } else {
              resolve({ subdomain: fullDomain, status: "FOUND", statusText: "Resolved", address, family, duration });
            }
          });
        });
      });
      results.push(...(await Promise.all(dnsPromises)));
    }

    res.json({ results });
  });

  // Path Traversal / Directory Bruteforce
  app.post("/api/scan/paths", async (req, res) => {
    const { url, paths } = req.body;
    if (!url || !paths || !Array.isArray(paths)) {
      return res.status(400).json({ error: "Invalid url or paths" });
    }

    const results = [];
    const chunkSize = 10;
    for (let i = 0; i < paths.length; i += chunkSize) {
      const chunk = paths.slice(i, i + chunkSize);
      const fetchPromises = chunk.map(async (p) => {
        const target = url.endsWith('/') ? `${url}${p}` : `${url}/${p}`;
        const start = Date.now();
        try {
          const response = await axios.get(target, { 
            timeout: 5000, 
            validateStatus: () => true,
            maxRedirects: 5,
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': '*/*'
            }
          });
          const duration = Date.now() - start;
          const isOk = response.status >= 200 && response.status < 300;
          return { 
            path: p, 
            status: response.status, 
            statusText: response.statusText,
            connection: isOk ? "OK" : "Failed",
            length: response.headers['content-length'],
            type: response.headers['content-type'],
            duration 
          };
        } catch (err: any) {
          const status = err.response?.status || err.code || "ERROR";
          const statusText = err.response?.statusText || err.message;
          return { 
            path: p, 
            status: status, 
            statusText: statusText,
            connection: "Failed", 
            message: err.message 
          };
        }
      });
      results.push(...(await Promise.all(fetchPromises)));
    }

    res.json({ results });
  });

  // --- Vite Integration ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
