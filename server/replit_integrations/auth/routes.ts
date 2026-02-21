import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import bcrypt from "bcryptjs";
import passport from "passport";

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      if (req.user.authMethod === "email") {
        userId = req.user.userId;
      } else {
        userId = req.user.claims.sub;
      }
      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const existing = await authStorage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await authStorage.upsertUser({
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        provider: "email",
        role: "user",
        isAdmin: false,
      });

      req.login(
        { userId: user.id, authMethod: "email" },
        (err: any) => {
          if (err) {
            console.error("Login error after register:", err);
            return res.status(500).json({ message: "Registration succeeded but login failed" });
          }
          const { passwordHash: _, ...safeUser } = user;
          return res.json(safeUser);
        }
      );
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await authStorage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.login(
        { userId: user.id, authMethod: "email" },
        (err: any) => {
          if (err) {
            console.error("Login error:", err);
            return res.status(500).json({ message: "Login failed" });
          }
          const { passwordHash: _, ...safeUser } = user;
          return res.json(safeUser);
        }
      );
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });
}
