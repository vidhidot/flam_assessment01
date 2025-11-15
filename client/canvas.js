// Canvas Drawing Manager
class CanvasManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: false });

    // Drawing state
    this.isDrawing = false;
    this.currentTool = "brush";
    this.currentColor = "#000000";
    this.currentWidth = 5;

    // Mouse position tracking
    this.lastX = 0;
    this.lastY = 0;

    // Event throttling
    this.lastEmitTime = 0;
    this.throttleDelay = 16; // ~60fps

    // Callbacks
    this.onDrawCallback = null;
    this.onCursorMoveCallback = null;

    this.initializeCanvas();
    this.setupEventListeners();
  }

  initializeCanvas() {
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.canvas.addEventListener("mouseleave", this.handleMouseUp.bind(this));

    // Touch events for mobile
    this.canvas.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this)
    );
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this));
    this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this));
  }

  getCanvasCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  handleMouseDown(e) {
    this.isDrawing = true;
    const coords = this.getCanvasCoordinates(e);
    this.lastX = coords.x;
    this.lastY = coords.y;
  }

  handleMouseMove(e) {
    const coords = this.getCanvasCoordinates(e);

    // Emit cursor position (throttled)
    const now = Date.now();
    if (
      this.onCursorMoveCallback &&
      now - this.lastEmitTime >= this.throttleDelay
    ) {
      this.onCursorMoveCallback(coords.x, coords.y);
    }

    if (!this.isDrawing) return;

    // Draw locally
    this.drawLine(
      this.lastX,
      this.lastY,
      coords.x,
      coords.y,
      this.currentColor,
      this.currentWidth,
      this.currentTool
    );

    // Emit draw event (throttled)
    if (this.onDrawCallback && now - this.lastEmitTime >= this.throttleDelay) {
      this.onDrawCallback({
        x: coords.x,
        y: coords.y,
        prevX: this.lastX,
        prevY: this.lastY,
        color: this.currentColor,
        width: this.currentWidth,
        tool: this.currentTool,
      });
      this.lastEmitTime = now;
    }

    this.lastX = coords.x;
    this.lastY = coords.y;
  }

  handleMouseUp() {
    this.isDrawing = false;
  }

  // Touch event handlers
  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.handleMouseDown(touch);
  }

  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.handleMouseMove(touch);
  }

  handleTouchEnd(e) {
    e.preventDefault();
    this.handleMouseUp();
  }

  drawLine(x1, y1, x2, y2, color, width, tool) {
    this.ctx.save();

    if (tool === "eraser") {
      this.ctx.globalCompositeOperation = "destination-out";
      this.ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      this.ctx.globalCompositeOperation = "source-over";
      this.ctx.strokeStyle = color;
    }

    this.ctx.lineWidth = width;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawRemoteLine(data) {
    if (!data || data.x === undefined || data.y === undefined) {
      console.warn("Invalid draw data received:", data);
      return;
    }
    this.drawLine(
      data.prevX,
      data.prevY,
      data.x,
      data.y,
      data.color,
      data.width,
      data.tool
    );
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setColor(color) {
    this.currentColor = color;
  }

  setWidth(width) {
    this.currentWidth = width;
  }

  onDraw(callback) {
    this.onDrawCallback = callback;
  }

  onCursorMove(callback) {
    this.onCursorMoveCallback = callback;
  }
}

// Cursor Manager for showing other users' cursors
class CursorManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.cursors = new Map();
  }

  updateCursor(userId, x, y, color, username) {
    let cursor = this.cursors.get(userId);

    if (!cursor) {
      cursor = this.createCursor(userId, color, username);
      this.cursors.set(userId, cursor);
    }

    cursor.element.style.left = x + "px";
    cursor.element.style.top = y + "px";
    cursor.lastUpdate = Date.now();
  }

  createCursor(userId, color, username) {
    const cursorEl = document.createElement("div");
    cursorEl.className = "cursor";
    cursorEl.style.backgroundColor = color;

    const label = document.createElement("div");
    label.className = "cursor-label";
    label.textContent = username || "User";
    cursorEl.appendChild(label);

    this.container.appendChild(cursorEl);

    return {
      element: cursorEl,
      lastUpdate: Date.now(),
    };
  }

  removeCursor(userId) {
    const cursor = this.cursors.get(userId);
    if (cursor) {
      cursor.element.remove();
      this.cursors.delete(userId);
    }
  }

  removeInactiveCursors(timeoutMs = 5000) {
    const now = Date.now();
    for (const [userId, cursor] of this.cursors.entries()) {
      if (now - cursor.lastUpdate > timeoutMs) {
        this.removeCursor(userId);
      }
    }
  }

  clear() {
    for (const [userId] of this.cursors.entries()) {
      this.removeCursor(userId);
    }
  }
}
