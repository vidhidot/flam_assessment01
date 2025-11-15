// Main Application
class CollaborativeDrawingApp {
  constructor() {
    // Initialize managers
    this.canvas = new CanvasManager("drawingCanvas");
    this.cursors = new CursorManager("cursors");

    // Connect to WebSocket - supports both local and production
    const wsUrl = this.getWebSocketUrl();
    console.log("Connecting to WebSocket:", wsUrl);
    this.wsClient = new WebSocketClient(wsUrl);
    this.protocol = new DrawingProtocol(this.wsClient);

    // UI elements
    this.statusEl = document.getElementById("status");
    this.userCountEl = document.getElementById("userCount");
    this.userListEl = document.getElementById("userList");

    this.setupUI();
    this.setupProtocolHandlers();
    this.setupCanvasHandlers();

    // Periodic cleanup of inactive cursors
    setInterval(() => {
      this.cursors.removeInactiveCursors();
    }, 5000);
  }

  getWebSocketUrl() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const port = window.location.port;

    // For Render and same-domain deployments
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      // Production - use same host as the webpage
      const wsUrl = `${protocol}//${hostname}${port ? ":" + port : ""}`;
      console.log("Production WebSocket URL:", wsUrl);
      return wsUrl;
    }

    // Local development
    console.log("Development WebSocket URL: ws://localhost:3000");
    return "ws://localhost:3000";
  }

  setupUI() {
    // Tool buttons
    const toolButtons = document.querySelectorAll(".tool-btn");
    toolButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        toolButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.canvas.setTool(btn.dataset.tool);
      });
    });

    // Color picker - listen to both change and input events
    const colorPicker = document.getElementById("colorPicker");
    const updateColor = (e) => {
      this.canvas.setColor(e.target.value);
    };
    colorPicker.addEventListener("change", updateColor);
    colorPicker.addEventListener("input", updateColor);

    // Set initial color
    this.canvas.setColor(colorPicker.value);

    // Width slider
    const widthSlider = document.getElementById("widthSlider");
    const widthValue = document.getElementById("widthValue");
    widthSlider.addEventListener("input", (e) => {
      const width = parseInt(e.target.value);
      widthValue.textContent = width;
      this.canvas.setWidth(width);
    });

    // Action buttons
    document.getElementById("undoBtn").addEventListener("click", () => {
      this.protocol.sendUndo();
    });

    document.getElementById("redoBtn").addEventListener("click", () => {
      this.protocol.sendRedo();
    });

    document.getElementById("clearBtn").addEventListener("click", () => {
      if (confirm("Clear the entire canvas? This will affect all users.")) {
        this.protocol.sendClear();
      }
    });
  }

  setupProtocolHandlers() {
    // Connection status
    this.wsClient.on("connect", () => {
      this.updateStatus(true);
    });

    this.wsClient.on("disconnect", () => {
      this.updateStatus(false);
    });

    // User events
    this.protocol.on("userJoined", (data) => {
      this.updateUserList();
    });

    this.protocol.on("userLeft", (data) => {
      this.cursors.removeCursor(data.userId);
      this.updateUserList();
    });

    // Drawing events
    this.protocol.on("draw", (data) => {
      // Draw strokes from other users
      if (data.data) {
        this.canvas.drawRemoteLine(data.data);
      }
    });

    this.protocol.on("cursor", (data) => {
      const user = this.protocol.getUser(data.userId);
      if (user) {
        this.cursors.updateCursor(
          data.userId,
          data.x,
          data.y,
          user.color,
          user.username
        );
      }
    });

    // State synchronization
    this.protocol.on("stateSync", (data) => {
      this.redrawCanvas(data.operations);
    });

    this.protocol.on("undo", (data) => {
      this.redrawCanvas(data.operations);
    });

    this.protocol.on("redo", (data) => {
      this.redrawCanvas(data.operations);
    });

    this.protocol.on("clear", () => {
      this.canvas.clear();
    });
  }

  setupCanvasHandlers() {
    this.canvas.onDraw((data) => {
      this.protocol.sendDraw(data);
    });

    this.canvas.onCursorMove((x, y) => {
      this.protocol.sendCursor(x, y);
    });
  }

  updateStatus(connected) {
    if (connected) {
      this.statusEl.textContent = "Connected";
      this.statusEl.className = "status connected";
    } else {
      this.statusEl.textContent = "Disconnected";
      this.statusEl.className = "status disconnected";
    }
  }

  updateUserList() {
    const users = this.protocol.getAllUsers();
    this.userCountEl.textContent = users.length;

    this.userListEl.innerHTML = "";
    users.forEach((user) => {
      const li = document.createElement("li");

      const colorDiv = document.createElement("div");
      colorDiv.className = "user-color";
      colorDiv.style.backgroundColor = user.color;

      const username = document.createTextNode(user.username || "Anonymous");

      li.appendChild(colorDiv);
      li.appendChild(username);
      this.userListEl.appendChild(li);
    });
  }

  redrawCanvas(operations) {
    if (!operations || !Array.isArray(operations)) {
      console.warn("Invalid operations for redraw:", operations);
      return;
    }

    console.log("Redrawing canvas with", operations.length, "operations");

    this.canvas.clear();

    operations.forEach((op) => {
      if (op.type === "draw" && op.data) {
        this.canvas.drawRemoteLine(op.data);
      }
    });
  }
}

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new CollaborativeDrawingApp();
  });
} else {
  new CollaborativeDrawingApp();
}
