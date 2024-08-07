require("dotenv").config();
const cors = require("cors");
const express = require("express");
const connectDB = require("./src/config/db");
const mainRouter = require('./src/api/routes/mainRoutes');
const cloudinary = require('cloudinary').v2;

const app = express();
app.use(express.json());
app.use(cors());
connectDB();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

app.use('/api/v1', mainRouter);

app.use("*", (req, res, next) => {
    return res.status(404).json("Not found! ❌");
});

app.listen(8080, () => {
  console.log("http://localhost:8080 ✅");
});