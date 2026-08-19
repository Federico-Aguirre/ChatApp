import { Router } from "express";
import { Channel } from "../models/Channel";
import User from "../models/User"; 
import jwt from "jsonwebtoken";

const router = Router();

// Obtener canales de un usuario (GET /) - Excluye chats directos para no duplicar en la UI
router.get("/", async (req, res) => {
  const { userId } = req.query;
  try {
    if (!userId) {
      return res.status(400).json({ message: "Se requiere userId" });
    }
    
    // Busca los canales del usuario EXCLUYENDO los de chat directo (direct_)
    const channels = await Channel.find({ 
      members: userId,
      name: { $not: /^direct_/ }
    })
    .populate("members", "name email avatar status discriminator")
    .populate("createdBy", "name email")
    .sort({ updatedAt: -1 });
    
    res.json(channels);
  } catch (err) {
    console.error("Error al obtener canales:", err);
    res.status(500).json({ message: "Error al obtener canales" });
  }
});

// Crear o recuperar canal directo 1 a 1 (POST /direct)
router.post("/direct", async (req, res) => {
  const { currentUserId, contactId, userId, recipientId, targetUserId } = req.body;

  // Obtener ID del usuario emisor (del body o decodificando el Token)
  let user1 = currentUserId || userId;
  if (!user1) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET || "secreto";
        const decoded = jwt.verify(token, secret) as { userId?: string; id?: string };
        user1 = decoded.userId || decoded.id;
      } catch (e) {
        // Token inválido o expirado
      }
    }
  }

  // Obtener ID del usuario receptor
  const user2 = contactId || recipientId || targetUserId;

  if (!user1 || !user2) {
    return res.status(400).json({ message: "Faltan IDs para el chat directo" });
  }

  try {
    const sortedIds = [user1.toString(), user2.toString()].sort();
    const channelName = `direct_${sortedIds[0]}_${sortedIds[1]}`;

    let channel = await Channel.findOne({ name: channelName });

    if (!channel) {
      channel = new Channel({
        name: channelName,
        isPrivate: true,
        createdBy: user1,
        admins: [user1, user2],
        members: [user1, user2],
      });
      await channel.save();
    } else {
      // Re-vincular a ambos usuarios como miembros por si alguno fue removido
      const currentMemberIds = channel.members.map((m) => m.toString());
      let modified = false;

      if (!currentMemberIds.includes(user1.toString())) {
        channel.members.push(user1 as any);
        modified = true;
      }
      if (!currentMemberIds.includes(user2.toString())) {
        channel.members.push(user2 as any);
        modified = true;
      }
      if (modified) {
        await channel.save();
      }
    }

    // Poblar la información de los miembros antes de responder al cliente
    const populatedChannel = await Channel.findById(channel._id)
      .populate("members", "name email avatar status discriminator")
      .populate("createdBy", "name email");

    res.json(populatedChannel || channel);
  } catch (err) {
    console.error("Error al gestionar chat directo:", err);
    res.status(500).json({ message: "Error al abrir chat directo" });
  }
});

// Crear canal de grupo (POST /)
router.post("/", async (req, res) => {
  const { name, isPrivate, createdBy } = req.body;
  try {
    const newChannel = new Channel({
      name,
      isPrivate: isPrivate || false,
      createdBy,
      admins: [createdBy],
      members: [createdBy],
    });
    await newChannel.save();

    const populatedChannel = await Channel.findById(newChannel._id)
      .populate("members", "name email avatar status discriminator")
      .populate("createdBy", "name email");

    res.status(201).json(populatedChannel || newChannel);
  } catch (err) {
    console.error("Error al crear canal:", err);
    res.status(500).json({ message: "Error al crear canal" });
  }
});

// Eliminar canal (SOLO EL CREADOR)
router.delete("/:id", async (req, res) => {
  try {
    const channelId = req.params.id;
    const { userId } = req.query;

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Canal no encontrado" });

    // Verificar si es el creador
    if (channel.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "No tienes permiso para borrar este canal" });
    }

    // Guardar lista de miembros antes de borrar
    const memberIds = channel.members.map((m) => m.toString());

    await Channel.findByIdAndDelete(channelId);

    // Emitir WebSocket a todos los miembros y a la sala del canal
    const io = req.app.get("io");
    if (io) {
      io.to(channelId).emit("channel_deleted", channelId);

      memberIds.forEach((mId) => {
        io.to(mId).emit("channel_deleted", channelId);
      });
    }

    res.json({ message: "Canal eliminado correctamente", channelId });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar el canal" });
  }
});

// Agregar miembro por etiqueta (SOLO ADMINISTRADORES)
router.post("/:id/members", async (req, res) => {
  const { requestingUserId, userTag } = req.body;

  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: "Canal no encontrado" });
    }

    if (!userTag || typeof userTag !== "string") {
      return res.status(400).json({ message: "Ingresa una etiqueta válida" });
    }

    // Limpiar el texto ingresado
    const cleanTag = userTag.trim().replace(/^[@]/, "").trim();

    // Si viene en formato "Nombre#1234", extrae la parte del nombre ("Nombre")
    const parts = cleanTag.split("#");
    const baseName = parts[0].trim();

    // Crear expresiones regulares de búsqueda
    const escapedFullTag = cleanTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const fullRegex = new RegExp(`^${escapedFullTag}$`, "i");

    const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const baseNameRegex = new RegExp(`^${escapedBaseName}$`, "i");

    // Busca coincidencia en la base de datos
    const targetUser = await User.findOne({
      $or: [
        { tag: fullRegex },
        { userTag: fullRegex },
        { name: fullRegex },
        { username: fullRegex },
        { email: cleanTag.toLowerCase() },
        { name: baseNameRegex },
        { username: baseNameRegex },
        ...(cleanTag.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanTag }] : []),
      ],
    });

    if (!targetUser) {
      return res.status(404).json({ message: "No se encontró ningún usuario con esa etiqueta" });
    }

    // Validar si el usuario que realiza la solicitud es admin
    const isAdmin = channel.admins.some((id) => id.toString() === requestingUserId);
    if (!isAdmin) {
      return res.status(403).json({ message: "Solo los administradores pueden agregar miembros" });
    }

    // Valida si ya es miembro
    const isAlreadyMember = channel.members.some(
      (m) => m.toString() === targetUser._id.toString()
    );
    if (isAlreadyMember) {
      return res.status(400).json({ message: "El usuario ya es miembro de este canal" });
    }

    // Agregar al canal y guardar
    channel.members.push(targetUser._id as any);
    await channel.save();

    // Poblar los datos del canal para enviarlo completo al frontend
    const populatedChannel = await Channel.findById(channel._id)
      .populate("members", "name email avatar status discriminator")
      .populate("createdBy", "name email");

    const finalChannelData = populatedChannel || channel;

    // Emitir Socket al usuario agregado
    const io = req.app.get("io");
    if (io) {
      io.to(targetUser._id.toString()).emit("new_channel", finalChannelData);
    }

    res.json(finalChannelData);
  } catch (err) {
    console.error("Error interno al agregar miembro:", err);
    res.status(500).json({ message: "Error interno en el servidor al agregar miembro" });
  }
});

// Borrar miembro (SOLO ADMINISTRADORES)
router.delete("/:id/members/:memberId", async (req, res) => {
  const { requestingUserId } = req.body;
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: "Canal no encontrado" });

    const isAdmin = channel.admins.some((id) => id.toString() === requestingUserId);
    if (!isAdmin) {
      return res.status(403).json({ message: "Solo los administradores pueden borrar personas" });
    }

    channel.members = channel.members.filter((id) => id.toString() !== req.params.memberId);
    await channel.save();
    res.json(channel);
  } catch (err) {
    console.error("Error al eliminar miembro:", err);
    res.status(500).json({ message: "Error al eliminar miembro" });
  }
});

// Salir de un canal (POST /:id/leave)
router.post("/:id/leave", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "ID de usuario requerido" });
  }

  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: "Canal no encontrado" });
    }

    channel.members = channel.members.filter(
      (m) => m.toString() !== userId.toString()
    );
    channel.admins = channel.admins.filter(
      (a) => a.toString() !== userId.toString()
    );

    await channel.save();

    res.json({ message: "Has salido del canal con éxito", channelId: channel._id });
  } catch (err) {
    console.error("Error al salir del canal:", err);
    res.status(500).json({ message: "Error interno al salir del canal" });
  }
});

export default router;