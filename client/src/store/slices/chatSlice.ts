import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Channel, Message, User } from "../../types/chat";

interface ChatState {
  channels: Channel[];
  activeChannel: Channel | null;
  messages: Message[];
  unreadChannels: string[];
  unreadUsers: string[];
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  channels: [],
  activeChannel: null,
  messages: [],
  unreadChannels: [],
  unreadUsers: [],
  users: [],
  loading: false,
  error: null,
};

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Async Thunks para HTTP
export const fetchChannels = createAsyncThunk(
  "chat/fetchChannels",
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/api/channels?userId=${userId}`);
      if (!res.ok) throw new Error("Error al recuperar canales");
      return (await res.json()) as Channel[];
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchUsers = createAsyncThunk(
  "chat/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("${BASE_URL}/api/users");
      if (!res.ok) throw new Error("Error al cargar usuarios");
      return (await res.json()) as User[];
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const createChannel = createAsyncThunk(
  "chat/createChannel",
  async (
    { name, createdBy }: { name: string; createdBy: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch("${BASE_URL}/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isPrivate: true, createdBy }),
      });
      if (!res.ok) throw new Error("Fallo al crear canal");
      return (await res.json()) as Channel;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const addMemberByTag = createAsyncThunk(
  "chat/addMemberByTag",
  async (
    { channelId, requestingUserId, userTag }: { channelId: string; requestingUserId: string; userTag: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(`${BASE_URL}/api/channels/${channelId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestingUserId, userTag }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || "Error al agregar usuario.");
      return data as Channel;
    } catch (err: any) {
      return rejectWithValue("Error de conexión con el servidor.");
    }
  }
);

export const deleteChannel = createAsyncThunk(
  "chat/deleteChannel",
  async (
    { channelId, userId }: { channelId: string; userId: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(`${BASE_URL}/api/channels/${channelId}?userId=${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || "No puedes borrar este canal.");
      return channelId;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const leaveChannel = createAsyncThunk(
  "chat/leaveChannel",
  async ({ channelId, userId }: { channelId: string; userId: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/channels/${channelId}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al salir del canal");
      }

      return channelId;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveChannel: (state, action: PayloadAction<Channel>) => {
      state.activeChannel = action.payload;
      state.unreadChannels = state.unreadChannels.filter((id) => id !== action.payload._id);
      if (action.payload.members) {
        const memberIds = action.payload.members as unknown as string[];
        state.unreadUsers = state.unreadUsers.filter((id) => !memberIds.includes(id));
      }
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    addMessage: (
      state,
      action: PayloadAction<Message | { message: Message; currentUserId?: string }>
    ) => {
      const message =
        "message" in action.payload && action.payload.message
          ? action.payload.message
          : (action.payload as Message);

      const currentUserId =
        "currentUserId" in action.payload ? action.payload.currentUserId : undefined;

      if (!message) return;

      const incomingChannelId =
        typeof message.channelId === "object"
          ? (message.channelId as any)._id
          : message.channelId;

      if (state.activeChannel?._id === incomingChannelId) {
        if (!state.messages.some((m) => m._id === message._id)) {
          state.messages.push(message);
        }
      } else {
        // Identificar si el mensaje proviene de un DM o un Canal regular
        const targetChannel = state.channels.find((c) => c._id === incomingChannelId);
        const isDirect = targetChannel?.isDirect || (message as any).isDirect;

        if (isDirect) {
          // Solo notificar en la lista de contactos si es DM
          const senderId =
            typeof message.sender === "object" ? message.sender._id : message.sender;

          if (
            senderId &&
            currentUserId &&
            senderId !== currentUserId &&
            !state.unreadUsers.includes(senderId)
          ) {
            state.unreadUsers.push(senderId);
          }
        } else {
          // Solo notificar en la lista de canales si es canal de grupo
          if (!state.unreadChannels.includes(incomingChannelId)) {
            state.unreadChannels.push(incomingChannelId);
          }
        }
      }
    },
    addChannelFromSocket: (state, action: PayloadAction<Channel>) => {
      if (!state.channels.some((c) => c._id === action.payload._id)) {
        state.channels.unshift(action.payload);
      }
    },
    removeChannelFromSocket: (state, action: PayloadAction<string>) => {
      const deletedId = action.payload;
      state.channels = state.channels.filter((c) => c._id !== deletedId);

      if (state.activeChannel?._id === deletedId) {
        state.activeChannel = state.channels[0] || null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.channels = action.payload;
        if (action.payload.length > 0 && !state.activeChannel) {
          state.activeChannel = action.payload[0];
        }
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.channels.unshift(action.payload);
        state.activeChannel = action.payload;
      })
      .addCase(addMemberByTag.fulfilled, (state, action) => {
        state.channels = state.channels.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
        if (state.activeChannel?._id === action.payload._id) {
          state.activeChannel = action.payload;
        }
      })
      .addCase(deleteChannel.fulfilled, (state, action) => {
        state.channels = state.channels.filter((c) => c._id !== action.payload);
        if (state.activeChannel?._id === action.payload) {
          state.activeChannel = state.channels[0] || null;
        }
      })
      .addCase(leaveChannel.fulfilled, (state, action) => {
        state.channels = state.channels.filter((c) => c._id !== action.payload);
        if (state.activeChannel?._id === action.payload) {
          state.activeChannel = state.channels[0] || null;
        }
      });
  },
});

export const {
  setActiveChannel,
  setMessages,
  addMessage,
  addChannelFromSocket,
  removeChannelFromSocket,
} = chatSlice.actions;
export default chatSlice.reducer;