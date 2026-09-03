//Md Saif Ali
//
// Md Saif AliPERMANENT
require("dotenv").config();
const express = require("express");
const aiProvider = require("./services/aiProviderService.cjs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
// Mongoose connection for models
const mongooseService = require("./services/mongoose.cjs");
const { getAllowedOrigins, validateEnv } = require("./config/env.cjs");
const { getFeatureCapabilities } = require("./config/capabilities.cjs");
const createRateLimiter = require("./middleware/rateLimit.cjs");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const envStatus = validateEnv({ strict: process.env.STRICT_ENV_VALIDATION === "true" });

function mountUnavailableFeature(basePath, capability) {
  app.use(basePath, (req, res) => {
    res.status(503).json({
      success: false,
      error: `${capability.label} is not configured`,
      message: capability.reason,
      feature: capability,
    });
  });
}

function mountOptionalFeature({ basePath, featureKey, label, loadRoutes }) {
  const capability = getFeatureCapabilities().features[featureKey];

  if (!capability?.available) {
    mountUnavailableFeature(basePath, capability || {
      key: featureKey,
      label,
      available: false,
      status: "coming-soon",
      reason: `${label} is not configured.`,
    });
    console.log(`Optional feature disabled at ${basePath}: ${label}`);
    return;
  }

  try {
    const routes = loadRoutes();
    if (routes && typeof routes === "function") {
      app.use(basePath, routes);
      console.log(`${label} routes mounted at ${basePath}`);
    } else {
      console.warn(`${label} routes loaded but not a valid router`);
      mountUnavailableFeature(basePath, {
        ...capability,
        available: false,
        status: "coming-soon",
        reason: `${label} route module is not ready.`,
      });
    }
  } catch (e) {
    console.warn(`${label} routes not available:`, e.message);
    mountUnavailableFeature(basePath, {
      ...capability,
      available: false,
      status: "coming-soon",
      reason: e.message,
    });
  }
}

// CORS Configuration
const allowedOrigins = getAllowedOrigins();
console.log("CORS origins configured:", allowedOrigins);

// Socket.IO Configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
});

// Socket.IO Connection Handler
io.on("connection", (socket) => {
  console.log("?? Client connected:", socket.id);

  // Admin joins interview room to receive updates
  socket.on("admin:join-interview", (interviewId) => {
    socket.join(`interview:${interviewId}`);
    console.log(`????? Admin joined interview room: ${interviewId}`);
  });

  // Admin leaves interview room
  socket.on("admin:leave-interview", (interviewId) => {
    socket.leave(`interview:${interviewId}`);
    console.log(`????? Admin left interview room: ${interviewId}`);
  });

  socket.on("disconnect", () => {
    console.log("?? Client disconnected:", socket.id);
  });
});

// Expose io to routes via app.locals
app.locals.io = io;

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    console.log("?? CORS request from origin:", origin);

    if (allowedOrigins.includes(origin)) {
      console.log("? CORS: Origin allowed");
      callback(null, true);
    } else {
      console.log("? CORS: Origin blocked");
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-admin-secret",
    "x-admin-token",
  ],
  exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use("/api", createRateLimiter({ windowMs: 60 * 1000, max: Number(process.env.API_RATE_LIMIT_PER_MINUTE || 180) }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint for Render
app.get("/api/health", (req, res) => {
  const aiConfig = aiProvider.getConfig();
  const capabilities = getFeatureCapabilities();
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "neuroprepai Backend",
    version: "1.0.0",
    ai: {
      primaryProvider: aiConfig.primaryProvider,
      providerSequence: aiConfig.providerSequence,
      geminiConfigured: aiProvider.isProviderConfigured("gemini"),
      groqConfigured: aiProvider.isProviderConfigured("groq"),
    },
    corsOrigins: allowedOrigins,
    env: {
      ok: envStatus.ok,
      missing: envStatus.missing,
    },
    capabilities: capabilities.features,
    nodeEnv: process.env.NODE_ENV,
  });
});

app.get("/api/capabilities", (req, res) => {
  res.json(getFeatureCapabilities());
});

// Debug endpoint for CORS configuration
app.get("/api/debug/cors", (req, res) => {
  res.json({
    allowedOrigins,
    requestOrigin: req.get("Origin"),
    corsOriginEnv: process.env.CORS_ORIGIN,
    nodeEnv: process.env.NODE_ENV,
  });
});

app.get("/", (req, res) => {
  res.send("Server is running on Render!");
});

// Mount admin routes (login/logout)
try {
  const adminRoutes = require("./routes/admin.cjs");
  app.use("/api/admin", adminRoutes);
} catch (e) {
  console.warn("Admin routes not available:", e.message);
}

// Mount scheduled interview routes (admin)
try {
  const scheduledInterviewRoutes = require("./routes/scheduledInterviews.cjs");
  app.use("/api/admin", scheduledInterviewRoutes);
  console.log("? Scheduled Interview routes mounted at /api/admin");
} catch (e) {
  console.warn("Scheduled Interview routes not available:", e.message);
}

// Mount backend API routes
try {
  const submissionsRoutes = require("./routes/submissions.cjs");
  app.use("/api/submissions", submissionsRoutes);
} catch (e) {
  console.warn("Submissions routes not available:", e.message);
}

// Mount database-backed progress summary and legacy session storage compatibility routes
try {
  const progressRoutes = require("./routes/progress.cjs");
  app.use("/api", progressRoutes);
} catch (e) {
  console.warn("Progress routes not available:", e.message);
}

// Mount persistent Q&A history and analytics routes
try {
  const qaRoutes = require("./routes/qa.cjs");
  app.use("/api", qaRoutes);
} catch (e) {
  console.warn("Q&A routes not available:", e.message);
}

// Mount backend Judge0 proxy so API keys stay server-side
try {
  const judge0Routes = require("./routes/judge0.cjs");
  app.use("/api/judge0", judge0Routes);
} catch (e) {
  console.warn("Judge0 routes not available:", e.message);
}

// Mount AI practice generation routes used by MCQ, coding, assessment, and code-review flows
try {
  const practiceGenerationRoutes = require("./routes/practiceGeneration.cjs");
  app.use("/api", practiceGenerationRoutes);
} catch (e) {
  console.warn("Practice generation routes not available:", e.message);
}

// Mount Codeforces HTML proxy used by older contest/problem views
try {
  const codeforcesRoutes = require("./routes/codeforces.cjs");
  app.use("/", codeforcesRoutes);
} catch (e) {
  console.warn("Codeforces proxy routes not available:", e.message);
}

// Mount resume analyzer routes for ATS, job match, roadmap, and skill-gap interviews
try {
  const resumeRoutes = require("./routes/resume.cjs");
  app.use("/api/resume", resumeRoutes);
} catch (e) {
  console.warn("Resume analyzer routes not available:", e.message);
}

// Mount contests routes (CRUD + problems)
try {
  const contestsRoutes = require("./routes/contests.cjs");
  app.use("/api/contests", contestsRoutes);
} catch (e) {
  console.warn("Contests routes not available:", e.message);
}

// Mount AI interview routes
try {
  const aiInterviewRoutes = require("./routes/aiInterview.cjs");
  app.use("/api/ai", aiInterviewRoutes);
} catch (e) {
  console.warn("AI Interview routes not available:", e.message);
}

// Mount Ollama interview routes (GPU-accelerated interviews + MCQ generation)
try {
  const ollamaInterviewRoutes = require("./routes/ollamaInterview.cjs");
  app.use("/api/ollama", ollamaInterviewRoutes);
  console.log("? Ollama routes mounted at /api/ollama (interviews + MCQ)");
} catch (e) {
  console.warn("Ollama Interview routes not available:", e.message);
}

// Mount interview data storage routes
try {
  const interviewRoutes = require("./routes/interview.cjs");
  app.use("/api/interview", interviewRoutes);
} catch (e) {
  console.warn("Interview routes not available:", e.message);
}

// Mount public scheduled interview routes (for students)
try {
  const publicInterviewRoutes = require("./routes/publicInterviews.cjs");
  app.use("/api/public", publicInterviewRoutes);
  console.log("? Public Interview routes mounted at /api/public");
} catch (e) {
  console.warn("Public Interview routes not available:", e.message);
}

// Mount optional demo-sensitive integrations only when configured.
mountOptionalFeature({
  basePath: "/api/ml",
  featureKey: "ml",
  label: "ML Service",
  loadRoutes: () => require("./routes/ml.cjs"),
});

mountOptionalFeature({
  basePath: "/api/ai-agent",
  featureKey: "aiAgent",
  label: "Agentic AI",
  loadRoutes: () => require("./routes/agenticAI.cjs"),
});

mountOptionalFeature({
  basePath: "/api/agentic",
  featureKey: "aiAgent",
  label: "Enhanced Agentic AI",
  loadRoutes: () => require("./routes/enhancedAgentic.cjs"),
});

mountOptionalFeature({
  basePath: "/api/avatar",
  featureKey: "avatar",
  label: "SadTalker Avatar",
  loadRoutes: () => require("./routes/avatar.cjs"),
});

// Connect to MongoDB via Mongoose before starting the server.
// Start the HTTP server only after successful DB connection. Exit on failure.
mongooseService
  .connect()
  .then(() => {
    console.log("\n?? Md Saif Ali");
    console.log("? MongoDB: Connected");

    // Start contest status auto-updater
    try {
      const ContestStatusUpdater = require("./services/contestStatusUpdater.cjs");
      ContestStatusUpdater.startPolling(60000); // Update every 60 seconds
      console.log("? Contest Status Updater: Started");
    } catch (err) {
      console.warn("??  Contest Status Updater not available:", err.message);
    }

    // Start the server once DB is ready
    server.listen(PORT, () => {
      console.log(`?? Server: Running on http://localhost:${PORT}`);
      console.log(`?? Socket.IO: Ready for real-time updates\n`);
    });
  })
  .catch((err) => {
    console.error(
      "? MongoDB connection error:",
      err && err.message ? err.message : err,
    );
    console.error("Exiting process since DB connection failed.");
    // Give logs a moment to flush
    setTimeout(() => process.exit(1), 250);
  });

// NOTE: server is started inside mongooseService.connect() above so we only run
// when the DB is available.
