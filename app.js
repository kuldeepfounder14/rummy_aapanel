const express = require('express');
const cors = require('cors');
const session = require('express-session')
const app = express();
const bodyParser = require('body-parser');
const userRoutes = require("./routes/userRoutes")
const authenticateAndRefreshToken = require('./middleware/authMiddleware');

const allowOrigins = [
  'http://localhost:3000',
  "http://rummyculture.couponpe.in",
 "https://rummyculture.couponpe.in",
];

app.use(cors({
  origin: allowOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// rolling session expiry
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 2*24*60 * 60 * 1000 }, // 2 days
}));

// Secure all API routes with the middleware
app.use(authenticateAndRefreshToken);
// all routes
app.use("/api/users", userRoutes)

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

module.exports = app;
