import express from "express";
import {
  GenerateTrail,
  GetFeaturedTrails,
  GetMyTrails,
  GetTrailById,
  GetTrails,
} from "../controller/TrialController.js";

const Trialsrouter = express.Router();

Trialsrouter.get("/", GetTrails);
Trialsrouter.get("/featured", GetFeaturedTrails);
Trialsrouter.get("/mine", GetMyTrails);
Trialsrouter.post("/generate", GenerateTrail);
Trialsrouter.get("/:id", GetTrailById);

export default Trialsrouter;
