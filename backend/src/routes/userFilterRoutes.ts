import express from "express";
import { getFilteredUsers } from "../services/userfilterServices";

const router = express.Router();

router.get("/users", getFilteredUsers);

export default router;
