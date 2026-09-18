const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Flexible CORS: allows requests from file://, localhost, and Vercel
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// Root health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Login API is running." });
});

// Register endpoint
app.post("/api/register", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database is not connected yet. Please check MONGODB_URI in Render environment variables.",
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields (name, email, password) are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ message: "This email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Registration successful! You can now log in." });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database is not connected yet. Please check MONGODB_URI in Render environment variables.",
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// Protected profile endpoint
app.get("/api/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized. Token missing." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.json({
      message: "Protected user profile data retrieved.",
      user: {
        name: decoded.name,
        email: decoded.email,
      },
    });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired session token." });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

if (!process.env.MONGODB_URI) {
  console.error("CRITICAL ERROR: MONGODB_URI environment variable is missing in Render settings!");
} else {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("MongoDB Atlas connected successfully.");
    })
    .catch((error) => {
      console.error("MongoDB Atlas connection failed:", error.message);
    });
}
