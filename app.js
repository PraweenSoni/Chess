require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const MongoStore = require('connect-mongo');
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
app.use(session({ secret: process.env.SESSION_SECRET || 'chess-secret-pks',
   resave: false,
   saveUninitialized: false,
   store: MongoStore.create({
   mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/chess-app',
   collectionName: 'sessions',
   ttl: 7 * 24 * 60 * 60
  }),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true, // prevent client-side JS access
    // secure: true, // enable in production with HTTPS
    // sameSite: 'lax' // optional, useful for CSRF protection
  } }));

app.use("/", indexRoutes);
app.use("/", authRoutes);
app.use("/", userProfile);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
