//External module
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { normalizeEmail } = require("validator");

//Local module
const User = require("../models/user");

const cleanPhoneNumber = (phone) => {
  if (!phone || typeof phone !== "string") return "";
  const cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return cleaned;
};

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    currentPage: "Login",
    isLoggedIn: req.isLoggedIn,
    errors: [],
    oldInput: { identifier: "" },
    user: req.session.user || {},
    registeredMessage:
      req.query.registered === "true"
        ? "Account created successfully! Please sign in with your credentials."
        : null,
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    pageTitle: "Signup",
    currentPage: "Signup",
    isLoggedIn: req.isLoggedIn,
    errors: [],
    oldInput: {
      authMethod: req.query.method === "email" ? "email" : "phone",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      userType: "guest",
    },
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

  async (req, res, next) => {
    const {
      authMethod = "phone",
      firstName,
      lastName,
      email,
      phone,
      password,
      userType,
    } = req.body;

    const validationErrors = validationResult(req);
    const errors = validationErrors.isEmpty()
      ? []
      : validationErrors.array().map((err) => err.msg);

    const normalizedPhone = cleanPhoneNumber(phone);
    const normalizedEmail =
      email && typeof email === "string" && email.trim() !== ""
        ? normalizeEmail(email.trim())
        : null;

    // Validate based on authentication method
    if (authMethod === "phone") {
      if (!normalizedPhone || !/^\d{10}$/.test(normalizedPhone)) {
        errors.push("Please enter a valid 10-digit mobile phone number");
      } else {
        const existingPhone = await User.findOne({ phone: normalizedPhone });
        if (existingPhone) {
          errors.push(
            "This mobile number is already registered. Please sign in or use another number.",
          );
        }
      }
      if (normalizedEmail) {
        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) {
          errors.push(
            "This email is already associated with an existing account.",
          );
        }
      }
    } else {
      // Email method
      if (!normalizedEmail) {
        errors.push("Please enter a valid email address");
      } else {
        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) {
          errors.push(
            "This email is already registered. Please sign in or use another email.",
          );
        }
      }
      if (normalizedPhone) {
        if (!/^\d{10}$/.test(normalizedPhone)) {
          errors.push("Optional phone number must be a valid 10-digit number");
        } else {
          const existingPhone = await User.findOne({ phone: normalizedPhone });
          if (existingPhone) {
            errors.push("This mobile number is already registered.");
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(422).render("auth/signup", {
        pageTitle: "Signup",
        currentPage: "Signup",
        isLoggedIn: req.isLoggedIn,
        errors,
        oldInput: {
          authMethod,
          firstName,
          lastName,
          email,
          phone,
          userType,
        },
        user: req.session.user || {},
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUserData = {
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : "",
        password: hashedPassword,
        userType,
      };

      if (normalizedPhone) {
        newUserData.phone = normalizedPhone;
      }
      if (normalizedEmail) {
        newUserData.email = normalizedEmail;
      }

      const user = new User(newUserData);
      await user.save();
      res.redirect("/login?registered=true");
    } catch (err) {
      return res.status(422).render("auth/signup", {
        pageTitle: "Signup",
        currentPage: "Signup",
        isLoggedIn: req.isLoggedIn,
        errors: [err.message],
        oldInput: {
          authMethod,
          firstName,
          lastName,
          email,
          phone,
          userType,
        },
        user: req.session.user || {},
      });
    }
  },
];

exports.postLogin = async (req, res, next) => {
  try {
    const { identifier, email, password } = req.body;
    const loginInput = (identifier || email || "").trim();

    if (!loginInput) {
      return res.status(422).render("auth/login", {
        pageTitle: "Login",
        currentPage: "Login",
        isLoggedIn: req.isLoggedIn,
        errors: ["Please enter your email or mobile phone number."],
        oldInput: { identifier: "" },
        user: req.session.user || {},
        registeredMessage: null,
      });
    }

    let user = null;

    if (loginInput.includes("@")) {
      const normalizedEmail = normalizeEmail(loginInput);
      user = await User.findOne({ email: normalizedEmail });
    } else {
      const digits = loginInput.replace(/\D/g, "");
      const phone10 = digits.length >= 10 ? digits.slice(-10) : digits;
      user = await User.findOne({
        $or: [
          { phone: phone10 },
          { phone: loginInput },
          { phone: `+91${phone10}` },
        ],
      });
    }

    if (!user) {
      return res.status(422).render("auth/login", {
        pageTitle: "Login",
        currentPage: "Login",
        isLoggedIn: req.isLoggedIn,
        errors: ["No account found with this email or mobile number."],
        oldInput: { identifier: loginInput },
        user: req.session.user || {},
        registeredMessage: null,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(422).render("auth/login", {
        pageTitle: "Login",
        currentPage: "Login",
        isLoggedIn: req.isLoggedIn,
        errors: ["Invalid password. Please try again."],
        oldInput: { identifier: loginInput },
        user: req.session.user || {},
        registeredMessage: null,
      });
    }

    req.session.isLoggedIn = true;
    req.session.user = {
      _id: user._id.toString(),
      userType: user.userType,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email || "",
      phone: user.phone || "",
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
};
