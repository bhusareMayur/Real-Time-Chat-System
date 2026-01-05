import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

// userId -> socketId
const userSocketMap = new Map();

// 🔐 Auth middleware
io.use((socket, next) => {
  console.log("🔐 Auth middleware hit");

  const token = socket.handshake.auth?.token;
  if (!token) {
    console.log("❌ No token received");
    return next(new Error("Unauthorized"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token valid for user:", payload.userId);
    socket.userId = payload.userId;
    next();
  } catch (err) {
    console.log("❌ Token invalid");
    next(new Error("Unauthorized"));
  }
});


io.on("connection", (socket) => {
  console.log("User connected:", socket.userId);
  userSocketMap.set(socket.userId, socket.id);

  // 📩 HANDLE MESSAGE
  socket.on("send_message", (data) => {
    console.log("📨 send_message:", data);

    const { receiverId, content } = data;
    const receiverSocketId = userSocketMap.get(receiverId);

    if (!receiverSocketId) {
      console.log("❌ Receiver not connected:", receiverId);
      return;
    }

    io.to(receiverSocketId).emit("receive_message", {
      senderId: socket.userId,
      content,
      timestamp: Date.now()
    });

    console.log("✅ Message delivered");
  });

  socket.on("disconnect", () => {
    userSocketMap.delete(socket.userId);
    console.log("User disconnected:", socket.userId);
  });
});

httpServer.listen(5000, () =>
  console.log("Chat service running on port 5000")
);
