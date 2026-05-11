const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "build");
const port = Number(process.env.PORT || 3000);
const basePath = "/safety-detection/app";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname === "/") {
      res.writeHead(302, { Location: `${basePath}/` });
      res.end();
      return;
    }

    const relativePath = url.pathname.startsWith(basePath)
      ? url.pathname.slice(basePath.length) || "/"
      : url.pathname;
    const requested = path.normalize(path.join(root, decodeURIComponent(relativePath)));
    const safePath = requested.startsWith(root) ? requested : root;
    const filePath =
      fs.existsSync(safePath) && fs.statSync(safePath).isFile()
        ? safePath
        : path.join(root, "index.html");

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(String(error));
        return;
      }

      res.writeHead(200, {
        "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      });
      res.end(data);
    });
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`Frontend is running at http://127.0.0.1:${port}${basePath}/`);
  });
