//Local Module
const path = require("path");
const Home = require("../models/home");
const User = require("../models/user");
const Booking = require("../models/booking");

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

exports.getBookings = async (req, res, next) => {
  if (!req.isLoggedIn) {
    return res.redirect("/login");
  }
  try {
    const userId = req.session.user._id;
    const bookings = await Booking.find({ user: userId })
      .populate("home")
      .sort({ createdAt: -1 });

    res.render("store/bookings", {
      pageTitle: "My Bookings",
      currentPage: "Bookings",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      bookings: bookings,
      successMessage:
        req.query.success === "true"
          ? "Your stay has been reserved successfully!"
          : null,
    });
  } catch (err) {
    next(err);
  }
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

exports.getReserveHome = async (req, res, next) => {
  if (!req.isLoggedIn) {
    return res.redirect("/login");
  }
  try {
    const homeId = req.params.homeId;
    const home = await Home.findById(homeId);
    if (!home) {
      return res.redirect("/homes");
    }

    res.render("store/reserve", {
      home: home,
      pageTitle: `Reserve ${home.houseName}`,
      currentPage: "Home",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      errorMessage: null,
      oldInput: {},
    });
  } catch (err) {
    next(err);
  }
};

exports.postReserveHome = async (req, res, next) => {
  if (!req.isLoggedIn) {
    return res.redirect("/login");
  }

  const homeId = req.params.homeId;
  const {
    checkIn,
    checkOut,
    guests,
    guestName,
    guestEmail,
    guestPhone,
    specialRequests,
  } = req.body;

  try {
    const home = await Home.findById(homeId);
    if (!home) {
      return res.redirect("/homes");
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(422).render("store/reserve", {
        home: home,
        pageTitle: `Reserve ${home.houseName}`,
        currentPage: "Home",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
        errorMessage: "Please select valid check-in and check-out dates.",
        oldInput: req.body,
      });
    }

    if (checkInDate < today) {
      return res.status(422).render("store/reserve", {
        home: home,
        pageTitle: `Reserve ${home.houseName}`,
        currentPage: "Home",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
        errorMessage: "Check-in date cannot be in the past.",
        oldInput: req.body,
      });
    }

    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return res.status(422).render("store/reserve", {
        home: home,
        pageTitle: `Reserve ${home.houseName}`,
        currentPage: "Home",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
        errorMessage:
          "Check-out date must be at least 1 day after check-in date.",
        oldInput: req.body,
      });
    }

    const guestsCount = parseInt(guests, 10) || 1;
    const totalPrice = diffDays * home.price;

    const booking = new Booking({
      home: home._id,
      user: req.session.user._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights: diffDays,
      guests: guestsCount,
      pricePerNight: home.price,
      totalPrice: totalPrice,
      guestName:
        guestName ||
        `${req.session.user.firstName || ""} ${req.session.user.lastName || ""}`.trim() ||
        "Guest",
      guestEmail: guestEmail || req.session.user.email || "",
      guestPhone: guestPhone || "",
      specialRequests: specialRequests || "",
      status: "confirmed",
    });

    await booking.save();
    res.redirect("/bookings?success=true");
  } catch (err) {
    next(err);
  }
};

exports.postCancelBooking = async (req, res, next) => {
  if (!req.isLoggedIn) {
    return res.redirect("/login");
  }
  try {
    const bookingId = req.params.bookingId;
    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.session.user._id,
    });

    if (!booking) {
      return res.redirect("/bookings");
    }

    booking.status = "cancelled";
    await booking.save();
    res.redirect("/bookings");
  } catch (err) {
    next(err);
  }
};
