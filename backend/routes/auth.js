import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user)
    return res
      .status(400)
      .json({ msg: "Korisničko ime ili lozinka neispravni" });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch)
    return res
      .status(400)
      .json({ msg: "Korisničko ime ili lozinka neispravni" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

export default router;
