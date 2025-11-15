/**
 * Room Management System
 * Manages multiple isolated drawing canvases (rooms)
 * This is optional bonus functionality
 */

const DrawingState = require("./drawing-state");

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.defaultRoomId = "default";

    // Create default room
    this.createRoom(this.defaultRoomId);
  }

  /**
   * Create a new room
   * @param {string} roomId - Unique room identifier
   * @returns {Object} The created room
   */
  createRoom(roomId) {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId);
    }

    const room = {
      id: roomId,
      users: new Map(),
      drawingState: new DrawingState(),
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * Get a room by ID
   * @param {string} roomId - Room identifier
   * @returns {Object|null} The room or null if not found
   */
  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  /**
   * Get or create a room
   * @param {string} roomId - Room identifier
   * @returns {Object} The room
   */
  getOrCreateRoom(roomId) {
    return this.getRoom(roomId) || this.createRoom(roomId);
  }

  /**
   * Add a user to a room
   * @param {string} roomId - Room identifier
   * @param {string} userId - User identifier
   * @param {Object} userInfo - User information
   */
  addUserToRoom(roomId, userId, userInfo) {
    const room = this.getOrCreateRoom(roomId);
    room.users.set(userId, {
      ...userInfo,
      joinedAt: Date.now(),
    });
  }

  /**
   * Remove a user from a room
   * @param {string} roomId - Room identifier
   * @param {string} userId - User identifier
   */
  removeUserFromRoom(roomId, userId) {
    const room = this.getRoom(roomId);
    if (room) {
      room.users.delete(userId);

      // Clean up empty rooms (except default)
      if (room.users.size === 0 && roomId !== this.defaultRoomId) {
        this.deleteRoom(roomId);
      }
    }
  }

  /**
   * Get all users in a room
   * @param {string} roomId - Room identifier
   * @returns {Array} Array of users
   */
  getRoomUsers(roomId) {
    const room = this.getRoom(roomId);
    return room ? Array.from(room.users.values()) : [];
  }

  /**
   * Delete a room
   * @param {string} roomId - Room identifier
   */
  deleteRoom(roomId) {
    if (roomId !== this.defaultRoomId) {
      this.rooms.delete(roomId);
    }
  }

  /**
   * Get room statistics
   * @param {string} roomId - Room identifier
   * @returns {Object|null} Room statistics
   */
  getRoomStats(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    return {
      id: room.id,
      userCount: room.users.size,
      operationCount: room.drawingState.operations.length,
      createdAt: room.createdAt,
    };
  }

  /**
   * Get all rooms
   * @returns {Array} Array of room IDs
   */
  getAllRoomIds() {
    return Array.from(this.rooms.keys());
  }

  /**
   * Broadcast message to all users in a room
   * @param {string} roomId - Room identifier
   * @param {Object} message - Message to broadcast
   * @param {string} excludeUserId - Optional user ID to exclude
   */
  broadcastToRoom(roomId, message, excludeUserId = null) {
    const room = this.getRoom(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);

    room.users.forEach((user, userId) => {
      if (userId !== excludeUserId && user.ws && user.ws.readyState === 1) {
        user.ws.send(messageStr);
      }
    });
  }
}

module.exports = RoomManager;
