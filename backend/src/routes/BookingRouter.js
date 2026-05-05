import express from "express";
import {
  CancelMyBooking,
  CreateBooking,
  GetMyBookings,
  GetProviderBookingsDashboard,
  UpdateProviderBookingStatus,
} from "../controller/BookingController.js";
import { authenticateToken } from "../middleware/auth.js";

const Bookingrouter = express.Router();


Bookingrouter.get("/", authenticateToken, GetMyBookings);
Bookingrouter.post("/", authenticateToken, CreateBooking);
Bookingrouter.get("/provider/dashboard", authenticateToken, GetProviderBookingsDashboard);
Bookingrouter.patch("/:id/cancel", authenticateToken, CancelMyBooking);
Bookingrouter.patch("/:id/status", authenticateToken, UpdateProviderBookingStatus);


export default Bookingrouter;
