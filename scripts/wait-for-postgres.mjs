import net from "node:net";

const HOST = process.env.PGHOST ?? "localhost";
const PORT = Number(process.env.PGPORT ?? 5432);
const MAX_ATTEMPTS = 30;
const RETRY_DELAY_MS = 1000;

function tryConnect() {
  return new Promise((resolve) => {
    const socket = net.createConnection(PORT, HOST);
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  if (await tryConnect()) {
    console.log(`Postgres is ready at ${HOST}:${PORT}`);
    process.exit(0);
  }
  console.log(`Waiting for Postgres at ${HOST}:${PORT}... (${attempt}/${MAX_ATTEMPTS})`);
  await sleep(RETRY_DELAY_MS);
}

console.error(`Postgres did not become ready at ${HOST}:${PORT} in time`);
process.exit(1);
