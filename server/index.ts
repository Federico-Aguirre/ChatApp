import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";

import authRoutes from "./routes/auth";
import channelRoutes from "./routes/channelRoutes";
import userRoutes from "./routes/userRoutes";
import Message from "./models/Message";
import { Channel } from "./models/Channel";
import User from "./models/User";

const app = express();

// Lista de dominios permitidos (Local + Vercel)
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL || "https://federico-aguirre-chat-app.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Bloqueado por políticas de CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.use((_req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/users", userRoutes);

const server = http.createServer(app);

export interface ServerToClientEvents {
  channel_history: (history: unknown[]) => void;
  receive_message: (data: unknown) => void;
  new_channel: (channel: unknown) => void;
  contact_added: (contact: unknown) => void;
}

export interface ClientToServerEvents {
  join_user: (userId: string) => void;
  join_channel: (channelId: string) => void;
  send_message: (data: {
    channelId: string;
    senderId: string;
    content: string;
    fileUrl?: string;
  }) => void;
  leave_channel: (channelId: string) => void;
}

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, unknown>,
  Record<string, unknown>
>(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  socket.on("join_user", (userId: string) => {
    const cleanUserId = typeof userId === "object" ? (userId as any)?._id : userId;
    if (cleanUserId) {
      const roomStr = cleanUserId.toString();
      socket.join(roomStr);
      console.log(`[Server] Usuario ${roomStr} unido a su sala personal`);
    }
  });

  socket.on("join_channel", async (channelId: string) => {
    const cleanChannelId = typeof channelId === "object" ? (channelId as any)?._id : channelId;
    if (!cleanChannelId) return;

    socket.join(cleanChannelId.toString());
    try {
      const history = await Message.find({ channelId: cleanChannelId })
        .populate("sender", "name email avatar status")
        .sort({ createdAt: 1 })
        .limit(50);

      socket.emit("channel_history", history);
    } catch (err) {
      console.error("Error al obtener historial:", err);
    }
  });

  socket.on("send_message", async (data) => {
    try {
      const senderIdStr =
        typeof data.senderId === "object" ? (data.senderId as any)?._id?.toString() : data.senderId?.toString();
      const channelIdStr =
        typeof data.channelId === "object" ? (data.channelId as any)?._id?.toString() : data.channelId?.toString();

      if (!senderIdStr || !channelIdStr) return;

      const channel = await Channel.findById(channelIdStr);
      if (!channel) return;

      const isDM = Boolean(
        channel.isDirect ||
          (channel as any).type === "direct" ||
          channel.name.startsWith("direct_") ||
          (channel.members && channel.members.length <= 2)
      );

      const newMessage = new Message({
        channelId: channelIdStr,
        sender: senderIdStr,
        content: data.content,
        fileUrl: data.fileUrl || "",
      });
      await newMessage.save();

      // Re-vincular contactos solo entre usuarios DISTINTOS
      if (isDM && channel.members) {
        for (const memberId of channel.members) {
          const memberIdStr = memberId._id ? memberId._id.toString() : memberId.toString();

          if (
            memberIdStr &&
            memberIdStr !== senderIdStr &&
            mongoose.Types.ObjectId.isValid(senderIdStr) &&
            mongoose.Types.ObjectId.isValid(memberIdStr)
          ) {
            await User.findByIdAndUpdate(memberIdStr, {
              $addToSet: { contacts: new mongoose.Types.ObjectId(senderIdStr) },
            });
            await User.findByIdAndUpdate(senderIdStr, {
              $addToSet: { contacts: new mongoose.Types.ObjectId(memberIdStr) },
            });

            await Channel.findByIdAndUpdate(channelIdStr, {
              $addToSet: {
                members: {
                  $each: [
                    new mongoose.Types.ObjectId(senderIdStr),
                    new mongoose.Types.ObjectId(memberIdStr),
                  ],
                },
              },
            });
          }
        }
      }

      const populatedChannel = await Channel.findById(channelIdStr).populate(
        "members",
        "name email avatar status discriminator"
      );
      const populatedMessage = await Message.findById(newMessage._id).populate(
        "sender",
        "name email avatar status discriminator"
      );

      if (!populatedChannel || !populatedMessage) return;

      const messageToEmit = {
        ...populatedMessage.toObject(),
        isDirect: isDM,
      };
      const cleanChannel = populatedChannel.toObject();

      io.to(channelIdStr).emit("receive_message", messageToEmit);

      if (populatedChannel.members && populatedChannel.members.length > 0) {
        for (const member of populatedChannel.members) {
          const memberIdStr = member._id ? member._id.toString() : member.toString();
          if (memberIdStr) {
            if (!isDM) {
              io.to(memberIdStr).emit("new_channel", cleanChannel);
            }

            io.to(memberIdStr).emit("receive_message", messageToEmit);

            if (memberIdStr !== senderIdStr) {
              const senderUser = await User.findById(senderIdStr)
                .select("name email avatar status discriminator")
                .lean();
              if (senderUser) {
                io.to(memberIdStr).emit("contact_added", senderUser);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Error guardando mensaje:", err);
    }
  });

  socket.on("leave_channel", (channelId: string) => {
    const cleanChannelId = typeof channelId === "object" ? (channelId as any)?._id : channelId;
    if (cleanChannelId) socket.leave(cleanChannelId.toString());
  });

  socket.on("disconnect", () => {
    console.log(`Socket desconectado: ${socket.id}`);
  });
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("Conexión a MongoDB cerrada. Servidor detenido limpiamente.");
  process.exit(0);
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

if (!MONGO_URI) {
  console.error("Error: MONGO_URI no está definida en las variables de entorno");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Conectado con éxito a MongoDB Atlas");
    server.listen(PORT, () =>
      console.log(`Servidor corriendo en el puerto ${PORT}`)
    );
  })
  .catch((err) => console.error("Error de conexión a MongoDB:", err));