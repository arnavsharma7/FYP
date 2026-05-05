import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/AsyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import prisma from "../utils/PrismaProvider.js";


const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET


const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN

const createAccessToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

const LoginUser = asyncHandler(async (req, res) => {
  const email = req.body?.email?.toLowerCase();
  const password = req.body?.password;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser || !existingUser.passwordHash) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    existingUser.passwordHash
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  delete existingUser.passwordHash;

  const accessToken = createAccessToken(existingUser);
  const needsProfileSetup = !existingUser.phone;


  return res.status(200).json(
    new ApiResponse(200, "User logged in successfully", {
      token: accessToken,
      accessToken,
      tokenType: "Bearer",
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      needsProfileSetup,
      user: existingUser,
    })
  );
});

const RegisterUser = asyncHandler(async (req, res) => {
  const email = req.body?.email?.toLowerCase();
  const password = req.body?.password;
  const fullName = req.body?.fullName || req.body?.full_name;
  const role = "tourist";

  if (!email || !password || !fullName) {
    throw new ApiError(400, "Email, password and full name are required");
  }

  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    throw new ApiError(409, "User with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role,
    },
  });

  delete newUser.passwordHash;

  const accessToken = createAccessToken(newUser);

  return res.status(201).json(
    new ApiResponse(201, "User registered successfully", {
      token: accessToken,
      accessToken,
      tokenType: "Bearer",
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      user: newUser,
    })
  );
});


const GoogleCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (!code) {
    throw new ApiError(400, "Missing authorization code");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    throw new ApiError(
      400,
      tokenData.error_description || "Google token exchange failed"
    );
  }

  const googleAccessToken = tokenData.access_token;

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${googleAccessToken}`,
    },
  });

  const googleUser = await userRes.json();

  if (!userRes.ok) {
    throw new ApiError(400, "Failed to fetch Google user info");
  }

  const email = googleUser.email?.toLowerCase();

  if (!email) {
    throw new ApiError(400, "Google account email not found");
  }

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId: googleUser.id },
        { email },
      ],
    },
  });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: user.googleId || googleUser.id,
        avatarUrl: googleUser.picture || user.avatarUrl,
        fullName: user.fullName || googleUser.name,
        isVerified: true,
      },
    });
    delete user.passwordHash;

    const accessToken = createAccessToken(user);

    const redirectUrl = new URL("/oauth/success", frontendUrl);

    redirectUrl.searchParams.set("token", accessToken);
    redirectUrl.searchParams.set("isNew", user.phone ? "false" : "true")

    return res.redirect(redirectUrl.toString());
  } else {
    user = await prisma.user.create({
      data: {
        email,
        googleId: googleUser.id,
        fullName: googleUser.name || "Google User",
        avatarUrl: googleUser.picture,
        isVerified: true,
        role: "tourist",
      },
    });

    const accessToken = createAccessToken(user);
    const redirectUrl = new URL("/oauth/success", frontendUrl);

    redirectUrl.searchParams.set("token", accessToken);
    redirectUrl.searchParams.set("isNew", "true")

    return res.redirect(redirectUrl.toString());
  }
});

const GoogleLoginSignup = asyncHandler(async (req, res) => {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", process.env.GOOGLE_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  res.redirect(url.toString());
});

const SetupAccountDetail = asyncHandler(async (req, res) => {
  const { phone, role } = req.body;

  if (!phone || !role) {
    throw new ApiError(400, "Phone and role are required");
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      phone,
      role,
    },
  });

  delete updatedUser.passwordHash;
  const accessToken = createAccessToken(updatedUser);

  return res.status(200).json(
    new ApiResponse(200, "Profile updated successfully", {
      token: accessToken,
      accessToken,
      tokenType: "Bearer",
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      user: updatedUser,
    })
  );
});

export { LoginUser, RegisterUser, GoogleCallback, GoogleLoginSignup, SetupAccountDetail };
