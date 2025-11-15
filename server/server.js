const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const DrawingState = require("./drawing-state");

const app = express();
const server = http.createServer(app);

// WebSocket server configuration for Render
const wss = new WebSocket.Server({
  server,
  // Important for Render deployment
  perMessageDeflate: false,
  clientTracking: true,
});

const PORT = process.env.PORT || 3000;

// Serve static files from client directory
app.use(express.static(path.join(__dirname, "../client")));

// Health check endpoint (important for Render)
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// Drawing state manager
const drawingState = new DrawingState();

// User management
const users = new Map();
let userIdCounter = 0;

// Available colors for users
const userColors = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#34495e",
  "#16a085",
  "#c0392b",
  "#d35400",
  "#8e44ad",
  "#2980b9",
  "#27ae60",
  "#f1c40f",
];

let colorIndex = 0;

function assignUserColor() {
  const color = userColors[colorIndex % userColors.length];
  colorIndex++;
  return color;
}

function generateUsername() {
  const adjectives = [
    "Happy",
    "Creative",
    "Artistic",
    "Bright",
    "Cool",
    "Swift",
    "Bold",
    "Clever",
  ];
  const nouns = [
    "Artist",
    "Painter",
    "Creator",
    "Designer",
    "Drawer",
    "Maker",
    "Crafter",
    "Builder",
  ];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adj}${noun}${Math.floor(Math.random() * 100)}`;
}

// Broadcast to all connected clients
function broadcast(message, excludeUserId = null) {
  const messageStr = JSON.stringify(message);

  users.forEach((user, userId) => {
    if (userId !== excludeUserId && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(messageStr);
    }
  });
}

// Send to specific user
function sendToUser(userId, message) {
  const user = users.get(userId);
  if (user && user.ws.readyState === WebSocket.OPEN) {
    user.ws.send(JSON.stringify(message));
  }
}

// WebSocket connection handler
wss.on("connection", (ws) => {
  const userId = `user_${++userIdCounter}`;
  const color = assignUserColor();
  const username = generateUsername();

  // Store user
  users.set(userId, {
    id: userId,
    username: username,
    color: color,
    ws: ws,
  });

  console.log(`User connected: ${userId} (${username})`);

  // Send initial state to new user
  sendToUser(userId, {
    type: "user-joined",
    userId: userId,
    color: color,
    username: username,
    users: Array.from(users.values()).map((u) => ({
      id: u.id,
      username: u.username,
      color: u.color,
    })),
  });

  // Send current canvas state
  const operations = drawingState.getAllOperations();
  if (operations.length > 0) {
    sendToUser(userId, {
      type: "state-sync",
      operations: operations,
    });
  }

  // Notify other users
  broadcast(
    {
      type: "user-joined",
      userId: userId,
      username: username,
      color: color,
      users: Array.from(users.values()).map((u) => ({
        id: u.id,
        username: u.username,
        color: u.color,
      })),
    },
    userId
  );

  // Handle incoming messages
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case "draw":
          handleDraw(userId, data.data);
          break;
        case "cursor":
          handleCursor(userId, data);
          break;
        case "undo":
          handleUndo();
          break;
        case "redo":
          handleRedo();
          break;
        case "clear":
          handleClear();
          break;
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  // Handle disconnect
  ws.on("close", () => {
    console.log(`User disconnected: ${userId} (${username})`);
    users.delete(userId);

    broadcast({
      type: "user-left",
      userId: userId,
      users: Array.from(users.values()).map((u) => ({
        id: u.id,
        username: u.username,
        color: u.color,
      })),
    });
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error for ${userId}:`, error);
  });
});

function handleDraw(userId, drawData) {
  // Add operation to state
  const operation = drawingState.addOperation({
    type: "draw",
    userId: userId,
    data: drawData,
  });

  console.log("Broadcasting draw from user:", userId);

  // Broadcast to all users including sender (for consistency)
  broadcast({
    type: "draw",
    userId: userId,
    data: drawData,
  });
}

function handleCursor(userId, data) {
  // Broadcast cursor position to other users
  broadcast(
    {
      type: "cursor",
      userId: userId,
      x: data.x,
      y: data.y,
    },
    userId
  );
}

function handleUndo() {
  const result = drawingState.undo();

  console.log(
    "Undo requested, operations remaining:",
    result.operations?.length || 0
  );

  if (result.success) {
    broadcast({
      type: "undo",
      operations: result.operations,
    });
  } else {
    console.log("Undo failed:", result.message);
  }
}

function handleRedo() {
  const result = drawingState.redo();

  console.log(
    "Redo requested, operations after:",
    result.operations?.length || 0
  );

  if (result.success) {
    broadcast({
      type: "redo",
      operations: result.operations,
    });
  } else {
    console.log("Redo failed:", result.message);
  }
}

function handleClear() {
  drawingState.clear();

  broadcast({
    type: "clear",
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready for connections`);
});
