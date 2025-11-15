// WebSocket Client Manager
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;

    // Event handlers
    this.handlers = {
      connect: [],
      disconnect: [],
      message: [],
      error: [],
    };

    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.emit("error", error);
    }
  }

  setupEventListeners() {
    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
      this.emit("connect");
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.emit("disconnect");
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.emit("error", error);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit("message", data);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not connected");
    }
  }

  on(event, handler) {
    if (this.handlers[event]) {
      this.handlers[event].push(handler);
    }
  }

  emit(event, data) {
    if (this.handlers[event]) {
      this.handlers[event].forEach((handler) => handler(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Message types
const MessageTypes = {
  DRAW: "draw",
  CURSOR: "cursor",
  UNDO: "undo",
  REDO: "redo",
  CLEAR: "clear",
  USER_JOINED: "user-joined",
  USER_LEFT: "user-left",
  STATE_SYNC: "state-sync",
};

// Drawing Protocol Handler
class DrawingProtocol {
  constructor(wsClient) {
    this.ws = wsClient;
    this.userId = null;
    this.users = new Map();

    // Event callbacks
    this.callbacks = {
      draw: [],
      cursor: [],
      undo: [],
      redo: [],
      clear: [],
      userJoined: [],
      userLeft: [],
      stateSync: [],
    };

    this.setupMessageHandlers();
  }

  setupMessageHandlers() {
    this.ws.on("message", (data) => {
      console.log("Received message:", data.type, data);

      switch (data.type) {
        case MessageTypes.USER_JOINED:
          this.handleUserJoined(data);
          break;
        case MessageTypes.USER_LEFT:
          this.handleUserLeft(data);
          break;
        case MessageTypes.DRAW:
          this.handleDraw(data);
          break;
        case MessageTypes.CURSOR:
          this.handleCursor(data);
          break;
        case MessageTypes.UNDO:
          this.handleUndo(data);
          break;
        case MessageTypes.REDO:
          this.handleRedo(data);
          break;
        case MessageTypes.CLEAR:
          this.handleClear(data);
          break;
        case MessageTypes.STATE_SYNC:
          this.handleStateSync(data);
          break;
      }
    });
  }

  handleUserJoined(data) {
    this.userId = data.userId;

    if (data.users) {
      data.users.forEach((user) => {
        this.users.set(user.id, user);
      });
    }

    this.emit("userJoined", data);
  }

  handleUserLeft(data) {
    this.users.delete(data.userId);
    this.emit("userLeft", data);
  }

  handleDraw(data) {
    // Don't draw our own strokes again
    if (data.userId !== this.userId) {
      // Emit with full data structure
      this.emit("draw", {
        userId: data.userId,
        data: data.data,
      });
    }
  }

  handleCursor(data) {
    // Don't show our own cursor
    if (data.userId !== this.userId) {
      this.emit("cursor", data);
    }
  }

  handleUndo(data) {
    this.emit("undo", data);
  }

  handleRedo(data) {
    this.emit("redo", data);
  }

  handleClear(data) {
    this.emit("clear", data);
  }

  handleStateSync(data) {
    this.emit("stateSync", data);
  }

  // Send methods
  sendDraw(drawData) {
    this.ws.send({
      type: MessageTypes.DRAW,
      data: drawData,
    });
  }

  sendCursor(x, y) {
    this.ws.send({
      type: MessageTypes.CURSOR,
      x: x,
      y: y,
    });
  }

  sendUndo() {
    this.ws.send({
      type: MessageTypes.UNDO,
    });
  }

  sendRedo() {
    this.ws.send({
      type: MessageTypes.REDO,
    });
  }

  sendClear() {
    this.ws.send({
      type: MessageTypes.CLEAR,
    });
  }

  // Event subscription
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach((callback) => callback(data));
    }
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }
}
