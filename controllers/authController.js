//External module
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { normalizeEmail } = require("validator");

//Local module
const User = require("../models/user");

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    currentPage: "Login",
    isLoggedIn: req.isLoggedIn,
    errors: [],
    oldInput: { email: "" },
    user: req.session.user || {},
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    pageTitle: "Signup",
    currentPage: "Signup",
    isLoggedIn: req.isLoggedIn,
    errors: [],
    oldInput: { firstName: "", lastName: "", email: "", userType: "" },
    user: req.session.user || {},
  });
};

exports.postSignup = [
  check("firstName")
    .trim()
    .isLength({ min: 2 })
    .withMessage("First Name should be at least 2 characters long")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("First Name should contain only alphabets"),

  check("lastName")
    .trim()
    .matches(/^[A-Za-z\s]*$/)
    .withMessage("Last Name should contain only alphabets"),

  check("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  check("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password should be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password should contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password should contain at least one lowercase letter")
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/)
    .withMessage("Password should contain at least one special character"),

  check("confirmPassword")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  check("userType")
    .notEmpty()
    .withMessage("Please select a user type")
    .isIn(["guest", "host"])
    .withMessage("Invalid user type"),

  check("terms").custom((value, { req }) => {
    if (!value || value !== "on") {
      throw new Error("Please accept the terms and conditions");
    }
    return true;
  }),

  (req, res, next) => {
    const { firstName, lastName, email, password, userType } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render("auth/signup", {
        pageTitle: "Signup",
        currentPage: "signup",
        isLoggedIn: req.isLoggedIn,
        errors: errors.array().map((err) => err.msg),
        oldInput: { firstName, lastName, email, password, userType },
        user: req.session.user || {},
      });
    }

    bcrypt
      .hash(password, 12)
      .then((hashedPassword) => {
        const user = new User({
          firstName,
          lastName,
          email,
          password: hashedPassword,
          userType,
        });
        return user.save();
      })
      .then(() => {
        res.redirect("/login");
      })
      .catch((err) => {
        return res.status(422).render("auth/signup", {
          pageTitle: "Signup",
          currentPage: "signup",
          isLoggedIn: req.isLoggedIn,
          errors: [err.message],
          oldInput: { firstName, lastName, email, password, userType },
          user: req.session.user || {},
        });
      });
  },
];

exports.postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail =
      typeof email === "string" ? normalizeEmail(email.trim()) : "";
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(422).render("auth/login", {
        pageTitle: "Login",
        currentPage: "login",
        isLoggedIn: req.isLoggedIn,
        errors: ["User does not exist"],
        oldInput: { email: normalizedEmail },
        user: req.session.user || {},
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(422).render("auth/login", {
        pageTitle: "Login",
        currentPage: "login",
        isLoggedIn: req.isLoggedIn,
        errors: ["Invalid Password"],
        oldInput: { email: normalizedEmail },
        user: req.session.user || {},
      });
    }

    req.session.isLoggedIn = true;
    req.session.user = {
      _id: user._id.toString(),
      userType: user.userType,
    };
    req.session.save((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  } catch (err) {
    next(err);
  }
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
  //res.cookie("isLoggedIn", "false");
  //res.clearCookie("isLoggedIn");
};
