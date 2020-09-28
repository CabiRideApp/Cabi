const mongoose = require("mongoose");
const GeoJSON = require('mongoose-geojson-schema');
const { Number, Boolean, String, Buffer } = mongoose.Schema.Types;

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
});

const driverSchema = new mongoose.Schema({
  driverID: {
    type: Number,
  },
  categoryCarTypeID: {
    type: Number,
  },
  isDeleted: {
    type: Boolean,
    default: true,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  isBusy: {
    type: Boolean,
    default: false,
  },
  location: {
    type: pointSchema,
    index: '2dsphere',
    required: true
  },
  phoneNumber: {
    type: Number,
  },
  idNo: {
    type: Number,
  },
  driverNameAr: {
    type: String
  },
  driverNameEn: {
    type: String
  },
  modelNameAr: {
    type: String
  },
  modelNameEn: {
    type: String
  },
  colorNameAr: {
    type: String
  },
  colorNameEn: {
    type: String
  },
  carImage: {
    type: String
  },
  driverImage: {
    type: String
  },
  plateNumber: {
    type: Number,
  },
  updateLocationDate: {
    type: Date,
  },
  tokenID: {
    type: String
  }
});

const Driver = mongoose.model("Driver", driverSchema);
module.exports = Driver;
