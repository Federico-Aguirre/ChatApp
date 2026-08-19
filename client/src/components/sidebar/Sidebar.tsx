import { useState, useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  setActiveChannel,
  createChannel,
  deleteChannel,
  leaveChannel,
} from "../../store/slices/chatSlice";
import { logout } from "../../store/slices/authSlice";
import { socket } from "../../socket";
import { User } from "../../types/chat";
import { ChannelList } from "./ChannelList";
import { ContactList } from "./ContactList";
import { UserProfile } from "./UserProfile";
import { CreateChannelModal } from "./CreateChannelModal";
import { AddContactModal } from "./AddContactModal";

export const Sidebar = () => {
  const dispatch = useAppDispatch();

  const tokenFromRedux = useAppSelector((state) => state.auth.token);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { channels, activeChannel, unreadChannels, unreadUsers } = useAppSelector(
    (state) => state.chat
  );

  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contacts, setContacts] = useState<User[]>([]);

  const userId = currentUser?._id || (currentUser as unknown as { id: string })?.id;

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchContacts = useCallback(async () => {
    const token = tokenFromRedux || localStorage.getItem("token");

    if (!userId || !token || token === "null" || token === "undefined") return;

    try {
      const res = await fetch(`${API_URL}/api/channels/direct/api/users/contacts/${userId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data: User[] = await res.json();
        setContacts((prev) => {
          const map = new Map<string, User>();
          prev.forEach((c) => {
            const idStr = c._id ? c._id.toString() : (c as any).id?.toString();
            if (idStr) map.set(idStr, c);
          });
          data.forEach((c) => {
            const idStr = c._id ? c._id.toString() : (c as any).id?.toString();
            if (idStr) map.set(idStr, c);
          });
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.error("[Sidebar] Error al obtener contactos:", err);
    }
  }, [userId, tokenFromRedux]);

  useEffect(() => {
    if (userId) {
      fetchContacts();
    }
  }, [userId, fetchContacts]);

  const addContactIfMissing = useCallback(
    (candidate: any) => {
      if (!candidate || typeof candidate !== "object") return;

      const candidateIdStr = candidate._id ? candidate._id.toString() : candidate.id?.toString();
      const currentUserIdStr = userId?.toString();

      if (candidateIdStr && candidateIdStr !== currentUserIdStr) {
        setContacts((prev) => {
          const exists = prev.some((c) => {
            const cId = c._id ? c._id.toString() : (c as any).id?.toString();
            return cId === candidateIdStr;
          });
          if (!exists) {
            return [...prev, candidate as User];
          }
          return prev;
        });
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!socket || !userId) return;

    const currentUserIdStr = userId.toString();

    const joinUserRoom = () => {
      socket.emit("join_user", currentUserIdStr);
    };

    if (socket.connected) {
      joinUserRoom();
    } else {
      socket.connect();
    }

    socket.on("connect", joinUserRoom);

    const handleContactAdded = (data: any) => {
      if (data) addContactIfMissing(data);
      fetchContacts();
    };

    const handleReceiveMessage = (data: any) => {
      if (data?.channelId) {
        const chanId = typeof data.channelId === "object" ? data.channelId._id : data.channelId;
        if (chanId) socket.emit("join_channel", chanId.toString());
      }
      if (data?.sender) {
        addContactIfMissing(data.sender);
      }
      fetchContacts();
    };

    const handleNewChannel = (data: any) => {
      if (data?._id) {
        socket.emit("join_channel", data._id.toString());
      }
      if (data?.members && Array.isArray(data.members)) {
        data.members.forEach((m: any) => addContactIfMissing(m));
      }
      fetchContacts();
    };

    socket.on("contact_added", handleContactAdded);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("new_channel", handleNewChannel);

    return () => {
      socket.off("connect", joinUserRoom);
      socket.off("contact_added", handleContactAdded);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("new_channel", handleNewChannel);
    };
  }, [userId, addContactIfMissing, fetchContacts]);

  const handleSelectContact = async (contact: User) => {
    const token = tokenFromRedux || localStorage.getItem("token");
    const myUserId = currentUser?._id || (currentUser as any)?.id;

    if (!token || !contact._id || !myUserId) return;

    try {
      const res = await fetch(`${API_URL}/api/channels/direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentUserId: myUserId,
          targetUserId: contact._id,
        }),
      });

      if (res.ok) {
        const directChannel = await res.json();
        socket.emit("join_channel", directChannel._id);
        dispatch(
          setActiveChannel({
            ...directChannel,
            name: contact.name || "Chat Privado",
          })
        );
      }
    } catch (err) {
      console.error("Error al seleccionar contacto:", err);
    }
  };

  const handleAddContact = async (userTag: string): Promise<string | void> => {
    const token = tokenFromRedux || localStorage.getItem("token");
    if (!userId || !token) return "Debes iniciar sesión nuevamente";

    try {
      const res = await fetch(`${API_URL}/api/users/add-contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, userTag, contactTag: userTag }),
      });

      const data = await res.json();
      if (!res.ok) return data.message || "Error al agregar contacto";

      setContacts((prev) => {
        const exists = prev.some((c) => c._id?.toString() === data.contact._id?.toString());
        return exists ? prev : [...prev, data.contact];
      });
    } catch (err) {
      return "Error de conexión";
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    const token = tokenFromRedux || localStorage.getItem("token");
    if (!userId || !token) return;

    try {
      const res = await fetch(`${API_URL}/api/users/remove-contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, contactId }),
      });

      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c._id?.toString() !== contactId.toString()));
      }
    } catch (err) {
      console.error("Error al eliminar contacto:", err);
    }
  };

  const handleDeleteOrLeaveChannel = (channelId: string) => {
    if (!userId) return;

    const targetChannel = channels.find((c) => c._id === channelId);
    if (!targetChannel) return;

    const creatorId =
      typeof targetChannel.createdBy === "object"
        ? (targetChannel.createdBy as any)?._id
        : targetChannel.createdBy;

    const isCreator = creatorId === userId;

    if (isCreator) {
      if (confirm(`¿Estás seguro de que deseas eliminar el canal "${targetChannel.name}"?`)) {
        dispatch(deleteChannel({ channelId, userId }));
      }
    } else {
      if (confirm(`¿Deseas salir del canal "${targetChannel.name}"?`)) {
        dispatch(leaveChannel({ channelId, userId }));
      }
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <h1 className="font-bold text-white text-lg tracking-wide">ChatApp</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <ChannelList
          channels={channels}
          activeChannel={activeChannel}
          onSelectChannel={(c) => dispatch(setActiveChannel(c))}
          onDeleteChannel={handleDeleteOrLeaveChannel}
          onOpenCreateModal={() => setShowChannelModal(true)}
          unreadChannels={unreadChannels}
          currentUser={currentUser}
        />

        <ContactList
          contacts={contacts}
          onRemoveContact={handleRemoveContact}
          onOpenAddModal={() => setShowContactModal(true)}
          onSelectContact={handleSelectContact}
          unreadUsers={unreadUsers}
        />
      </div>

      <UserProfile currentUser={currentUser} onLogout={() => dispatch(logout())} />

      <CreateChannelModal
        isOpen={showChannelModal}
        onClose={() => setShowChannelModal(false)}
        onCreateChannel={(name) => userId && dispatch(createChannel({ name, createdBy: userId }))}
      />

      <AddContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        onAddContact={handleAddContact}
      />
    </aside>
  );
};