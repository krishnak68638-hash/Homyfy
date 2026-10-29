//Local Module
const path = require("path");
const Home = require("../models/home");
const fs = require("fs");

exports.getAddHome = (req, res, next) => {
  res.render("host/addHome", {
    pageTitle: "add Home to homyfyy",
    currentPage: "addHome",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.getEditHome = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    const editing = req.query.editing === "true";
    const home = await Home.findOne({
      _id: homeId,
      host: req.session.user._id,
    });

    if (!home) {
      console.log("Home not found for editing.");
      return res.redirect("/host/host-home-list");
    }

    res.render("host/edit-home", {
      home: home,
      pageTitle: "Edit your Home",
      currentPage: "host-homes",
      homeId: homeId,
      editing: editing,
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.postEditHome = async (req, res, next) => {
  try {
    const { houseName, price, location, rating, description } = req.body;
    const home = await Home.findOne({
      _id: req.params.homeId,
      host: req.session.user._id,
    });
    if (!home) {
      return res.redirect("/host/host-home-list");
    }

    home.houseName = houseName;
    home.price = price;
    home.location = location;
    home.rating = rating;
    home.description = description;

    const oldPhoto = home.photo;
    const photo = req.files.photo ? req.files.photo[0] : null;
    const newRules = req.files.houseRules ? req.files.houseRules[0] : null;

    if (photo) {
      home.photo = "/uploads/" + photo.filename;
    }

    if (newRules) {
      home.houseRules = "/uploads/" + newRules.filename;
    }

    await home.save();

    if (photo) {
      fs.unlink(
        path.join(__dirname, "..", "uploads", path.basename(oldPhoto)),
        (error) => {
          if (error) {
            console.log(error);
          }
        },
      );
    }

    res.redirect("/host/host-home-list");
  } catch (err) {
    next(err);
  }
};

exports.getHostHomes = async (req, res, next) => {
  try {
    const registeredHomes = await Home.find({ host: req.session.user._id });
    res.render("host/host-home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Host Homes List",
      currentPage: "host-homes",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.postAddHome = async (req, res, next) => {
  try {
    const { houseName, price, location, rating, description } = req.body;
    const photoFile = req.files.photo ? req.files.photo[0] : null;
    const rulesFile = req.files.houseRules ? req.files.houseRules[0] : null;

    if (!photoFile) {
      return res.status(422).send("No image provided");
    }

    const home = new Home({
      houseName,
      price,
      location,
      rating,
      photo: "/uploads/" + photoFile.filename,
      description,
      host: req.session.user._id,
    });

    if (rulesFile) {
      home.houseRules = "/uploads/" + rulesFile.filename;
    }

    await home.save();
    res.redirect("/host/host-home-list");
  } catch (err) {
    next(err);
  }
};

exports.postDeleteHome = (req, res, next) => {
  const homeId = req.params.homeId;
  Home.findOneAndDelete({ _id: homeId, host: req.session.user._id })
    .then(() => {
      res.redirect("/host/host-home-list");
    })
    .catch((error) => {
      next(error);
    });
};
