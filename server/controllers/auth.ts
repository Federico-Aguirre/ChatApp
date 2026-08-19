import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/User";

const googleClient = new OAuth2Client();

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!credential) {
      return res.status(400).json({ message: "Falta el token de Google" });
    }

    if (!clientId) {
      console.error("❌ ERROR: GOOGLE_CLIENT_ID no está definido en el .env del servidor");
      return res.status(500).json({ message: "Error interno de configuración" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Payload de Google inválido" });
    }

    const { email, name, picture } = payload;
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const randomDiscriminator = Math.floor(1000 + Math.random() * 9000).toString();

      user = new User({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        password: `google_oauth_${Date.now()}_${Math.random()}`,
        avatar: picture || "",
        discriminator: randomDiscriminator,
      });

      await user.save();
    } else if (!user.discriminator) {
      user.discriminator = Math.floor(1000 + Math.random() * 9000).toString();
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "secreto",
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        discriminator: user.discriminator,
      },
    });
  } catch (error: any) {
    console.error("❌ ERROR EXACTO DE GOOGLE:", error.message);
    return res.status(400).json({ message: error.message });
  }
};