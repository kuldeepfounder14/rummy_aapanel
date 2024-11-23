const express = require('express');
const cors = require('cors');
const session = require('express-session')
const app = express();
const bodyParser = require('body-parser');
const userRoutes = require("./routes/userRoutes")
// const roomRoutes = require("./routes/roomRoutes")
// const gameRoutes = require("./routes/gameRoutes")
const allowOrigins = [
  'http://localhost:3001',
  'http://localhost:5173',
 "https://rummyculture.couponpe.in"
];

app.use(cors({
  origin: allowOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 3600000 },
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api/users", userRoutes)
// app.use("/rummy/game", roomRoutes)
// app.use("/rummy/game", gameRoutes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

module.exports = app;
