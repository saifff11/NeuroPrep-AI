const API_BASE_ROOT = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = API_BASE_ROOT.endsWith('/api')
  ? API_BASE_ROOT
  : `${API_BASE_ROOT}/api`;

const DEFAULT_FEATURES = {
  ml: {
    key: 'ml',
    label: 'ML performance coach',
    available: false,
    status: 'coming-soon',
    reason: 'Backend capability check is unavailable.',
  },
  aiAgent: {
    key: 'aiAgent',
    label: 'AI learning companion',
    available: false,
    status: 'coming-soon',
    reason: 'Backend capability check is unavailable.',
  },
  avatar: {
    key: 'avatar',
    label: 'Realistic interview avatar',
    available: false,
    status: 'coming-soon',
    reason: 'Backend capability check is unavailable.',
  },
};

let capabilitiesPromise = null;

function normalizeCapabilities(data) {
  const incomingFeatures = data?.features || {};
  const features = Object.fromEntries(
    Object.entries(DEFAULT_FEATURES).map(([key, defaults]) => [
      key,
      { ...defaults, ...(incomingFeatures[key] || {}) },
    ]),
  );

  return {
    success: Boolean(data?.success),
    checkedAt: data?.checkedAt || null,
    nodeEnv: data?.nodeEnv || null,
    features,
  };
}

export async function getCapabilities({ refresh = false } = {}) {
  if (!capabilitiesPromise || refresh) {
    capabilitiesPromise = fetch(`${API_BASE_URL}/capabilities`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Capabilities request failed with ${response.status}`);
        }
        return response.json();
      })
      .then(normalizeCapabilities)
      .catch((error) => {
        console.warn('Feature capability check failed:', error.message);
        return normalizeCapabilities({ success: false });
      });
  }

  return capabilitiesPromise;
}

export async function isFeatureAvailable(featureKey) {
  const capabilities = await getCapabilities();
  return Boolean(capabilities.features?.[featureKey]?.available);
}

export function getDefaultFeature(featureKey) {
  return DEFAULT_FEATURES[featureKey] || {
    key: featureKey,
    label: featureKey,
    available: false,
    status: 'coming-soon',
    reason: 'Feature availability is unknown.',
  };
}
