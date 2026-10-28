//Core Modules.
const path = require("path");
const crypto = require("crypto");

//External Modules
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const { default: mongoose } = require("mongoose");
const multer = require("multer");

// Configuration
const DB_PATH = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!DB_PATH) {
  throw new Error("MONGODB_URI must be set in the environment.");
}

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set in the environment.");
}

//Local Modules.
const storeRouter = require("./routes/storeRouter");
const hostRouter = require("./routes/hostRouter");
const errorRouter = require("./routes/errorRouter");
const rootDir = require("./utils/pathUtil");
const authRouter = require("./routes/authRouter");

//use express
const app = express();

//use EJS as the view engine.
app.set("view engine", "ejs");
app.set("views", "views");

const store = new MongoDBStore({
  uri: DB_PATH,
  collection: "sessions",
});

//Upload file store
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    cb(
      null,
      crypto.randomBytes(16).toString("hex") +
        path.extname(file.originalname).toLowerCase(),
    );
  },
});

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const photoExtensions = [".jpg", ".jpeg", ".png"];
  const photoMimeTypes = ["image/jpg", "image/jpeg", "image/png"];
  const isPhoto =
    file.fieldname === "photo" &&
    photoExtensions.includes(extension) &&
    photoMimeTypes.includes(file.mimetype);
  const isRulesFile =
    file.fieldname === "houseRules" &&
    ((extension === ".pdf" && file.mimetype === "application/pdf") ||
      (extension === ".txt" &&
        ["text/plain", "application/octet-stream"].includes(file.mimetype)));

  if (!isPhoto && !isRulesFile) {
    return cb(
      new Error(
        "Upload a JPG/PNG photo and, optionally, a PDF/TXT rules file.",
      ),
    );
  }

  cb(null, true);
};

const multerOptions = {
  storage,
  fileFilter,
};

//Parsing the incoming request body.
app.use(express.urlencoded());
app.use(
  multer(multerOptions).fields([
    { name: "photo", maxCount: 1 },
    { name: "houseRules", maxCount: 1 },
  ]),
);
app.use(express.static(path.join(rootDir, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/host/uploads", express.static(path.join(rootDir, "uploads")));
app.use("/homes/uploads", express.static(path.join(rootDir, "uploads")));

//use session middleware
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
  }),
);

//use-Routers.
app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn;
  next();
});

app.use(authRouter);
app.use(storeRouter);

app.use("/host", (req, res, next) => {
  if (req.isLoggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
});
app.use("/host", hostRouter);

//404 error handling
app.use(errorRouter);

//Start the server
const PORT = 3000;

mongoose
  .connect(DB_PATH)
  .then(() => {
    console.log("Connected to Mongo");
    app.listen(PORT, () => {
      console.log(`Server running on address http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error while connecting to Mongo:", err);
  });
