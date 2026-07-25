const { verifyToken } = require("../utils/jwt");

function initSockets(io) {
  // Authenticate every socket connection using the same JWT as the REST API
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No auth token provided"));
      const decoded = verifyToken(token);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    // Every user gets a personal room for direct notifications
    socket.join(`user:${socket.userId}`);

    // Client asks to join a project board room to receive live task/comment events
    socket.on("project:join", (projectId) => {
      socket.join(`project:${projectId}`);
    });

    socket.on("project:leave", (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // Lightweight "someone is typing a comment" indicator
    socket.on("comment:typing", ({ taskId, projectId, userName }) => {
      socket.to(`project:${projectId}`).emit("comment:typing", { taskId, userName });
    });

    socket.on("disconnect", () => {
      // sockets auto-leave all rooms on disconnect; nothing else to clean up
    });
  });
}

module.exports = initSockets;
