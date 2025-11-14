# Real-Time Collaborative Drawing Canvas

This is a full-stack implementation of a real-time collaborative whiteboard application, built to demonstrate mastery of the HTML5 Canvas API, Vanilla TypeScript, Node.js, and advanced Socket.IO features for real-time synchronization.

**Core Constraint:** All client-side drawing logic is implemented using **Vanilla TypeScript and the HTML5 Canvas API** (no React/Vue/etc. frameworks).

## Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone [your-repo-link]
    cd collaborative-canvas
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Start the Application:**
    The `start` script will first compile the TypeScript client files to JavaScript and then launch the Node.js server.
    ```bash
    npm start
    ```
    (For development, use `npm run dev` to watch for changes).
4.  **Access the App:** Open your browser to `http://localhost:3000`.

## How to Test with Multiple Users

Simply open the application URL (`http://localhost:3000`) in **multiple browser tabs or different browsers**. Each instance will be treated as a unique user, assigned a random color, and all drawing actions will be synchronized instantly.

## Known Limitations

* **No Authentication:** User IDs are randomly generated UUIDs on connection, with no persistence or authentication.
* **Single Room:** The current implementation uses a single, global room. The `rooms.ts` structure is defined for future expansion but currently only supports one canvas.
* **Canvas Redraw Overhead:** While optimization techniques like stroke-based history and `requestAnimationFrame` are used, re-drawing the entire history on initial connection or undo/redo can still introduce a slight delay with thousands of complex strokes.

***