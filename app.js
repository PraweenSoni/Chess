require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const http = require("http");
const path = require("path");
const socket = require("socket.io");

require("./config/db");

const authRoutes = require("./routes/auth");
const indexRoutes = require("./routes/index");
const userProfile = require("./routes/user");

const gameSocket = require("./sockets/gameSocket");

const app = express();
const server = http.createServer(app);
const io = socket(server);

gameSocket(io);

app.set("view engine", "ejs");
// app.engine("html", require('ejs').renderFile);  " for render html and ejs both files but it will extra load on server.. so don't use"

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({ secret: 'chess-secret', resave: false, saveUninitialized: false }));

app.use("/", indexRoutes);
app.use("/", authRoutes);
app.use("/", userProfile);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
