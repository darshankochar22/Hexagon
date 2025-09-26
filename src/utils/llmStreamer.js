// LLM Streaming Utility for Real-time Analysis

class LLMStreamer {
  constructor() {
    this.llmWebSocket = null;
    this.screenWebSocket = null;
    this.sessionId = null;
    this.isConnected = false;
    this.analysisCallbacks = [];
    this.lastVideoSentAt = 0;
    this.lastScreenSentAt = 0;
  }

  // Connect to LLM video/audio analysis
  async connectVideoAnalysis(sessionId) {
    this.sessionId = sessionId;
    const wsUrl = `ws://localhost:8000/media/llm/stream/${sessionId}`;

    return new Promise((resolve, reject) => {
      this.llmWebSocket = new WebSocket(wsUrl);

      this.llmWebSocket.onopen = () => {
        console.log("Connected to LLM video analysis");
        this.isConnected = true;
        resolve();
      };

      this.llmWebSocket.onmessage = (event) => {
        const analysis = JSON.parse(event.data);
        this.handleAnalysis(analysis);
      };

      this.llmWebSocket.onerror = (error) => {
        console.error("LLM WebSocket error:", error);
        reject(error);
      };

      this.llmWebSocket.onclose = () => {
        console.log("LLM WebSocket connection closed");
        this.isConnected = false;
      };
    });
  }

  // Send interview context (job description, resume, candidate meta)
  sendInterviewContext(contextPayload) {
    if (!this.llmWebSocket || this.llmWebSocket.readyState !== WebSocket.OPEN) {
      console.warn("LLM socket not open; cannot send context yet");
      return;
    }

    const message = {
      type: "context",
      timestamp: new Date().toISOString(),
      ...contextPayload,
    };

    this.llmWebSocket.send(JSON.stringify(message));
  }

  // Connect to LLM screen analysis
  async connectScreenAnalysis(sessionId) {
    this.sessionId = sessionId;
    const wsUrl = `ws://localhost:8000/media/llm/screen/${sessionId}`;

    return new Promise((resolve, reject) => {
      this.screenWebSocket = new WebSocket(wsUrl);

      this.screenWebSocket.onopen = () => {
        console.log("Connected to LLM screen analysis");
        resolve();
      };

      this.screenWebSocket.onmessage = (event) => {
        const analysis = JSON.parse(event.data);
        this.handleAnalysis(analysis);
      };

      this.screenWebSocket.onerror = (error) => {
        console.error("Screen LLM WebSocket error:", error);
        reject(error);
      };

      this.screenWebSocket.onclose = () => {
        console.log("Screen LLM WebSocket connection closed");
      };
    });
  }

  // Send video frame for LLM analysis
  sendVideoFrame(videoElement, userId, options = {}) {
    if (!this.llmWebSocket || this.llmWebSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const now = Date.now();
    const minIntervalMs = options.minIntervalMs ?? 15000; // default 15s
    if (now - this.lastVideoSentAt < minIntervalMs) return;

    const canvas = this.captureFrame(videoElement, { downscaleToWidth: 640 });
    const base64Data = canvas.toDataURL("image/jpeg", 0.5).split(",")[1];

    const message = {
      type: "video_frame",
      data: base64Data,
      timestamp: new Date().toISOString(),
      user_id: userId,
    };

    this.llmWebSocket.send(JSON.stringify(message));
    this.lastVideoSentAt = now;
  }

  // Send audio chunk for LLM analysis
  sendAudioChunk(audioBlob, userId) {
    if (!this.llmWebSocket || this.llmWebSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.blobToBase64(audioBlob).then((base64Data) => {
      const message = {
        type: "audio_chunk",
        data: base64Data,
        timestamp: new Date().toISOString(),
        user_id: userId,
      };

      this.llmWebSocket.send(JSON.stringify(message));
    });
  }

  // Send screen share for LLM analysis
  sendScreenShare(screenElement, userId, options = {}) {
    if (
      !this.screenWebSocket ||
      this.screenWebSocket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const now = Date.now();
    const minIntervalMs = options.minIntervalMs ?? 30000; // default 30s
    if (now - this.lastScreenSentAt < minIntervalMs) return;

    const canvas = this.captureFrame(screenElement, { downscaleToWidth: 1024 });
    const base64Data = canvas.toDataURL("image/jpeg", 0.5).split(",")[1];

    const message = {
      type: "screen_share",
      data: base64Data,
      timestamp: new Date().toISOString(),
      user_id: userId,
    };

    this.screenWebSocket.send(JSON.stringify(message));
    this.lastScreenSentAt = now;
  }

  // Capture frame from video element
  captureFrame(videoElement, { downscaleToWidth } = {}) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const srcW = videoElement.videoWidth || videoElement.width || 1280;
    const srcH = videoElement.videoHeight || videoElement.height || 720;
    if (downscaleToWidth && srcW > downscaleToWidth) {
      const scale = downscaleToWidth / srcW;
      canvas.width = Math.round(srcW * scale);
      canvas.height = Math.round(srcH * scale);
    } else {
      canvas.width = srcW;
      canvas.height = srcH;
    }

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    return canvas;
  }

  // Convert blob to base64
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Handle analysis results
  handleAnalysis(analysis) {
    console.log("LLM Analysis:", analysis);

    // Call all registered callbacks
    this.analysisCallbacks.forEach((callback) => {
      callback(analysis);
    });
  }

  // Register analysis callback
  onAnalysis(callback) {
    this.analysisCallbacks.push(callback);
  }

  // Remove analysis callback
  offAnalysis(callback) {
    const index = this.analysisCallbacks.indexOf(callback);
    if (index > -1) {
      this.analysisCallbacks.splice(index, 1);
    }
  }

  // Get session insights
  async getSessionInsights() {
    if (!this.sessionId) {
      throw new Error("No session ID available");
    }

    const response = await fetch(
      `http://localhost:8000/media/llm/insights/${this.sessionId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get session insights: ${response.statusText}`);
    }

    return await response.json();
  }

  // Start real-time video analysis
  async startVideoAnalysis(videoElement, userId, intervalMs = 15000) {
    if (!this.llmWebSocket || this.llmWebSocket.readyState !== WebSocket.OPEN) {
      try {
        await this.connectVideoAnalysis(this.sessionId);
      } catch (e) {
        console.error("Failed to connect video analysis socket", e);
        return;
      }
    }

    const sendFrame = () => {
      this.sendVideoFrame(videoElement, userId, { minIntervalMs: intervalMs });
    };

    // Send initial frame
    sendFrame();

    // Set up interval for regular analysis
    return setInterval(sendFrame, intervalMs);
  }

  // Start real-time screen analysis
  async startScreenAnalysis(screenElement, userId, intervalMs = 30000) {
    if (
      !this.screenWebSocket ||
      this.screenWebSocket.readyState !== WebSocket.OPEN
    ) {
      try {
        await this.connectScreenAnalysis(this.sessionId);
      } catch (e) {
        console.error("Failed to connect screen analysis socket", e);
        return;
      }
    }

    const sendScreen = () => {
      this.sendScreenShare(screenElement, userId, {
        minIntervalMs: intervalMs,
      });
    };

    // Send initial screen
    sendScreen();

    // Set up interval for regular analysis
    return setInterval(sendScreen, intervalMs);
  }

  // Clean up connections
  cleanup() {
    if (this.llmWebSocket) {
      this.llmWebSocket.close();
    }
    if (this.screenWebSocket) {
      this.screenWebSocket.close();
    }
    this.analysisCallbacks = [];
    this.isConnected = false;
  }
}

export default LLMStreamer;
