//External Modules
const express = require("express");
const errorRouter = express.Router();

//LOcal Modules.
const errorController = require("../controllers/errorController");

//use controller Model
errorRouter.get("/404", errorController.getError);
errorRouter.use((req, res, next) => {
  res.status(404).render("404", {
    pageTitle: "Page Not Found",
    currentPage: "404",
  });
});

module.exports = errorRouter;
