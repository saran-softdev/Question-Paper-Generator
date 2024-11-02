const express = require("express");
const db = require("./config/db"); // Import the database connection
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const bodyParser = require("body-parser");

app.use(
  cors({
    origin: [
      "http://localhost:7000",
      "http://localhost:8000",
      "http://localhost:5173"
    ],
    methods: "GET,POST,PUT,DELETE",
    credentials: true
  })
);

app.use(express.json()); // Middleware to parse JSON requests

// Import and use routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 8000;
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}!`);
});
