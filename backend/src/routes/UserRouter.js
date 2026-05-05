import express from "express";
import {
  DeleteSavedTrail,
  GetDashboard,
  GetMyImpact,
  GetProfile,
  GetSavedTrailById,
  GetSavedTrails,
} from "../controller/UserController.js";
import { authenticateToken } from "../middleware/auth.js";

const Userrouter = express.Router();

Userrouter.get("/", (_req, res) => {
  res.send(" user route is up");
});

Userrouter.get("/profile", authenticateToken, GetProfile);
Userrouter.get("/dashboard", authenticateToken, GetDashboard);
Userrouter.get("/impact", authenticateToken, GetMyImpact);
Userrouter.get("/trails", authenticateToken, GetSavedTrails);
Userrouter.get("/trails/:id", authenticateToken, GetSavedTrailById);
Userrouter.delete("/trails/:id", authenticateToken, DeleteSavedTrail);

export default Userrouter;
