
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const http = require("http");

const ENV_PATH = path.resolve(__dirname, "../.env");
const ENV_LOCK_PATH = `${ENV_PATH}.lock`;
const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) dotenv.config({ path: ENV_PATH });

const PORT = process.env.PORT || 5000;

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

const ensureJwtSecret = async () => {
  if (process.env.JWT_SECRET?.trim()) return;

  if (isProduction) {
    throw new Error("JWT_SECRET must be configured through the production environment.");
  }

  let lockHandle;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      lockHandle = await fs.promises.open(ENV_LOCK_PATH, "wx");
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      await wait(50);
    }
  }

  if (!lockHandle) {
    throw new Error("Unable to acquire the local environment lock.");
  }

  try {
    const current = await fs.promises.readFile(ENV_PATH, "utf8").catch(() => "");
    const parsed = dotenv.parse(current);
    if (parsed.JWT_SECRET?.trim()) {
      process.env.JWT_SECRET = parsed.JWT_SECRET;
      return;
    }

    const secret = crypto.randomBytes(64).toString("base64url");
    const updated = /^(\s*JWT_SECRET\s*=).*$/m.test(current)
      ? current.replace(/^(\s*JWT_SECRET\s*=).*$/m, `$1${secret}`)
      : `${current}${current.endsWith("\n") || !current ? "" : "\n"}JWT_SECRET=${secret}\n`;
    await fs.promises.writeFile(ENV_PATH, updated, { mode: 0o600 });
    try { await fs.promises.chmod(ENV_PATH, 0o600); } catch {}
    process.env.JWT_SECRET = secret;
  } finally {
    await lockHandle.close();
    await fs.promises.unlink(ENV_LOCK_PATH).catch(() => {});
  }
};

const startServer = async () => {
  try {
    await ensureJwtSecret();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  const app = require("./app");
  const connectDB = require("./config/db");
  const { createRealtime } = require("./realtime");
  await connectDB();

  const httpServer = http.createServer(app);
  const configuredOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
  const allowedOrigins = [...new Set([
    ...configuredOrigins,
    ...configuredOrigins
      .filter(origin => origin === "http://localhost:5173")
      .map(() => "http://127.0.0.1:5173"),
  ])];
  app.locals.io = createRealtime(
    httpServer,
    allowedOrigins,
    "pantrypal_token"
  );

  httpServer.listen(PORT, () => {
    console.log(`PantryPal API running on port ${PORT}`);
  });
};

startServer();
