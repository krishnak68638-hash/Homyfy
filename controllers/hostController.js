//Local Module
const Home = require("../models/home");
const registeredHomes = Home.fetchAll();

//const registeredHomes = [];

// exports.postAddHome = (req, res, next) => {
//   //console.log("Home Registration successful for: ", req.body);
//   this.registeredHomes({ houseName: req.body.houseName });
//   res.render("homeAdded", {
//     pageTitle: "Home Added SuccessFully",
//     currentPage: "homeAdded",
//   });
// };

// exports.getHomes = (req, res, next) => {
//   //console.log(registeredHomes);
//   res.render("home", {
//     registeredHomes: registeredHomes,
//     pageTitle: "homyfyy Home",
//   });
// } ;

//exports.registeredHomes = registeredHomes;

exports.getAddHome = (req, res, next) => {
  res.render("host/addHome", {
    pageTitle: "add Home to homyfyy",
    currentPage: "addHome",
  });
};

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  const editing = req.query.editing === "true";

  Home.findById(homeId, (home) => {
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
    });
  });
};

exports.postEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  console.log("Updating home:", homeId, req.body);

  const { id, houseName, price, location, rating, photoUrl } = req.body;
  const home = new Home(houseName, price, location, rating, photoUrl);
  home.id = id;
  home.save();
  res.redirect("/host/host-home-list");
};

exports.getHostHomes = (req, res, next) => {
  Home.fetchAll((registeredHomes) =>
    res.render("host/host-home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Host Homes List",
      currentPage: "host-homes",
    }),
  );
};

exports.postAddHome = (req, res, next) => {
  //console.log("Home Registration successful for: ", req.body);
  const { houseName, price, location, rating, photoUrl } = req.body;
  const home = new Home(houseName, price, location, rating, photoUrl);
  home.save();

  res.redirect("/host/host-home-list");
};

exports.postDeleteHome = (req, res, next) => {
  const homeId = req.params.homeId;
  console.log("Came to delete ", homeId);
  Home.deleteById(homeId, (error) => {
    if (error) {
      console.log("Error While Deliting", error);
    }
    res.redirect("/host/host-home-list");
  });
};
