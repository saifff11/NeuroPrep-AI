const aiProvider = require("../services/aiProviderService.cjs");

function readBooleanEnv(name, defaultValue = undefined) {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === "") return defaultValue;

  const normalized = String(rawValue).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;

  return defaultValue;
}

function configuredAiProviders() {
  return aiProvider
    .getProviderSequence()
    .filter((provider) => aiProvider.isProviderConfigured(provider));
}

function buildCapability({ key, label, available, reason, requires = [], details = {} }) {
  return {
    key,
    label,
    available: Boolean(available),
    status: available ? "available" : "coming-soon",
    reason,
    requires,
    details,
  };
}

function getFeatureCapabilities() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const configuredProviders = configuredAiProviders();
  const cloudAiConfigured = configuredProviders.some((provider) =>
    ["gemini", "groq"].includes(provider),
  );
  const explicitAiProvider = String(process.env.AI_PROVIDER || "").trim().toLowerCase();
  const localOllamaExplicit =
    explicitAiProvider === "ollama" || readBooleanEnv("USE_OLLAMA", false) === true;
  const demoReadyProviders = configuredProviders.filter((provider) =>
    provider !== "ollama" || localOllamaExplicit,
  );

  const mlFlag = readBooleanEnv("ENABLE_ML_FEATURES");
  const mlConfigured = mlFlag === true || Boolean(process.env.ML_API_URL);
  const mlAvailable = mlFlag !== false && mlConfigured;

  const aiAgentFlag = readBooleanEnv("ENABLE_AI_AGENT_FEATURES", true);
  const aiAgentAvailable =
    aiAgentFlag !== false &&
    demoReadyProviders.length > 0 &&
    (nodeEnv !== "production" || cloudAiConfigured);

  const avatarFlag = readBooleanEnv("ENABLE_AVATAR_FEATURES");
  const avatarConfigured =
    avatarFlag === true || Boolean(process.env.SADTALKER_SERVICE_URL);
  const avatarAvailable = avatarFlag !== false && avatarConfigured;

  return {
    success: true,
    checkedAt: new Date().toISOString(),
    nodeEnv,
    features: {
      ml: buildCapability({
        key: "ml",
        label: "ML performance coach",
        available: mlAvailable,
        reason: mlAvailable
          ? "ML performance features are configured."
          : "ML performance features need the Python ML service configured before demo use.",
        requires: ["ML_API_URL or ENABLE_ML_FEATURES=true"],
        details: {
          mlApiUrlConfigured: Boolean(process.env.ML_API_URL),
          enabledByFlag: mlFlag === true,
          disabledByFlag: mlFlag === false,
        },
      }),
      aiAgent: buildCapability({
        key: "aiAgent",
        label: "AI learning companion",
        available: aiAgentAvailable,
        reason: aiAgentAvailable
          ? "AI companion routes have a configured backend AI provider."
          : nodeEnv === "production" && !cloudAiConfigured
            ? "AI companion needs Gemini or Groq configured in production."
            : "AI companion needs a configured backend AI provider before demo use.",
        requires:
          nodeEnv === "production"
            ? ["GEMINI_API_KEY or GROQ_API_KEY"]
            : ["Local Ollama or a cloud AI provider"],
        details: {
          primaryProvider: aiProvider.getPrimaryProvider(),
          providerSequence: aiProvider.getProviderSequence(),
          configuredProviders,
          demoReadyProviders,
          localOllamaExplicit,
          disabledByFlag: aiAgentFlag === false,
        },
      }),
      avatar: buildCapability({
        key: "avatar",
        label: "Realistic interview avatar",
        available: avatarAvailable,
        reason: avatarAvailable
          ? "SadTalker avatar integration is configured."
          : "Realistic avatar video needs the SadTalker service configured before demo use.",
        requires: ["SADTALKER_SERVICE_URL or ENABLE_AVATAR_FEATURES=true"],
        details: {
          sadTalkerUrlConfigured: Boolean(process.env.SADTALKER_SERVICE_URL),
          enabledByFlag: avatarFlag === true,
          disabledByFlag: avatarFlag === false,
        },
      }),
    },
  };
}

module.exports = {
  getFeatureCapabilities,
  readBooleanEnv,
};
