import { useState, useEffect, useRef, FormEvent } from "react";
import { Hash, Send, Smile, UserPlus } from "lucide-react";
import { format } from "date-fns";
import EmojiPicker, { EmojiClickData, EmojiStyle } from "emoji-picker-react";
import { Channel, Message, User } from "../types/chat";
import { AddMemberModal } from "./sidebar/AddMemberModal";
import { useAppDispatch, useAppSelector } from "../store";
import { addMemberByTag } from "../store/slices/chatSlice";

interface ChatProps {
  channel?: Channel | null;
  messages?: Message[];
  onSendMessage?: (content: string) => void;
  currentUser?: User | null;
  onAddMember?: (
    channelId: string,
    userTag: string
  ) => Promise<{ success: boolean; message?: string }>;
}

export const Chat = ({
  channel: propChannel,
  messages: propMessages,
  onSendMessage,
  currentUser: propCurrentUser,
  onAddMember,
}: ChatProps = {}) => {
  const dispatch = useAppDispatch();

  // Consumir el estado directamente desde Redux Store
  const storeChannel = useAppSelector((state) => state.chat.activeChannel);
  const storeMessages = useAppSelector((state) => state.chat.messages);
  const storeUser = useAppSelector((state) => state.auth.currentUser);

  // Utilizar props si se reciben manualmente, de lo contrario fallback al estado de Redux
  const channel = propChannel !== undefined ? propChannel : storeChannel;
  const messages = propMessages !== undefined ? propMessages : storeMessages;
  const currentUser = propCurrentUser !== undefined ? propCurrentUser : storeUser;

  const [newMessage, setNewMessage] = useState<string>("");
  const [showEmoji, setShowEmoji] = useState<boolean>(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // En Chat.tsx -> handleSubmit
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newMessage.trim() || !channel) return;

    const currentUserId = currentUser?._id || (currentUser as unknown as { id: string })?.id;

    // Despachar a Redux/Socket
    dispatch({
      type: "chat/sendMessage",
      payload: {
        channelId: channel._id,
        content: newMessage.trim(),
        senderId: currentUserId,
      },
    });

    if (onSendMessage) {
      onSendMessage(newMessage.trim());
    }

    setNewMessage("");
    setShowEmoji(false);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  const handleAddMember = async (channelId: string, userTag: string) => {
    if (onAddMember) {
      return onAddMember(channelId, userTag);
    }

    const userId = currentUser?._id || (currentUser as unknown as { id: string })?.id;
    if (!userId) return { success: false, message: "Sin sesión activa." };

    const result = await dispatch(
      addMemberByTag({ channelId, requestingUserId: userId, userTag })
    );

    if (addMemberByTag.fulfilled.match(result)) {
      return { success: true };
    }
    return {
      success: false,
      message: (result.payload as string) || "Error al agregar usuario.",
    };
  };

  if (!channel) {
    return (
      <div className="flex-1 bg-slate-900 flex items-center justify-center text-slate-500">
        Selecciona un canal para comenzar.
      </div>
    );
  }

  // Validación de permisos para botones de administración
  const currentUserId = currentUser?._id || (currentUser as unknown as { id: string })?.id;

  const createdById =
    typeof channel.createdBy === "object"
      ? (channel.createdBy as any)?._id
      : channel.createdBy;

  const isCreator = Boolean(
    currentUserId &&
      createdById &&
      currentUserId.toString() === createdById.toString()
  );

  const isAdmin = Boolean(
    isCreator ||
      channel.admins?.some((admin) => {
        const adminId = typeof admin === "object" ? (admin as any)._id : admin;
        return adminId?.toString() === currentUserId?.toString();
      })
  );



  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-900 text-slate-100">
      {/* Header del Canal */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-2">
          <Hash className="text-indigo-400" size={22} />
          <div>
            <h2 className="text-base font-bold text-white tracking-wide leading-tight">
              {channel.name}
            </h2>
            {channel.description && (
              <p className="text-xs text-slate-400">{channel.description}</p>
            )}
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow"
          >
            <UserPlus size={16} />
            <span>Agregar personas</span>
          </button>
        )}
      </div>

      {/* Lista de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isMe = message.sender?._id === currentUser?._id;
          const senderName = message.sender?.name || "Anónimo";
          const timeFormatted = message.createdAt
            ? format(new Date(message.createdAt), "HH:mm")
            : "";

          return (
            <div
              key={message._id || index}
              className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-700 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                {senderName[0]?.toUpperCase()}
              </div>

              <div
                className={`flex flex-col max-w-[80%] ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`flex items-baseline gap-2 mb-1 ${
                    isMe ? "flex-row-reverse" : ""
                  }`}
                >
                  <span className="text-xs font-semibold text-slate-300">
                    {isMe ? "Tú" : senderName}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {timeFormatted}
                  </span>
                </div>

                <div
                  className={`px-4 py-2.5 rounded-2xl shadow-md text-sm wrap-break-words ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Entrada de texto y emojis */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/40 relative">
        {showEmoji && (
        <div className="absolute bottom-20 right-4 z-50 shadow-2xl">
          <EmojiPicker 
            onEmojiClick={handleEmojiClick} 
            theme={"dark" as any} 
            emojiStyle={EmojiStyle.NATIVE}
            autoFocusSearch={false} // Previne que el picker le robe el foco al input principal
          />
        </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Enviar mensaje a #${channel.name}`}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-800 text-white border border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 transition text-sm placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
            >
              <Smile size={20} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium p-2.5 rounded-xl transition shadow-md shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        channel={channel}
        onAddMember={handleAddMember}
      />
    </div>
  );
};