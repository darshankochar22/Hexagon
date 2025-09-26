// Media Recording Utility for Interview Component

class MediaRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.sessionId = null;
    this.websocket = null;
    this.recordingStartTime = null;
  }

  // Initialize WebSocket connection for real-time streaming
  async connectWebSocket(sessionId) {
    this.sessionId = sessionId;
    const wsUrl = `ws://localhost:8000/media/ws/${sessionId}`;

    return new Promise((resolve, reject) => {
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log("WebSocket connected for media streaming");
        resolve();
      };

      this.websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };

      this.websocket.onclose = () => {
        console.log("WebSocket connection closed");
      };
    });
  }

  // Start recording video stream
  async startVideoRecording(stream, options = {}) {
    if (!stream) {
      throw new Error("No stream provided for recording");
    }

    const mimeType = this.getSupportedMimeType();
    const recordingOptions = {
      mimeType: mimeType,
      videoBitsPerSecond: options.videoBitsPerSecond || 2500000, // 2.5 Mbps
      audioBitsPerSecond: options.audioBitsPerSecond || 128000, // 128 kbps
      ...options,
    };

    this.mediaRecorder = new MediaRecorder(stream, recordingOptions);
    this.recordedChunks = [];
    this.recordingStartTime = Date.now();

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);

        // Send chunk to backend via WebSocket for real-time processing
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          this.sendVideoChunk(event.data);
        }
      }
    };

    this.mediaRecorder.onstop = () => {
      this.isRecording = false;
      console.log("Video recording stopped");
    };

    this.mediaRecorder.start(1000); // Record in 1-second chunks
    this.isRecording = true;
    console.log("Video recording started");
  }

  // Start recording audio stream
  async startAudioRecording(stream, options = {}) {
    if (!stream) {
      throw new Error("No stream provided for recording");
    }

    const mimeType = this.getSupportedAudioMimeType();
    const recordingOptions = {
      mimeType: mimeType,
      audioBitsPerSecond: options.audioBitsPerSecond || 128000,
      ...options,
    };

    this.mediaRecorder = new MediaRecorder(stream, recordingOptions);
    this.recordedChunks = [];
    this.recordingStartTime = Date.now();

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);

        // Send chunk to backend via WebSocket for real-time processing
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          this.sendAudioChunk(event.data);
        }
      }
    };

    this.mediaRecorder.onstop = () => {
      this.isRecording = false;
      console.log("Audio recording stopped");
    };

    this.mediaRecorder.start(1000); // Record in 1-second chunks
    this.isRecording = true;
    console.log("Audio recording started");
  }

  // Stop recording
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  // Get recorded blob
  getRecordedBlob() {
    if (this.recordedChunks.length === 0) {
      return null;
    }

    const mimeType = this.mediaRecorder?.mimeType || "video/webm";
    return new Blob(this.recordedChunks, { type: mimeType });
  }

  // Upload recorded media to backend
  async uploadRecordedMedia(userId, type = "video") {
    const blob = this.getRecordedBlob();
    if (!blob) {
      throw new Error("No recorded media to upload");
    }

    const formData = new FormData();
    const filename = `${type}_${Date.now()}.${this.getFileExtension()}`;
    formData.append("file", blob, filename);
    formData.append("session_id", this.sessionId);
    formData.append("user_id", userId);

    const endpoint =
      type === "video" ? "/media/upload/video" : "/media/upload/audio";
    const response = await fetch(`http://localhost:8000${endpoint}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Send video chunk via WebSocket
  async sendVideoChunk(chunk) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const arrayBuffer = await chunk.arrayBuffer();
    const base64Data = this.arrayBufferToBase64(arrayBuffer);

    const message = {
      type: "video_frame",
      data: base64Data,
      timestamp: new Date().toISOString(),
      user_id: this.userId,
      save_frame: true, // Set to true to save frames on server
    };

    this.websocket.send(JSON.stringify(message));
  }

  // Send audio chunk via WebSocket
  async sendAudioChunk(chunk) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const arrayBuffer = await chunk.arrayBuffer();
    const base64Data = this.arrayBufferToBase64(arrayBuffer);

    const message = {
      type: "audio_chunk",
      data: base64Data,
      timestamp: new Date().toISOString(),
      user_id: this.userId,
      save_chunk: true, // Set to true to save chunks on server
    };

    this.websocket.send(JSON.stringify(message));
  }

  // Send screen share frame via WebSocket
  async sendScreenShareFrame(canvas) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const base64Data = canvas.toDataURL("image/png").split(",")[1];

    const message = {
      type: "screen_share",
      data: base64Data,
      timestamp: new Date().toISOString(),
      user_id: this.userId,
      save_frame: true, // Set to true to save frames on server
    };

    this.websocket.send(JSON.stringify(message));
  }

  // Capture screen share frame
  captureScreenFrame(videoElement) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    return canvas;
  }

  // Get supported MIME type for video recording
  getSupportedMimeType() {
    const types = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return "video/webm"; // fallback
  }

  // Get supported MIME type for audio recording
  getSupportedAudioMimeType() {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/wav",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return "audio/webm"; // fallback
  }

  // Get file extension based on MIME type
  getFileExtension() {
    const mimeType = this.mediaRecorder?.mimeType || "video/webm";

    if (mimeType.includes("webm")) return "webm";
    if (mimeType.includes("mp4")) return "mp4";
    if (mimeType.includes("wav")) return "wav";

    return "webm"; // fallback
  }

  // Convert ArrayBuffer to Base64
  arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Start a media streaming session
  async startStreamingSession(userId, streamType = "video") {
    const response = await fetch("http://localhost:8000/media/stream/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: this.sessionId,
        user_id: userId,
        stream_type: streamType,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to start streaming session: ${response.statusText}`
      );
    }

    return await response.json();
  }

  // Get session files
  async getSessionFiles() {
    if (!this.sessionId) {
      throw new Error("No session ID available");
    }

    const response = await fetch(
      `http://localhost:8000/media/session/${this.sessionId}/files`
    );

    if (!response.ok) {
      throw new Error(`Failed to get session files: ${response.statusText}`);
    }

    return await response.json();
  }

  // Clean up resources
  cleanup() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }

    if (this.websocket) {
      this.websocket.close();
    }

    this.recordedChunks = [];
    this.isRecording = false;
  }
}

export default MediaRecorder;
