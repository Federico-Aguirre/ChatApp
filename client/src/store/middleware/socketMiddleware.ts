import { Middleware } from "@reduxjs/toolkit";
import { socket } from "../../socket"; // 💡 Importación centralizada desde socket.ts
import {
  addMessage,
  addChannelFromSocket,
  removeChannelFromSocket,
  setMessages,
  fetchChannels,
  fetchUsers,
} from "../slices/chatSlice";

let isListenersInitialized = false;

export const socketMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);
  const state = store.getState();
  const token = state.auth.token;
  const currentUser = state.auth.currentUser || state.auth.user;
  const userId = currentUser?._id || currentUser?.id;

  const isValidToken = Boolean(token && token !== "null" && token !== "undefined");

  // 1. Manejar conexión y unir al usuario a su sala personal
  if (action.type === "auth/setAuthData" || action.type === "auth/login/fulfilled") {
    const activeToken = action.payload?.token || token;
    const activeUser = action.payload?.user || action.payload?.currentUser || currentUser;
    const uId = activeUser?._id || activeUser?.id;

    if (activeToken && activeToken !== "null" && activeToken !== "undefined") {
      socket.auth = { token: activeToken };
      if (!socket.connected) {
        socket.connect();
      } else if (uId) {
        socket.emit("join_user", uId);
      }
    }
  }

  if (action.type === "auth/logout") {
    socket.auth = {};
    socket.disconnect();
  }

  // Auto-conectar con token válido
  if (isValidToken && !socket.connected) {
    socket.auth = { token };
    socket.connect();
  } else if (isValidToken && socket.connected && userId) {
    socket.emit("join_user", userId);
  }

  // 2. Inicializar listeners una sola vez
  if (!isListenersInitialized) {
    isListenersInitialized = true;

    socket.on("connect", () => {
      const user = store.getState().auth.currentUser || store.getState().auth.user;
      const uId = user?._id || user?.id;
      if (uId) socket.emit("join_user", uId);

      const activeChannel = store.getState().chat.activeChannel;
      if (activeChannel?._id) {
        socket.emit("join_channel", activeChannel._id);
      }
    });

    socket.on("receive_message", async (message) => {
      const user = store.getState().auth.currentUser || store.getState().auth.user;
      const currentUserId = user?._id || user?.id;
      const channels = store.getState().chat.channels;

      const incomingChannelId =
        typeof message.channelId === "object" ? message.channelId._id : message.channelId;

      if (incomingChannelId) {
        socket.emit("join_channel", incomingChannelId);
      }

      if (!channels.some((c: any) => c._id === incomingChannelId) && currentUserId) {
        await store.dispatch(fetchChannels(currentUserId) as any);
      }

      await store.dispatch(fetchUsers() as any);

      const updatedChannels = store.getState().chat.channels;
      const targetChannel = updatedChannels.find((c: any) => c._id === incomingChannelId);
      const isDirect = message.isDirect || targetChannel?.isDirect;

      if (isDirect) {
        const sender = typeof message.sender === "object" ? message.sender : null;
        const senderId = sender?._id || message.sender;

        if (senderId && currentUserId && senderId !== currentUserId) {
          const currentContacts = user?.contacts || [];
          const hasContact = currentContacts.some(
            (c: any) => (typeof c === "object" ? c._id : c) === senderId
          );

          if (!hasContact) {
            const activeToken = store.getState().auth.token;
            const updatedUser = {
              ...user,
              contacts: [...currentContacts, sender || senderId],
            };

            store.dispatch({
              type: "auth/setAuthData",
              payload: {
                token: activeToken,
                user: updatedUser,
              },
            });
          }
        }
      }

      store.dispatch(addMessage({ message, currentUserId }));
    });

    socket.on("new_channel", async (channel: any) => {
      if (channel?._id) {
        socket.emit("join_channel", channel._id);
      }
      store.dispatch(addChannelFromSocket(channel));

      const user = store.getState().auth.currentUser || store.getState().auth.user;
      const currentUserId = user?._id || user?.id;

      if (currentUserId) {
        store.dispatch(fetchUsers() as any);
        store.dispatch(fetchChannels(currentUserId) as any);
      }
    });

    socket.on("channel_deleted", (deletedChannelId: string) => {
      store.dispatch(removeChannelFromSocket(deletedChannelId));
    });

    socket.on("channel_history", (history) => {
      store.dispatch(setMessages(history));
    });
  }

  // 3. Unirse al canal activo
  if (action.type === "chat/setActiveChannel") {
    const channelId = action.payload?._id || action.payload;
    if (channelId) {
      if (isValidToken && !socket.connected) {
        socket.auth = { token };
        socket.connect();
      }
      socket.emit("join_channel", channelId);
    }
  }

  // 4. Enviar mensaje
  if (action.type === "chat/sendMessage") {
    const payloadChannelId = typeof action.payload === "object" ? action.payload?.channelId : null;
    const payloadSenderId = typeof action.payload === "object" ? action.payload?.senderId : null;
    const content = typeof action.payload === "string" ? action.payload : action.payload?.content;

    const targetChannelId = payloadChannelId || state.chat.activeChannel?._id;
    const targetUserId = payloadSenderId || userId;

    if (isValidToken && !socket.connected) {
      socket.auth = { token };
      socket.connect();
    }

    if (targetChannelId && targetUserId && content) {
      socket.emit("join_channel", targetChannelId);

      socket.emit("send_message", {
        channelId: targetChannelId,
        senderId: targetUserId,
        content,
      });
    }
  }

  return result;
};