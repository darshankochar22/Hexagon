// Backend Switcher for Testing
// Easy way to switch between localhost and deployed backend

export const BACKEND_OPTIONS = {
  LOCAL_NODEJS: {
    name: "Local Node.js",
    url: "http://localhost:5003",
    status: "development",
  },
  DEPLOYED: {
    name: "Deployed (Vercel)",
    url: "https://backend-ezis.vercel.app",
    status: "production",
  },
  LOCAL_FASTAPI: {
    name: "Local FastAPI",
    url: "http://localhost:8000",
    status: "development",
  },
};

// Current backend selection
let currentBackend = "DEPLOYED"; // Change this to switch

export const getCurrentBackend = () => {
  return BACKEND_OPTIONS[currentBackend];
};

export const setBackend = (backendKey) => {
  if (BACKEND_OPTIONS[backendKey]) {
    currentBackend = backendKey;
    console.log(`🔄 Switched to: ${BACKEND_OPTIONS[backendKey].name}`);
    return true;
  }
  return false;
};

export const getApiUrl = (endpoint) => {
  const backend = getCurrentBackend();
  return `${backend.url}${endpoint}`;
};

// Test backend connectivity
export const testBackend = async (backendKey = currentBackend) => {
  try {
    const backend = BACKEND_OPTIONS[backendKey];
    const response = await fetch(`${backend.url}/`);
    const data = await response.json();

    if (data.status === "ok") {
      console.log(`✅ ${backend.name} is working!`);
      return { success: true, data };
    } else {
      console.log(`❌ ${backend.name} returned unexpected response`);
      return { success: false, error: "Unexpected response" };
    }
  } catch (error) {
    console.log(
      `❌ ${BACKEND_OPTIONS[backendKey].name} is not reachable:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};
