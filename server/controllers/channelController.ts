import { Request, Response } from "express";
import { Channel } from "../models/Channel";
import Message from "../models/Message";

// Obtener canales públicos o en los que participa/creó el usuario
export const getChannels = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    const baseFilter = { isDirect: { $ne: true } };

    const query = userId
      ? {
          ...baseFilter,
          $or: [
            { isPrivate: false },
            { isPrivate: { $exists: false } },
            { members: userId },
            { createdBy: userId },
          ],
        }
      : {
          ...baseFilter,
          $or: [{ isPrivate: false }, { isPrivate: { $exists: false } }],
        };

    const channels = await Channel.find(query).populate(
      "members",
      "name email status avatar"
    );
    res.json(channels);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener canales", error });
  }
};

// Crear un nuevo canal
export const createChannel = async (req: Request, res: Response) => {
  try {
    const { name, description, isDirect, isPrivate, createdBy, members } = req.body;

    const initialMembers = members || [];
    if (createdBy && !initialMembers.includes(createdBy)) {
      initialMembers.push(createdBy);
    }

    const newChannel = new Channel({
      name,
      description: description || "",
      isDirect: isDirect || false,
      isPrivate: isPrivate !== undefined ? isPrivate : true,
      createdBy,
      members: initialMembers,
    });

    await newChannel.save();

    const populatedChannel = await Channel.findById(newChannel._id).populate(
      "members",
      "name email status avatar"
    );

    res.status(201).json(populatedChannel);
  } catch (error) {
    res.status(500).json({ message: "Error al crear canal", error });
  }
};

// Eliminar canal y sus mensajes
export const deleteChannel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json({ message: "Canal no encontrado" });
    }

    // Evitar la eliminación del canal principal
    if (channel.name.toLowerCase() === "general") {
      return res.status(400).json({ message: "No se puede eliminar el canal #general" });
    }

    await Channel.findByIdAndDelete(id);
    await Message.deleteMany({ channelId: id });

    res.json({ message: "Canal y mensajes eliminados correctamente", channelId: id });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el canal", error });
  }
};