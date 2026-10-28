//External Modules
const express = require("express");
const errorRouter = express.Router();

//LOcal Modules.
const errorController = require("../controllers/errorController");

//use controller Model
errorRouter.get("/404", errorController.getError);
errorRouter.use(errorController.getError);

module.exports = errorRouter;
