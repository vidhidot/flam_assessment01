/**
 * Drawing State Manager
 * Manages the canvas state, operation history, and undo/redo functionality
 */
class DrawingState {
  constructor(maxOperations = 500) {
    this.operations = [];
    this.redoStack = [];
    this.maxOperations = maxOperations;
    this.operationIdCounter = 0;
  }

  /**
   * Add a new drawing operation
   * @param {Object} operation - The operation to add
   * @returns {Object} The operation with assigned ID
   */
  addOperation(operation) {
    const op = {
      id: ++this.operationIdCounter,
      timestamp: Date.now(),
      ...operation,
    };

    this.operations.push(op);

    // Clear redo stack when new operation is added
    this.redoStack = [];

    // Limit operation history to prevent memory issues
    if (this.operations.length > this.maxOperations) {
      this.operations = this.operations.slice(-this.maxOperations);
    }

    return op;
  }

  /**
   * Undo the last operation
   * @returns {Object} Result containing success status and current operations
   */
  undo() {
    if (this.operations.length === 0) {
      return {
        success: false,
        message: "Nothing to undo",
      };
    }

    const lastOp = this.operations.pop();
    this.redoStack.push(lastOp);

    return {
      success: true,
      operations: this.operations,
    };
  }

  /**
   * Redo the last undone operation
   * @returns {Object} Result containing success status and current operations
   */
  redo() {
    if (this.redoStack.length === 0) {
      return {
        success: false,
        message: "Nothing to redo",
      };
    }

    const op = this.redoStack.pop();
    this.operations.push(op);

    return {
      success: true,
      operations: this.operations,
    };
  }

  /**
   * Clear all operations
   */
  clear() {
    this.operations = [];
    this.redoStack = [];
  }

  /**
   * Get all current operations
   * @returns {Array} Array of all operations
   */
  getAllOperations() {
    return [...this.operations];
  }

  /**
   * Get operations since a specific ID
   * Useful for syncing new clients
   * @param {number} sinceId - Operation ID to start from
   * @returns {Array} Array of operations after the specified ID
   */
  getOperationsSince(sinceId) {
    return this.operations.filter((op) => op.id > sinceId);
  }

  /**
   * Get the current state snapshot
   * @returns {Object} State snapshot
   */
  getSnapshot() {
    return {
      operations: this.getAllOperations(),
      operationCount: this.operations.length,
      canUndo: this.operations.length > 0,
      canRedo: this.redoStack.length > 0,
      lastOperationId:
        this.operations.length > 0
          ? this.operations[this.operations.length - 1].id
          : null,
    };
  }
}

module.exports = DrawingState;
