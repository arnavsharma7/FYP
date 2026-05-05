import express from "express";
import {
  DeleteAdminExperience,
  GetAdminAnalytics,
  GetAdminExperiences,
  GetAdminSummary,
  GetAdminUsers,
  UpdateExperienceApproval,
} from "../controller/AdminController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const Adminrouter = express.Router();

Adminrouter.use(authenticateToken, authorizeRoles("admin"));

Adminrouter.get("/summary", GetAdminSummary);
Adminrouter.get("/users", GetAdminUsers);
Adminrouter.get("/experiences", GetAdminExperiences);
Adminrouter.patch("/experiences/:id/approval", UpdateExperienceApproval);
Adminrouter.delete("/experiences/:id", DeleteAdminExperience);
Adminrouter.get("/analytics", GetAdminAnalytics);

export default Adminrouter;
