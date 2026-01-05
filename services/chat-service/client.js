import { io } from "socket.io-client";
import readline from "readline";

const USER = process.argv[2];
const JWT = process.argv[3];
const RECEIVER = process.argv[4];

const socket = io("http://localhost:5000", {
  auth: { token: JWT }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

socket.on("connect", () => {
  console.log(`✅ User ${USER} connected`);
  console.log("✍️ Type message and press Enter:");
});

socket.on("receive_message", (msg) => {
  console.log("\n📩 Message received:", msg.content);
});

rl.on("line", (input) => {
  socket.emit("send_message", {
    receiverId: RECEIVER,
    content: input
  });
});
