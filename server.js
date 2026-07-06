// require("dotenv").config();
// const express = require("express");
// const session = require("express-session");
// const path = require("path");

// const app = express();

// // Middleware
// app.use(express.json());
// app.use(express.static(path.join(__dirname, "public")));

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
//   }),
// );

// // Routes (we'll fill these in next)
// app.use("/api/auth", require("./routes/auth"));
// app.use("/api/webauthn", require("./routes/webauthn"));

// // Start server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });

// // Home route
// app.get("/", (req, res) => {
//   res.redirect("/register.html");
// });

require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();

// Railway/proxy support
app.set("trust proxy", 1);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "local_dev_secret_change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

// Home route
app.get("/", (req, res) => {
  res.redirect("/register.html");
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/webauthn", require("./routes/webauthn"));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
