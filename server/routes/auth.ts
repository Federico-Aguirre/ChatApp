import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { googleLogin } from "../controllers/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// Registro Tradicional
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: "Todos los campos son obligatorios" });
      return;
    }

    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ message: "El usuario ya existe" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generar discriminador de 4 dígitos por si tu esquema de Mongoose lo exige
    const discriminator = Math.floor(1000 + Math.random() * 9000).toString();

    user = new User({
      name,
      email,
      password: hashedPassword,
      discriminator,
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        discriminator: user.discriminator,
      },
    });
  } catch (err: any) {
    console.error("[Auth Route Error - /register]:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

// Login Tradicional
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "Credenciales inválidas" });
      return;
    }

    if (!user.password) {
      res.status(400).json({ message: "Inicia sesión con Google para esta cuenta" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Credenciales inválidas" });
      return;
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err: any) {
    console.error("[Auth Route Error - /login]:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

// Login con Google
router.post("/google", googleLogin);

export default router;