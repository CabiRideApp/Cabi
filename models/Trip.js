const mongoose = require('mongoose');
const GeoJSON = require('mongoose-geojson-schema');
const {
    Number,
    Boolean,
    Date
} = mongoose.Schema.Types;

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

const tripDriversSchema = mongoose.Schema({
    tripID: {
        type: Number
    },
    driverID: {
        type: Number
    },
    requestStatus: {
        type: Number
    },
    location: {
        type: pointSchema,
        index: '2dsphere',
        required: true
    },
    actionDate: {
        type: Date
    },
})



const tripSchema = mongoose.Schema({
    pickupLat: {
        type: Number,
    },
    pickupLng: {
        type: Number,
    },
    pickAddress: {
        type: String,
    },
    dropoffLat: {
        type: Number,
    },
    dropoffLng: {
        type: Number,
    },
    dropoffAddress: {
        type: String,
    },
    promoCode: {
        type: String,
    },
    categoryCarTypeID: {
        type: Number,
    },
    tripID: {
        type: Number,
    },
    tripStatusId: {
        type: Number,
    },
    tokenID: {
        type: String
    },
    tripDrivers: {
        type: [tripDriversSchema]
    }
});

const Trip = mongoose.model('Trip', tripSchema);
module.exports = Trip;