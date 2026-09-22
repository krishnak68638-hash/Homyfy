//Core Modules.
const path = require("path");

//External Modules
const express = require("express");

//Local Modules.
const storeRouter = require("./routes/storeRouter");
const hostRouter = require("./routes/hostRouter");
const errorRouter = require("./routes/errorRouter");
const rootDir = require("./utils/pathUtil");

//use express
const app = express();

//use EJS as the view engine.
app.set("view engine", "ejs");
app.set("views", "views");

//home request
//app.use(errors.error);

//Parsing the incoming request body.
app.use(express.urlencoded());

//use-Routers.
app.use(storeRouter);
app.use("/host", hostRouter);

app.use(express.static(path.join(rootDir, "public")));

//404 error handling
app.use(errorRouter);

//Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on address http://localhost:${PORT}`);
});
