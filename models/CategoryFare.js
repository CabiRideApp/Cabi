const mongoose = require("mongoose");
const {Number, Boolean} = mongoose.Schema.Types;

const categoryFareSchema = new mongoose.Schema({
  categoryFareID: {
    type: Number,
  },
  categoryCarTypeID: {
    type: Number,
  },
  baseFare: {
    type: Number,
  },
  fareMinute: {
    type: Number,
  },
  minKM: {
    type: Number,
  },
  minFare: {
    type: Number,
  },
  cancelationFare: {
    type: Number,
  },
  waitingCharge: {
    type: Number,
  },
  isMain: {
    type: Boolean,
  },
});

const CategoryFare = mongoose.model("CategoryFare", categoryFareSchema);
module.exports = CategoryFare;
