
import express from "express";
import {
  GetImpactDistribution,
  GetImpactStats,
} from "../controller/ImpactController.js";

const ImpactRouter = express.Router();


ImpactRouter.get("/", (req, res) => {
  res.send(" impact route is up");
});
ImpactRouter.get("/stats", GetImpactStats);
ImpactRouter.get("/distribution", GetImpactDistribution);


export default ImpactRouter;
