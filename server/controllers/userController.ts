import { Request, Response } from "express";
import User from "../models/User";

export const getContacts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate(
      "contacts",
      "name email status avatar discriminator"
    );
    res.json(user?.contacts || []);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener contactos", error });
  }
};

// Agregar contacto mediante Tag (ej. Juan#4821)
export const addContact = async (req: Request, res: Response) => {
  try {
    const { userId, userTag } = req.body; // userTag ej: "Juan#4821"

    if (!userTag.includes("#")) {
      return res.status(400).json({
        message: "Formato inválido. Usa el formato Nombre#0000",
      });
    }

    const [name, discriminator] = userTag.split("#");

    // Búsqueda insensible a mayúsculas/minúsculas para el nombre
    const targetUser = await User.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      discriminator: discriminator.trim(),
    });

    if (!targetUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (targetUser._id.toString() === userId) {
      return res.status(400).json({ message: "No puedes agregarte a ti mismo" });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { contacts: targetUser._id },
    });

    res.json({
      message: "Contacto agregado con éxito",
      contact: {
        _id: targetUser._id,
        name: targetUser.name,
        discriminator: targetUser.discriminator,
        status: targetUser.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error al agregar contacto", error });
  }
};

export const removeContact = async (req: Request, res: Response) => {
  try {
    const { userId, contactId } = req.body;
    await User.findByIdAndUpdate(userId, {
      $pull: { contacts: contactId },
    });
    res.json({ message: "Contacto eliminado", contactId });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar contacto", error });
  }
};