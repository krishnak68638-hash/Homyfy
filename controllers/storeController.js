//Local Module
const path = require("path");
const Home = require("../models/home");
const User = require("../models/user");

const sendHomeRules = async (req, res, next, asDownload) => {
  if (!req.isLoggedIn) {
    return res.redirect("/login");
  }

  try {
    const home = await Home.findById(req.params.homeId);
    if (!home || !home.houseRules) {
      return res.status(404).send("Home rules not found");
    }

    const filename = path.basename(home.houseRules);
    const extension = path.extname(filename).toLowerCase();
    if (![".pdf", ".txt"].includes(extension)) {
      return res.status(404).send("Home rules not found");
    }

    const filePath = path.join(__dirname, "..", "uploads", filename);
    const contentType = extension === ".pdf" ? "application/pdf" : "text/plain";
    res.type(contentType);
    const disposition = asDownload ? "attachment" : "inline";
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="house-rules${extension}"`,
    );
    res.sendFile(filePath, (err) => {
      if (err) {
        next(err);
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.houseRule = {
  getHomeRules: (req, res, next) => sendHomeRules(req, res, next, false),
  downloadHomeRules: (req, res, next) => sendHomeRules(req, res, next, true),
};

exports.getIndex = (req, res, next) => {
  console.log("Session value: ", req.session);
  Home.find().then((registeredHomes) => {
    res.render("store/index", {
      registeredHomes: registeredHomes,
      pageTitle: "homyfyy Home",
      currentPage: "index",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.getHomes = (req, res, next) => {
  Home.find().then((registeredHomes) => {
    res.render("store/home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Homes List",
      currentPage: "Home",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.getBookings = (req, res, next) => {
  res.render("store/bookings", {
    pageTitle: "My Bookings",
    currentPage: "Bookings",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.getFavouriteList = async (req, res, next) => {
  const userId = req.session.user._id;
  const user = await User.findById(userId).populate("favourites");
  res.render("store/favourite-list", {
    favouriteHomes: user.favourites,
    pageTitle: "My Favourites",
    currentPage: "favourites",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.postAddToFavourite = async (req, res, next) => {
  const homeId = req.body.id;
  const userId = req.session.user._id;
  const user = await User.findById(userId);

  if (!user.favourites.includes(homeId)) {
    user.favourites.push(homeId);
    await user.save();
  }

  res.redirect("/favourites");
};

exports.postRemoveFromFavourite = async (req, res, next) => {
  const homeId = req.params.homeId;
  const userId = req.session.user._id;
  const user = await User.findById(userId);
  if (user.favourites.includes(homeId)) {
    user.favourites = user.favourites.filter((fav) => fav != homeId);
    await user.save();
  }
  res.redirect("/favourites");
};

exports.getHomeDetails = (req, res, next) => {
  const homeId = req.params.homeId;
  Home.findById(homeId).then((home) => {
    if (!home) {
      console.log("Home not found");
      res.redirect("/homes");
    } else {
      res.render("store/home-detail", {
        home: home,
        pageTitle: "Home Detail",
        currentPage: "Home",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
      });
    }
  });
};
