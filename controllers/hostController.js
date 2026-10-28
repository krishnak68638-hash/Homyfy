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

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  const editing = req.query.editing === "true";

  Home.findById(homeId).then((home) => {
    if (!home) {
      console.log("Home not found for editing.");
      return res.redirect("/host/host-home-list");
    }
    console.log(homeId, editing, home);
    res.render("host/edit-home", {
      home: home,
      pageTitle: "Edit your Home",
      currentPage: "host-homes",
      homeId: homeId,
      editing: editing,
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.postEditHome = async (req, res, next) => {
  try {
    const { houseName, price, location, rating, description } = req.body;
    const home = await Home.findById(req.params.homeId);
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

exports.getHostHomes = (req, res, next) => {
  Home.find().then((registeredHomes) => {
    res.render("host/host-home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Host Homes List",
      currentPage: "host-homes",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
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
  console.log("Came to delete ", homeId);
  Home.findByIdAndDelete(homeId)
    .then(() => {
      console.log("Home deleted successfully");
      res.redirect("/host/host-home-list");
    })
    .catch((error) => {
      console.log("Error While Deliting", error);
    });
};
