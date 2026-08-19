import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const router = Router();

// Middleware flexible para verificar autenticación
const authenticate = (req: any, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token && token !== "null" && token !== "undefined") {
      try {
        const secret = process.env.JWT_SECRET || "secreto";
        const decoded = jwt.verify(token, secret) as { userId?: string; id?: string };
        req.userId = decoded.userId || decoded.id;
        return next();
      } catch (err) {
        // Token falló, se intenta utilizar el body si viene definido
      }
    }
  }

  if (req.body && (req.body.userId || req.body.currentUserId)) {
    req.userId = req.body.userId || req.body.currentUserId;
    return next();
  }

  return res.status(401).json({ message: "Autenticación requerida" });
};

// GET /api/users - Obtener lista global de usuarios (sin contraseñas)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const users = await User.find({}, "-password");
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

// POST /api/users/add-contact - Agregar contacto por Nombre#1234 o Tag
router.post("/add-contact", authenticate, async (req: any, res: Response) => {
  try {
    const { contactTag, targetTag, username, discriminator, tag: inputTag, userTag, userId: bodyUserId } = req.body;
    
    // Obtener el ID del usuario desde el middleware (varias alternativas) o el body
    const currentUserId = req.userId || req.user?._id || req.user?.id || bodyUserId;

    if (!currentUserId) {
      return res.status(401).json({ message: "No se pudo autenticar la sesión del usuario." });
    }

    let searchName = "";
    let searchDiscriminator = "";

    const rawTag = contactTag || targetTag || inputTag || userTag;
    if (rawTag && typeof rawTag === "string" && rawTag.includes("#")) {
      const parts = rawTag.split("#");
      searchName = parts[0].trim();
      searchDiscriminator = parts[1].trim();
    } else if (username && discriminator) {
      searchName = String(username).trim();
      searchDiscriminator = String(discriminator).trim();
    } else {
      return res.status(400).json({ message: "Usa el formato completo: Nombre#1234" });
    }

    const targetUser = await User.findOne({
      name: { $regex: new RegExp(`^${searchName}$`, "i") },
      discriminator: searchDiscriminator,
    });

    if (!targetUser) {
      return res.status(404).json({ message: "Usuario no encontrado. Revisa el Nombre y el #Tag." });
    }

    if (targetUser._id.toString() === currentUserId.toString()) {
      return res.status(400).json({ message: "No puedes agregarte a ti mismo." });
    }

    // Agregar mutuamente en la base de datos sin duplicar
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { contacts: targetUser._id },
    });

    await User.findByIdAndUpdate(targetUser._id, {
      $addToSet: { contacts: currentUserId },
    });

    const currentUserInfo = await User.findById(currentUserId).select(
      "name email avatar discriminator status"
    );

    // Notificar por WebSocket al usuario remoto
    const io = req.app.get("io");
    if (io && currentUserInfo) {
      io.to(targetUser._id.toString()).emit("contact_added", currentUserInfo);
    }

    return res.json({
      message: "Contacto agregado con éxito",
      contact: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        avatar: targetUser.avatar,
        discriminator: targetUser.discriminator,
        status: targetUser.status,
      },
    });
  } catch (error: any) {
    console.error("Error al agregar contacto:", error);
    return res.status(500).json({ message: "Error interno al agregar contacto" });
  }
});

// POST /api/users/remove-contact - Eliminar contacto de la lista personal
router.post("/remove-contact", authenticate, async (req: any, res: Response) => {
  try {
    const { contactId } = req.body;
    const currentUserId = req.userId;

    if (!contactId) {
      return res.status(400).json({ message: "ID de contacto requerido" });
    }

    // Remover únicamente de la lista de contactos del usuario actual
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { contacts: contactId },
    });

    return res.json({ message: "Contacto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar contacto:", error);
    return res.status(500).json({ message: "Error interno al eliminar contacto" });
  }
});

// GET /api/users/contacts - Obtener contactos del token activo
router.get("/contacts", authenticate, async (req: any, res: Response) => {
  try {
    const currentUser = await User.findById(req.userId).populate(
      "contacts",
      "name email avatar discriminator status"
    );

    if (!currentUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.json(currentUser.contacts || []);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener la lista de contactos" });
  }
});

// GET /api/users/contacts/:userId - Obtener contactos por ID explícito
router.get("/contacts/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const targetUser = await User.findById(userId).populate(
      "contacts",
      "name email avatar discriminator status"
    );

    if (!targetUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.json(targetUser.contacts || []);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener la lista de contactos" });
  }
});

export default router;