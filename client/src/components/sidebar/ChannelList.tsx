import { Hash, Plus, Trash2 } from "lucide-react";
import { Channel, User } from "../../types/chat";

interface ChannelListProps {
  channels: Channel[];
  activeChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onDeleteChannel: (channelId: string) => void;
  onOpenCreateModal: () => void;
  unreadChannels: string[];
  currentUser: User | null;
}

export const ChannelList = ({
  channels,
  activeChannel,
  onSelectChannel,
  onDeleteChannel,
  onOpenCreateModal,
  unreadChannels,
  currentUser,
}: ChannelListProps) => {
  const currentUserId = currentUser?._id || (currentUser as unknown as { id: string })?.id;

  return (
    <div>
      <div className="flex items-center justify-between px-2 pb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Canales
        </span>
        <button
          onClick={onOpenCreateModal}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          title="Crear canal"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="space-y-1">
        {channels.map((channel) => {
          const isActive = activeChannel?._id === channel._id;
          const hasUnread = unreadChannels.includes(channel._id) && !isActive;

          const createdById =
            typeof channel.createdBy === "object"
              ? (channel.createdBy as any)?._id
              : channel.createdBy;

          const isCreator = Boolean(
            currentUserId &&
              createdById &&
              currentUserId.toString() === createdById.toString()
          );

          return (
            <div
              key={channel._id}
              onClick={() => onSelectChannel(channel)}
              className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : hasUnread
                  ? "hover:bg-slate-800 text-white"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Hash size={18} className="shrink-0" />
                <span className={`truncate ${hasUnread ? "font-bold" : ""}`}>
                  {channel.name}
                </span>
                {hasUnread && (
                  <span className="w-2 h-2 rounded-full bg-orange-500 ml-1 animate-pulse" />
                )}
              </div>

              {/* Botón visible para todos los miembros */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChannel(channel._id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 rounded transition"
                title={isCreator ? "Eliminar canal" : "Salir del canal"}
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};