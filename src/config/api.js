// API Configuration
// Change this to switch between FastAPI and Node.js backends

const API_CONFIG = {
  // Backend selection: 'fastapi', 'nodejs', or 'deployed'
  BACKEND: "deployed", // Options: "fastapi", "nodejs", "deployed"

  // Backend URLs
  FASTAPI_URL: "http://localhost:8000",
  NODEJS_URL: "http://localhost:5003",
  DEPLOYED_URL: "https://backend-ezis.vercel.app",

  // Get current backend URL
  getCurrentBackendUrl: () => {
    switch (API_CONFIG.BACKEND) {
      case "fastapi":
        return API_CONFIG.FASTAPI_URL;
      case "nodejs":
        return API_CONFIG.NODEJS_URL;
      case "deployed":
        return API_CONFIG.DEPLOYED_URL;
      default:
        return API_CONFIG.NODEJS_URL;
    }
  },

  // API endpoints
  getApiUrl: (endpoint) => {
    const baseUrl = API_CONFIG.getCurrentBackendUrl();
    return `${baseUrl}${endpoint}`;
  },

  // Helper to check if using deployed backend
  isDeployed: () => API_CONFIG.BACKEND === "deployed",
};

export default API_CONFIG;
