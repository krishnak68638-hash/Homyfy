//core Modules
const fs = require("fs");
const path = require("path");
const rootDir = require("../utils/pathUtil");

//fack database
//store body Data
//const registeredHomes = [];

const favouriteDataPath = path.join(rootDir, "data", "favourite.json");

module.exports = class Favourite {
  static addToFavourite(homeId, callback) {
    Favourite.getFavourites((favourites) => {
      if (favourites.includes(homeId)) {
        callback("Home is already marked favourite");
      } else {
        favourites.push(homeId);
        fs.writeFile(favouriteDataPath, JSON.stringify(favourites), callback);
      }
    });
  }

  static getFavourites(callback) {
    fs.readFile(favouriteDataPath, (err, data) => {
      callback(!err ? JSON.parse(data) : []);
    });
  }

  static deleteById(delhomeId, callback) {
      Favourite.getFavourites(homeIds => {
        homeIds = homeIds.filter(homeId => delhomeId !== homeId);
        fs.writeFile(favouriteDataPath, JSON.stringify(homeIds), callback);
        })
    };

};
