const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");
const axios = require("axios");
const CategoryFareM = require("../models/CategoryFare");

router.post("/is_Online", async (req, res) => {
  try {
    const driver = await Driver.findOne({
      driverID: req.query.driverID,
    });
    if (req.query.status == 1) {
      const updated_driver = await Driver.updateOne(
        {
          driverID: req.query.driverID,
        },
        {
          $set: {
            isOnline: true,
            tokenID: req.query.tokenID,
          },
        }
      );
    }
    if (req.query.status == 2) {
      const updated_driver = await Driver.updateOne(
        {
          driverID: req.query.driverID,
        },
        {
          $set: {
            isOnline: false,
            tokenID: req.query.tokenID,
          },
        }
      );
    }
    res.json({
      sucess: 1,
      message: "update online status success",
    });
  } catch (error) {
    res.json({
      sucess: 0,
      message: error,
    });
  }
});

router.post("/is_Busy", async (req, res) => {
  console.log(req.query);
  try {
    const driver = await Driver.findOne({
      driverID: req.query.driverID,
    });
    if (req.query.status == 1) {
      const updated_driver = await Driver.updateOne(
        {
          driverID: req.query.driverID,
        },
        {
          $set: {
            isBusy: true,
          },
        }
      );
    }
    if (req.query.status == 2) {
      const updated_driver = await Driver.updateOne(
        {
          driverID: req.query.driverID,
        },
        {
          $set: {
            isBusy: false,
          },
        }
      );
    }
    res.json({
      sucess: 1,
      message: "update busy status success",
    });
  } catch (error) {
    res.json({
      sucess: 0,
      message: error,
    });
  }
});

module.exports = router;
