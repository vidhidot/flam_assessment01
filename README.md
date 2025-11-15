
#  Real-Time Collaborative Drawing Canvas

This project is a browser-based collaborative drawing app where multiple people can draw together on the same canvas in real time. It’s built entirely using **vanilla JavaScript**, the **HTML5 Canvas API**, and **Node.js WebSockets**—no frontend frameworks or drawing libraries.

The goal was to build something lightweight, fast, and easy to understand, while still handling the tricky parts of real-time sync, undo/redo across users, and smooth drawing performance.

---

##  What You Can Do in This App

### Drawing Tools
- Draw using a smooth freehand brush  
- Erase strokes  
- Change colors  
- Adjust brush size  
- Pixel-perfect path smoothing  

### Real-Time Features
- See other users’ drawings *as they happen*, not after they finish  
- Live cursor indicators showing where each person is drawing  
- Global undo/redo (affects everyone)  
- Basic conflict handling when users draw in the same place  
- Each user gets an auto-assigned color + is shown in an online users list



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
