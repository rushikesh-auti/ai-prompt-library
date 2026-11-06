require("dotenv").config();
const createApp = require("./app");
const { loadEnvironment } = require("./config/env");
const { connectDB, disconnectDB } = require("./config/db");

const startServer = async () => {
  const config = loadEnvironment();
  await connectDB(config.MONGO_URI);
  const app = createApp(config);
  const server = app.listen(config.PORT, () => console.log(`Server running on http://localhost:${config.PORT}`));
  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received; shutting down gracefully`);
    server.close(async () => { await disconnectDB(); process.exit(0); });
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
  return server;
};
if (require.main === module) startServer().catch((error) => { console.error(`Server startup failed: ${error.message}`); process.exit(1); });
module.exports = { startServer };
