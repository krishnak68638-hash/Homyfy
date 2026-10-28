const mongoose = require("mongoose");

const homeSchema = new mongoose.Schema({
  houseName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  photo: {
    type: String,
    required: true,
  },
  houseRules: String,
  description: String,
});

// homeSchema.pre('findOneDelete', async function(next) {
//   console.log("Came to pre hook while deleting a home");
//   const homeId = this.getQuery()._id;
//   await favourite.deleteMany({houseId: homeId});
//   next();
// });

module.exports = mongoose.model("Home", homeSchema);
