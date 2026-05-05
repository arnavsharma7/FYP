import express from "express";
import { LoginUser, RegisterUser, GoogleCallback, GoogleLoginSignup, SetupAccountDetail } from "../controller/AuthController.js";
import { authenticateToken } from "../middleware/auth.js"
import AuthMe from "../middleware/authMe.js"

const Authrouter = express.Router();


Authrouter.get("/login", (req, res) => {
  res.send("auth route is up");
});

Authrouter.post("/login", LoginUser);
Authrouter.post("/register", RegisterUser);

Authrouter.get("/google", GoogleLoginSignup)
Authrouter.get("/google/callback", GoogleCallback)
Authrouter.patch("/setupProfile", authenticateToken, SetupAccountDetail)

Authrouter.get("/me", AuthMe)


export default Authrouter;

