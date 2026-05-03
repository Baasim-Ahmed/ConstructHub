const net = require("net");
const { spawn } = require("child_process");

const HOST = process.env.HOST || "127.0.0.1";
const DEFAULT_PORT = Number.parseInt(process.env.PORT || "3000", 10);
const MAX_PORT_ATTEMPTS = Number.parseInt(process.env.PORT_SEARCH_LIMIT || "100", 10);

function isPortAvailable(host, port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

async function findOpenPort(host, startingPort) {
  for (let offset = 0; offset < MAX_PORT_ATTEMPTS; offset += 1) {
    const port = startingPort + offset;
    const available = await isPortAvailable(host, port);

    if (available) {
      return port;
    }
  }

  throw new Error(
    `Could not find an available port between ${startingPort} and ${startingPort + MAX_PORT_ATTEMPTS - 1}.`
  );
}

function findEphemeralPort(host) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", reject);

    server.once("listening", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Could not determine an ephemeral port.")));
        return;
      }

      const { port } = address;
      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }

        resolve(port);
      });
    });

    server.listen(0, host);
  });
}

async function main() {
  const mode = process.argv[2] || "dev";
  const extraArgs = process.argv.slice(3);
  const nextBin = require.resolve("next/dist/bin/next");
  let selectedPort;
  let usedFallbackPort = false;

  try {
    selectedPort = await findOpenPort(HOST, DEFAULT_PORT);
  } catch {
    selectedPort = await findEphemeralPort(HOST);
    usedFallbackPort = true;
  }

  if (usedFallbackPort) {
    console.log(
      `Ports ${DEFAULT_PORT}-${DEFAULT_PORT + MAX_PORT_ATTEMPTS - 1} are occupied. Starting Next.js on fallback port http://${HOST}:${selectedPort}.`
    );
  } else if (selectedPort !== DEFAULT_PORT) {
    console.log(
      `Port ${DEFAULT_PORT} is occupied. Starting Next.js on http://${HOST}:${selectedPort} instead.`
    );
  } else {
    console.log(`Starting Next.js on http://${HOST}:${selectedPort}.`);
  }

  const child = spawn(
    process.execPath,
    [nextBin, mode, "--hostname", HOST, "--port", String(selectedPort), ...extraArgs],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        PORT: String(selectedPort),
      },
    }
  );

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
