require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const commentRoutes = require("./routes/commentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const initSockets = require("./sockets");

const app = express();
const server = http.createServer(app);

// Normalize: trim whitespace, strip stray quotes (common when pasting into
// a dashboard env var field), and drop any trailing slash so
// "https://foo.vercel.app/" and "https://foo.vercel.app" both match.
function normalizeOrigin(o) {
  return o.trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "");
}

const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173,https://project-next-lovat.vercel.app"
)
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

console.log("CORS allowed origins:", allowedOrigins);

function corsOriginCheck(origin, callback) {
  // Allow non-browser requests (curl, health checks, server-to-server) which
  // send no Origin header at all.
  if (!origin) return callback(null, true);

  const normalized = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalized)) {
    return callback(null, true);
  }

  console.warn(`CORS blocked request from origin "${origin}". Allowed: ${allowedOrigins.join(", ")}`);
  const err = new Error(`Origin "${origin}" not allowed by CORS`);
  err.status = 403;
  return callback(err);
}

app.use(cors({ origin: corsOriginCheck, credentials: true }));
app.use(express.json());

const io = new Server(server, {
  cors: { origin: corsOriginCheck, credentials: true },
});
app.set("io", io);
initSockets(io);

app.get("/", (req, res) => res.json({ status: "ok", service: "ProjectNext API" }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", commentRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`ProjectNext API + WebSocket server running on port ${PORT}`);
});