//Core modules.

//External Modules
const express = require("express");
const hostRouter = express.Router();

//LOcal Modules.
const hostController = require("../controllers/hostController");

//use controller Model
hostRouter.get("/host-add-home", hostController.getAddHome);
hostRouter.get("/add-home", hostController.getAddHome);

hostRouter.post("/host-add-home", hostController.postAddHome);
hostRouter.post("/add-home", hostController.postAddHome);

hostRouter.get("/host-home-list", hostController.getHostHomes);

hostRouter.get("/edit-home/:homeId", hostController.getEditHome);
hostRouter.post("/edit-home/:homeId", hostController.postEditHome);

hostRouter.post("/delete-home/:homeId", hostController.postDeleteHome);

module.exports = hostRouter;
