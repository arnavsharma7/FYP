
import express from "express";
import {
  GetExperienceById,
  GetExperienceCategories,
  GetExperiences,
  GetProviderDashboard,
  GetProviderLatestReviews,
  InitExperiences,
  createProviderExperience
} from "../controller/ExperincesController.js";

import uploadMiddleware from "../middleware/uploadMiddleware.js"

import { authenticateToken } from "../middleware/auth.js";

const Experincesrouter = express.Router();


Experincesrouter.get("/", GetExperiences);
Experincesrouter.get("/categories", GetExperienceCategories);
Experincesrouter.get("/init", InitExperiences);
Experincesrouter.post("/init", InitExperiences);
Experincesrouter.get("/provider/dashboard", authenticateToken, GetProviderDashboard);
Experincesrouter.get("/provider/reviews/latest", authenticateToken, GetProviderLatestReviews);
Experincesrouter.post("/provider", authenticateToken, uploadMiddleware("experiences").single("thumbnail"), createProviderExperience);
Experincesrouter.get("/:id", GetExperienceById);



export default Experincesrouter;
