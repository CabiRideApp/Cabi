const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");

const ConstraintsM = require("./models/Constraints");
const DriverM = require("./models/Driver");
const CategoryFareM = require("./models/CategoryFare");
const DeliverySettingM = require("./models/DeliverySetting");
const TripM = require("./models/Trip");
const socketIo = require("socket.io");
const http = require("http");
const admin = require("firebase-admin");
var serviceAccount = require("./cabi-app-firebase-adminsdk-4cy4f-c6feddd07b.json");
const {listIndexes} = require("./models/Driver");
const {v4: uuidv4} = require("uuid");
const Driver = require("./models/Driver");
const Pending = require("./models/Pending");

require("dotenv/config");

var google_Key = "AIzaSyCKW4oeH-_tRtLAT_sWK9G7wbgEOpxWAzI";

const app = express();
app.use(cors());
app.use(express.json());

var users = new Map();
var admins = new Map();
var userinterval = new Map();
var listinterval = new Map();
var trackinterval = new Map();

mongoose.connect(
  process.env.DB_CONNECTION,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => console.log("connected to DB")
);

mongoose.connection.on("error", (err) => {
  console.log("error from server");
});

const server = http.createServer(app);
const io = socketIo(server);

app.post("/driver/is_Online", async (req, res) => {
  console.log("is online ");
  try {
    const driver = await DriverM.findOne({
      driverID: req.query.driverID,
    });
    if (req.query.status == 1) {
      const updated_driver = await DriverM.updateOne(
        {
          driverID: req.query.driverID,
        },
        {
          $set: {
            isOnline: true,
            tokenID: req.query.tokenID,
          },
        }
      ).then(() => {
        //console.log(driver);
        const ISONLINE = true;
        const data = {
          status:
            ISONLINE === true && driver.isBusy == false
              ? 1
              : ISONLINE == true && driver.isBusy == true
              ? 2
              : ISONLINE == false
              ? 3
              : 0,
          driverID: driver.driverID,
          location: driver.location,
          categoryCarTypeID: driver.categoryCarTypeID,
          phoneNumber: driver.phoneNumber,
          idNo: driver.idNo,
          driverNameAr: driver.driverNameAr,
          driverNameEn: driver.driverNameEn,
          modelNameAr: driver.modelNameAr,
          modelNameEn: driver.modelNameEn,
          colorNameAr: driver.colorNameAr,
          colorNameEn: driver.colorNameEn,
          carImage: driver.carImage,
          driverImage: driver.driverImage,
          updateLocationDate: driver.updateLocationDate,
          trip: driver.isBusy ? driver.busyTrip : "",
        };
        admins.forEach((admin) => {
          io.to(admin).emit("trackAdmin", data);
          io.to(admin).emit("trackCount");
        });
      });
    }
    if (req.query.status == 2) {
      const updated_driver = await DriverM.updateOne(
        {
          driverID: req.query.driverID,
        },
        {
          $set: {
            isOnline: false,
            tokenID: req.query.tokenID,
          },
        }
      ).then(() => {
        const ISONLINE = false;
        const data = {
          status:
            ISONLINE === true && driver.isBusy == false
              ? 1
              : ISONLINE == true && driver.isBusy == true
              ? 2
              : ISONLINE == false
              ? 3
              : 0,
          driverID: driver.driverID,
          location: driver.location,
          categoryCarTypeID: driver.categoryCarTypeID,
          phoneNumber: driver.phoneNumber,
          idNo: driver.idNo,
          driverNameAr: driver.driverNameAr,
          driverNameEn: driver.driverNameEn,
          modelNameAr: driver.modelNameAr,
          modelNameEn: driver.modelNameEn,
          colorNameAr: driver.colorNameAr,
          colorNameEn: driver.colorNameEn,
          carImage: driver.carImage,
          driverImage: driver.driverImage,
          updateLocationDate: driver.updateLocationDate,
          trip: driver.isBusy ? driver.busyTrip : "",
        };
        // console.log(data);
        admins.forEach((admin) => {
          io.to(admin).emit("trackAdmin", data);
          io.to(admin).emit("trackCount");
        });
      });
    }
    res.json({
      sucess: 1,
      message: "update online status success",
    });
  } catch (error) {
    console.log(error);
    res.json({
      sucess: 0,
      message: error,
    });
  }
});

app.post("/driver/is_Busy", async (req, res) => {
  console.log(req.query);
  try {
    const driver = await DriverM.findOne({
      driverID: req.query.driverID,
    });
    if (req.query.status == 1) {
      const updated_driver = await DriverM.updateOne(
        {
          driverID: req.query.driverID,
        },
        {
          $set: {
            isBusy: true,
          },
        }
      ).then(() => {
        const ISBUSY = true;
        const data = {
          status:
            driver.isOnline === true && ISBUSY == false
              ? 1
              : driver.isOnline == true && ISBUSY == true
              ? 2
              : driver.isOnline == false
              ? 3
              : 0,
          driverID: driver.driverID,
          location: driver.location,
          categoryCarTypeID: driver.categoryCarTypeID,
          phoneNumber: driver.phoneNumber,
          idNo: driver.idNo,
          driverNameAr: driver.driverNameAr,
          driverNameEn: driver.driverNameEn,
          modelNameAr: driver.modelNameAr,
          modelNameEn: driver.modelNameEn,
          colorNameAr: driver.colorNameAr,
          colorNameEn: driver.colorNameEn,
          carImage: driver.carImage,
          driverImage: driver.driverImage,
          updateLocationDate: driver.updateLocationDate,
          trip: driver.isBusy ? driver.busyTrip : "",
        };
        admins.forEach((admin) => {
          io.to(admin).emit("trackAdmin", data);
          io.to(admin).emit("trackCount");
        });
      });
    }
    if (req.query.status == 2) {
      const updated_driver = await DriverM.updateOne(
        {
          driverID: req.query.driverID,
        },
        {
          $set: {
            isBusy: false,
            busyTrip: {},
          },
        }
      ).then(() => {
        const ISBUSY = false;
        const data = {
          status:
            driver.isOnline === true && ISBUSY == false
              ? 1
              : driver.isOnline == true && ISBUSY == true
              ? 2
              : driver.isOnline == false
              ? 3
              : 0,
          driverID: driver.driverID,
          location: driver.location,
          categoryCarTypeID: driver.categoryCarTypeID,
          phoneNumber: driver.phoneNumber,
          idNo: driver.idNo,
          driverNameAr: driver.driverNameAr,
          driverNameEn: driver.driverNameEn,
          modelNameAr: driver.modelNameAr,
          modelNameEn: driver.modelNameEn,
          colorNameAr: driver.colorNameAr,
          colorNameEn: driver.colorNameEn,
          carImage: driver.carImage,
          driverImage: driver.driverImage,
          updateLocationDate: driver.updateLocationDate,
          trip: driver.isBusy ? driver.busyTrip : "",
        };
        admins.forEach((admin) => {
          io.to(admin).emit("trackAdmin", data);
          io.to(admin).emit("trackCount");
        });
      });
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

app.post("/driver/updateLocation", async (req, res) => {
  console.log(req.query);
  var newLat = req.query.lat;
  var newLong = req.query.lng;
  try {
    DriverM.findOne({
      driverID: req.query.driverID,
    })
      .then((driver) =>
        DriverM.updateOne(
          {
            driverID: req.query.driverID,
          },
          {
            $set: {
              oldLocation: {
                coordinates: [
                  driver.location.coordinates[0],
                  driver.location.coordinates[1],
                ],
                type: "Point",
              },
              location: {
                coordinates: [newLat, newLong],
                type: "Point",
              },
              UpdateLocationDate: new Date(),
            },
          }
        ).then(() => {
          const location = {
            coordinates: [newLat, newLong],
            type: "Point",
          };
          const data = {
            status:
              driver.isOnline === true && driver.isBusy == false
                ? 1
                : driver.isOnline == true && driver.isBusy == true
                ? 2
                : driver.isOnline == false
                ? 3
                : 0,
            driverID: driver.driverID,
            location: location,
            categoryCarTypeID: driver.categoryCarTypeID,
            phoneNumber: driver.phoneNumber,
            idNo: driver.idNo,
            driverNameAr: driver.driverNameAr,
            driverNameEn: driver.driverNameEn,
            modelNameAr: driver.modelNameAr,
            modelNameEn: driver.modelNameEn,
            colorNameAr: driver.colorNameAr,
            colorNameEn: driver.colorNameEn,
            carImage: driver.carImage,
            driverImage: driver.driverImage,
            updateLocationDate: driver.updateLocationDate,
            trip: driver.isBusy ? driver.busyTrip : "",
          };
          console.log(data);
          admins.forEach((admin) => {
            io.to(admin).emit("trackAdmin", data);
          });

          res.json({
            sucess: 1,
            message: "update location success",
          });
        })
      )
      .catch((err) => console.log(err));
  } catch (error) {
    console.log("error");
    res.json({
      sucess: 0,
      message: "update busy status faild",
    });
  }
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cabi-app.firebaseio.com",
});

const notification_options = {
  priority: "high",
  timeToLive: 60 * 60 * 24,
};

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("newTrip", async (data) => {
    var discountType = -1;
    var discountValue = 0;

    const config = {
      method: "post",
      url: `http://devmachine.taketosa.com/api/Trip/CheckPromoCode?promoCode=${data.promoCode}`,
      headers: {
        "Content-Type": "application / json",
        Authorization: "Bearer " + data.token,
      },
    };
    if (data.promoCode != "") {
      let promoResponse = await axios(config).then((res) => {
        if ((!res.data.status || !res.data.data.isValid) && data.promoCode) {
          var user_id = users.get(data.userId);
          discountValue = -1;
          console.log(user_id);
          io.to(user_id).emit("promoCode", {
            message: res.data.message,
          });
        } else if (res.data.data.isValid) {
          discountType = res.data.data.discountType;
          discountValue = res.data.data.discountValue;
        }
      });
    }
    console.log(discountType, discountValue);
    if (discountValue != -1) {
      var userID = data.userId;
      var pickupLat = data.pickupLat;
      var pickupLng = data.pickupLng;
      var dropoffLat = data.dropoffLat;
      var dropoffLng = data.dropoffLng;
      DriverM.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [pickupLat, pickupLng],
            },
            //maxDistance: 5000,
          },
        },
        isBusy: false,
        isOnline: true,
        isDeleted: false,
        //categoryCarTypeID: data.categoryCarTypeID,
      }).then((drivers) => {
        ConstraintsM.findOne({
          name: "next",
        }).then(async (val) => {
          var Trip_ID = val.tripID;
          ConstraintsM.update(
            {
              name: "next",
            },
            {
              $set: {
                tripID: Trip_ID + 1,
              },
            }
          ).then(async () => {
            console.log("get drivers");
            var dr = [];
            const trip = new TripM({
              pickupLat: pickupLat,
              pickupLng: pickupLng,
              pickupAddress: data.pickupAddress,
              dropoffLat: dropoffLat,
              dropoffLng: dropoffLng,
              dropoffAddress: data.dropoffAddress,
              promoCode: data.promoCode,
              categoryCarTypeID: data.categoryCarTypeID,
              cancelReasonID: 0,
              paymentStatusId: data.paymentStatusID,
              tripID: Trip_ID,
              tripStatusId: 2,
              tripDrivers: [],
            });
            const driverTime = await DistinationDuration(
              pickupLat,
              pickupLng,
              dropoffLng,
              dropoffLat
            );
            var dist = (driverTime[0].distance.value / 1000).toFixed();
            if (dist === 0) dist++;
            var from_to = {
              pickupLat: pickupLat,
              pickupLng: pickupLng,
              pickupAddress: data.pickupAddress,
              dropoffLat: dropoffLat,
              dropoffLng: dropoffLng,
              dropoffAddress: data.dropoffAddress,
              userId: userID,
              tripID: Trip_ID,
              driverTime: (driverTime[0].duration.value / 60).toFixed(),
              distance: dist,
            };

            var tripC = await tripCost(
              pickupLng,
              pickupLat,
              dropoffLng,
              dropoffLat,
              data.categoryCarTypeID,
              discountType,
              discountValue
            );

            from_to.tripCost = tripC;

            var cat = await CategoryFareM.findOne({
              categoryCarTypeID: data.categoryCarTypeID,
            });

            var payment = "";

            if (data.paymentStatusID === 1) payment = "Cash";
            else if (data.paymentStatusID === 2) payment = "Net";
            else payment = "PassengerWallet";

            from_to.category = cat.categoryFareID + " , " + payment;

            if (drivers.length > 0) {
              var reachTime = await DistinationDuration(
                pickupLat,
                pickupLng,
                drivers[0].location.coordinates[1],
                drivers[0].location.coordinates[0]
              );

              from_to.reachTime = (reachTime[0].duration.value / 60).toFixed();
              from_to.arriveTime = driveTimeCalc(0, from_to.reachTime);

              socket.setMaxListeners(21);
              const drs = [];
              for (let i = 0; i < Math.min(drivers.length, 3); i++) {
                drs.push({
                  driverID: drivers[i].driverID,
                  status: 0,
                });
              }
              try {
                console.log(Trip_ID, ";kopoi");
                admin
                  .messaging()
                  .sendToDevice(
                    drivers[0].tokenID,
                    {
                      data: {
                        message: "you have a new trip",
                        tripID: `${trip.tripID}`,
                        pickupLat: `${from_to.pickupLat}`,
                        pickupLng: `${from_to.pickupLng}`,
                        pickupAddress: `${from_to.pickupAddress}`,
                        dropoffLat: `${from_to.dropoffLat}`,
                        dropoffLng: `${from_to.dropoffLng}`,
                        dropoffAddress: `${from_to.dropoffAddress}`,
                        userID: `${from_to.userId}`,
                        driverTime: `${from_to.driverTime}`,
                        reachTime: `${from_to.reachTime}`,
                        arriveTime: `${from_to.arriveTime}`,
                        tripCost: `${from_to.tripCost}`,
                        distance: `${from_to.distance}`,
                        category: `${from_to.category}`,
                      },
                      notification: {
                        title: "You Have New Trip",
                        body: `from ${data.pickupAddress} to ${data.dropoffAddress}`,
                        color: "#151515",
                        sound: "ring",
                        //requireInteraction: true,
                        clickAction: "DriverHomeActivity",
                        channelId: "fcm_default_channel",
                        priority: "high",
                      },
                    },
                    notification_options
                  )
                  .then(async () => {
                    const pending = new Pending({
                      tripID: Trip_ID,
                      pickupLat: pickupLat,
                      pickupLng: pickupLng,
                      pickupAddress: data.pickupAddress,
                      dropoffLat: dropoffLat,
                      dropoffLng: dropoffLng,
                      dropoffAddress: data.dropoffAddress,
                      userId: userID,
                      driverTime: from_to.driveTime,
                      distance: from_to.distance,
                      tripCost: from_to.tripCost,
                      category: from_to.category,
                      reachTime: from_to.reachTime,
                      arriveTime: from_to.arriveTime,
                      arriveStatus: 0,
                      drs: drs,
                      registrationToken: data.registrationToken,
                      loginToken: data.token,
                    });
                    const savedPending = await pending.save();
                    const savedTrip = await trip.save();
                    socket
                      .to(users.get(drivers[0].driverID))
                      .emit("tripInfo", from_to);
                    var now = 0;

                    let interval1 = setInterval(function () {
                      now++;
                      Pending.findOne({tripID: Trip_ID}).then((pen107) => {
                        console.log(pen107.drs[0], Trip_ID);
                        if (pen107.drs[0].status !== 0) {
                          clearInterval(interval1);
                          console.log("clear ");
                        }
                      });
                      console.log(now);
                      if (now === 20) {
                        Pending.findOne({
                          tripID: Trip_ID,
                        }).then(async (saved) => {
                          if (saved.drs[0].status === 0) {
                            let array = saved.drs;
                            array[0].status = 3;
                            Pending.updateOne(
                              {tripID: trip.tripID},
                              {$set: {drs: array}}
                            );
                          }
                          if (saved.drs.length === 1) {
                            DriverM.findOne({driverID: saved.drs[0].driverID})
                              .then(async (savedDriver) => {
                                trip.tripDrivers.push({
                                  driverID: savedDriver.driverID,
                                  requestStatus: 3,
                                  lat: savedDriver.location.coordinates[0],
                                  lng: savedDriver.location.coordinates[1],
                                  actionDate: savedDriver.updateLocationDate,
                                });

                                trip.tripStatusId = 2;
                                await TripM.updateOne(
                                  {tripID: trip.tripID},
                                  {
                                    $set: {
                                      tripStatusId: trip.tripStatusId,
                                      tripDrivers: trip.tripDrivers,
                                    },
                                  }
                                );
                              })
                              .then(async () => {
                                await TripM.findOne({tripID: trip.tripID}).then(
                                  (savedTr) => {
                                    //console.log(savedTr);
                                    try {
                                      axios({
                                        method: "post",
                                        url:
                                          "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                        data: savedTr,
                                        headers: {
                                          Authorization: `Bearer ${data.token}`,
                                        },
                                      });
                                    } catch (error) {
                                      //console.log("abc");
                                    }
                                  }
                                );
                              });
                          } else if (saved.drs.length > 1) {
                            DriverM.findOne({
                              driverID: saved.drs[0].driverID,
                            }).then(async (savedDriver) => {
                              trip.tripDrivers.push({
                                driverID: savedDriver.driverID,
                                requestStatus: 3,
                                lat: savedDriver.location.coordinates[0],
                                lng: savedDriver.location.coordinates[1],
                                actionDate: savedDriver.updateLocationDate,
                              });

                              trip.tripStatusId = 2;
                              await TripM.updateOne(
                                {tripID: trip.tripID},
                                {
                                  $set: {
                                    tripStatusId: trip.tripStatusId,
                                    tripDrivers: trip.tripDrivers,
                                  },
                                }
                              );
                            });

                            var reachTime = await DistinationDuration(
                              pickupLat,
                              pickupLng,
                              drivers[1].location.coordinates[1],
                              drivers[1].location.coordinates[0]
                            );

                            from_to.reachTime = (
                              reachTime[0].duration.value / 60
                            ).toFixed();
                            from_to.arriveTime = driveTimeCalc(
                              0,
                              from_to.reachTime
                            );

                            admin.messaging().sendToDevice(
                              drivers[1].tokenID,
                              {
                                data: {
                                  message: "you have a new trip",
                                  tripID: `${trip.tripID}`,
                                  pickupLat: `${from_to.pickupLat}`,
                                  pickupLng: `${from_to.pickupLng}`,
                                  pickupAddress: `${from_to.pickupAddress}`,
                                  dropoffLat: `${from_to.dropoffLat}`,
                                  dropoffLng: `${from_to.dropoffLng}`,
                                  dropoffAddress: `${from_to.dropoffAddress}`,
                                  userID: `${from_to.userId}`,
                                  driverTime: `${from_to.driverTime}`,
                                  reachTime: `${from_to.reachTime}`,
                                  arriveTime: `${from_to.arriveTime}`,
                                  tripCost: `${from_to.tripCost}`,
                                  distance: `${from_to.distance}`,
                                  category: `${from_to.category}`,
                                },
                                notification: {
                                  title: "You Have New Trip",
                                  body: `from ${data.pickupAddress} to ${data.dropoffAddress}`,
                                  color: "#151515",
                                  sound: "ring",
                                  //requireInteraction: true,
                                  clickAction: "DriverHomeActivity",
                                  channelId: "fcm_default_channel",
                                  priority: "high",
                                },
                              },
                              notification_options
                            );
                            /////
                            socket
                              .to(users.get(drivers[1].driverID))
                              .emit("tripInfo", from_to);
                            var now2 = 0;
                            let interval43 = setInterval(function () {
                              now2++;
                              Pending.findOne({tripID: Trip_ID}).then(
                                (pen109) => {
                                  console.log(pen109.drs[1], Trip_ID);
                                  if (pen109.drs[1].status !== 0) {
                                    clearInterval(interval43);
                                    console.log("clear second interval");
                                  }
                                  console.log(now2);
                                }
                              );
                              if (now2 === 20) {
                                Pending.findOne({
                                  tripID: Trip_ID,
                                }).then(async (saved) => {
                                  if (saved.drs[1].status === 0) {
                                    let array = saved.drs;
                                    array[1].status = 3;
                                    Pending.updateOne(
                                      {tripID: trip.tripID},
                                      {$set: {drs: array}}
                                    );
                                  }

                                  if (saved.drs.length === 2) {
                                    DriverM.findOne({
                                      driverID: saved.drs[1].driverID,
                                    })
                                      .then(async (savedDriver) => {
                                        const arr = await TripM.findOne({
                                          tripID: trip.tripID,
                                        });
                                        console.log(arr.tripDrivers);
                                        arr.tripDrivers.push({
                                          driverID: savedDriver.driverID,
                                          requestStatus: 3,
                                          lat:
                                            savedDriver.location.coordinates[0],
                                          lng:
                                            savedDriver.location.coordinates[1],
                                          actionDate:
                                            savedDriver.updateLocationDate,
                                        });
                                        trip.tripStatusId = 2;
                                        await TripM.updateOne(
                                          {tripID: trip.tripID},
                                          {
                                            $set: {
                                              tripStatusId: trip.tripStatusId,
                                              tripDrivers: arr.tripDrivers,
                                            },
                                          }
                                        );
                                      })
                                      .then(async () => {
                                        await TripM.findOne({
                                          tripID: trip.tripID,
                                        }).then((savedTr) => {
                                          try {
                                            //console.log(savedTr);
                                            axios({
                                              method: "post",
                                              url:
                                                "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                              data: savedTr,
                                              headers: {
                                                Authorization: `Bearer ${data.token}`,
                                              },
                                            }).then((res) => {
                                              //console.log(res.data);
                                            });
                                          } catch (error) {
                                            console.log("abc");
                                          }
                                        });
                                      });
                                  } else {
                                    DriverM.findOne({
                                      driverID: saved.drs[1].driverID,
                                    }).then(async (savedDriver) => {
                                      trip.tripDrivers.push({
                                        driverID: savedDriver.driverID,
                                        requestStatus: 3,
                                        lat:
                                          savedDriver.location.coordinates[0],
                                        lng:
                                          savedDriver.location.coordinates[1],
                                        actionDate:
                                          savedDriver.updateLocationDate,
                                      });

                                      trip.tripStatusId = 2;
                                      await TripM.updateOne(
                                        {tripID: trip.tripID},
                                        {
                                          $set: {
                                            tripStatusId: trip.tripStatusId,
                                            tripDrivers: trip.tripDrivers,
                                          },
                                        }
                                      );
                                    });
                                    var reachTime = await DistinationDuration(
                                      pickupLat,
                                      pickupLng,
                                      drivers[2].location.coordinates[1],
                                      drivers[2].location.coordinates[0]
                                    );

                                    from_to.reachTime = (
                                      reachTime[0].duration.value / 60
                                    ).toFixed();
                                    from_to.arriveTime = driveTimeCalc(
                                      0,
                                      from_to.reachTime
                                    );

                                    admin.messaging().sendToDevice(
                                      drivers[2].tokenID,
                                      {
                                        data: {
                                          message: "you have a new trip",
                                          tripID: `${trip.tripID}`,
                                          pickupLat: `${from_to.pickupLat}`,
                                          pickupLng: `${from_to.pickupLng}`,
                                          pickupAddress: `${from_to.pickupAddress}`,
                                          dropoffLat: `${from_to.dropoffLat}`,
                                          dropoffLng: `${from_to.dropoffLng}`,
                                          dropoffAddress: `${from_to.dropoffAddress}`,
                                          userID: `${from_to.userId}`,
                                          driverTime: `${from_to.driverTime}`,
                                          reachTime: `${from_to.reachTime}`,
                                          arriveTime: `${from_to.arriveTime}`,
                                          tripCost: `${from_to.tripCost}`,
                                          distance: `${from_to.distance}`,
                                          category: `${from_to.category}`,
                                        },
                                        notification: {
                                          title: "You Have New Trip",
                                          body: `from ${data.pickupAddress} to ${data.dropoffAddress}`,
                                          color: "#151515",
                                          sound: "ring",
                                          //requireInteraction: true,
                                          clickAction: "DriverHomeActivity",
                                          channelId: "fcm_default_channel",
                                          priority: "high",
                                        },
                                      },
                                      notification_options
                                    );
                                    /////
                                    socket
                                      .to(users.get(drivers[2].driverID))
                                      .emit("tripInfo", from_to);
                                    var now3 = 0;
                                    let interval69 = setInterval(function () {
                                      now3++;
                                      Pending.findOne({tripID: Trip_ID}).then(
                                        (pen110) => {
                                          console.log(pen110.drs[2], Trip_ID);
                                          if (pen110.drs[2].status !== 0) {
                                            clearInterval(interval69);
                                            console.log(
                                              "clear second interval"
                                            );
                                          }
                                          console.log(now3);
                                        }
                                      );
                                      if (now3 === 20) {
                                        Pending.findOne({
                                          tripID: Trip_ID,
                                        }).then(async (saved) => {
                                          if (saved.drs[2].status === 0) {
                                            let array = saved.drs;
                                            array[2].status = 3;
                                            Pending.updateOne(
                                              {tripID: trip.tripID},
                                              {$set: {drs: array}}
                                            );
                                          }
                                          DriverM.findOne({
                                            driverID: saved.drs[2].driverID,
                                          }).then(async (savedDriver) => {
                                            try {
                                              const arr = await TripM.findOne({
                                                tripID: trip.tripID,
                                              });
                                              arr.tripDrivers.push({
                                                driverID: savedDriver.driverID,
                                                requestStatus: 3,
                                                lat:
                                                  savedDriver.location
                                                    .coordinates[0],
                                                lng:
                                                  savedDriver.location
                                                    .coordinates[1],
                                                actionDate:
                                                  savedDriver.updateLocationDate,
                                              });
                                              trip.tripStatusId = 2;
                                              await TripM.updateOne(
                                                {tripID: trip.tripID},
                                                {
                                                  $set: {
                                                    tripStatusId:
                                                      trip.tripStatusId,
                                                    tripDrivers:
                                                      arr.tripDrivers,
                                                  },
                                                }
                                              );
                                              await TripM.findOne({
                                                tripID: trip.tripID,
                                              }).then((savedTr) => {
                                                try {
                                                  //console.log(savedTr);
                                                  axios({
                                                    method: "post",
                                                    url:
                                                      "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                                    data: savedTr,
                                                    headers: {
                                                      Authorization: `Bearer ${data.token}`,
                                                    },
                                                  }).then((res) => {
                                                    //console.log(res.data);
                                                  });
                                                } catch (error) {
                                                  console.log("abc");
                                                }
                                              });
                                            } catch (error) {
                                              console.log("hammoud");
                                            }
                                          });
                                        });
                                        clearInterval(interval69);
                                        console.log("clear interval69");
                                      }
                                    }, 1000);
                                  }
                                });
                                clearInterval(interval43);
                                console.log("clear interval43");
                              }
                            }, 1000);
                            ///////////
                          }
                        });
                        clearInterval(interval1);
                        console.log("clear interval1");
                      }
                    }, 1000);
                  });
              } catch (error) {
                console.log(error);
              }
            } else {
              const pending = new Pending({
                tripID: Trip_ID,
                pickupLat: pickupLat,
                pickupLng: pickupLng,
                pickupAddress: data.pickupAddress,
                dropoffLat: dropoffLat,
                dropoffLng: dropoffLng,
                dropoffAddress: data.dropoffAddress,
                userId: userID,
                driverTime: from_to.driveTime,
                distance: from_to.distance,
                tripCost: from_to.tripCost,
                category: from_to.category,
                reachTime: from_to.reachTime,
                arriveTime: from_to.arriveTime,
                arriveStatus: 0,
                drs: [],
                registrationToken: data.registrationToken,
                loginToken: data.token,
              });
              const savedPending = await pending.save();
              Pending.findOne({tripID: trip.tripID}).then(async (res1) => {
                trip.tripStatusId = 2;
                trip.tripDrivers = [];
                await trip.save().then((res) => {
                  console.log(res);
                  try {
                    axios({
                      method: "post",
                      url: "https://devmachine.taketosa.com/api/Trip/NewTrip",
                      data: res,
                      headers: {
                        Authorization: `Bearer ${res1.loginToken}`,
                      },
                    }).then((res2) => {
                      console.log(res2);
                      admin.messaging().sendToDevice(
                        res1.registrationToken,
                        {
                          data: {
                            message: "no driver found",
                          },
                        },
                        notification_options
                      );
                    });
                  } catch (error) {
                    console.log(error);
                  }
                });
              });
            }
          });
        });
      });
    }
  });

  socket.on("driverRespond", async (data) => {
    console.log("-------------------------------- this is the end");
    io.to(users.get(2)).emit("success");
    if (data.requestStatus === 1) {
      Pending.findOne({tripID: data.tripID}).then((saved) => {
        let array = saved.drs;
        var idx = 0;
        for (let i = 0; i < array.length; i++) {
          if (array[i].driverID === data.driverID) {
            array[i].status = 1;
            idx = i;
          }
        }
        console.log(array);
        Pending.updateOne({tripID: data.tripID}, {$set: {drs: array}}).then(
          () => {
            Pending.findOne({tripID: data.tripID}).then((saved1) => {
              //  console.log(saved1);
              TripM.findOne({tripID: data.tripID}).then((savedTrip) => {
                DriverM.findOne({driverID: saved.drs[idx].driverID}).then(
                  async (savedDriver) => {
                    try {
                      var trip = savedTrip;
                      console.log(savedDriver, "1111111111111");

                      trip.tripDrivers.push({
                        driverID: savedDriver.driverID,
                        requestStatus: 1,
                        lat: savedDriver.location.coordinates[0],
                        lng: savedDriver.location.coordinates[1],
                        actionDate: savedDriver.updateLocationDate,
                      });
                      trip.tripStatusId = 3;
                      //console.log(trip, "trip");
                      console.log("beforeTrip");
                      const data19 = {
                        status:
                          savedDriver.isOnline === true &&
                          savedDriver.isBusy == false
                            ? 1
                            : savedDriver.isOnline == true &&
                              savedDriver.isBusy == true
                            ? 2
                            : savedDriver.isOnline == false
                            ? 3
                            : 0,
                        driverID: savedDriver.driverID,
                        location: savedDriver.location,
                        categoryCarTypeID: savedDriver.categoryCarTypeID,
                        phoneNumber: savedDriver.phoneNumber,
                        idNo: savedDriver.idNo,
                        driverNameAr: savedDriver.driverNameAr,
                        driverNameEn: savedDriver.driverNameEn,
                        modelNameAr: savedDriver.modelNameAr,
                        modelNameEn: savedDriver.modelNameEn,
                        colorNameAr: savedDriver.colorNameAr,
                        colorNameEn: savedDriver.colorNameEn,
                        carImage: savedDriver.carImage,
                        driverImage: savedDriver.driverImage,
                        updateLocationDate: savedDriver.updateLocationDate,
                        trip: savedDriver.isBusy ? savedDriver.busyTrip : "",
                      };
                      console.log("data", data);
                      admins.forEach((admin) => {
                        socket.to(admin).emit("trackAdmin", data19);
                        socket.to(admin).emit("trackCount");
                      });
                      await TripM.updateOne(
                        {tripID: trip.tripID},
                        {
                          $set: {
                            tripStatusId: trip.tripStatusId,
                            tripDrivers: trip.tripDrivers,
                          },
                        }
                      ).then(() => {
                        console.log("before");
                        TripM.findOne({tripID: trip.tripID}).then((savedTr) => {
                          console.log(savedTr, "after");
                          try {
                            //console.log(savedTr, "----------------", saved1.loginToken);
                            axios({
                              method: "post",
                              url:
                                "https://devmachine.taketosa.com/api/Trip/NewTrip",
                              data: savedTr,
                              headers: {
                                Authorization: `Bearer ${saved1.loginToken}`,
                              },
                            }).then((res) => {
                              console.log(typeof res.data.status, "--123--");
                              if (res.data.status) {
                                io.to(users.get(savedDriver.driverID)).emit(
                                  "success",
                                  {
                                    status: true,
                                    condition: true,
                                  }
                                );
                                io.to(users.get(saved1.userID)).emit(
                                  "success",
                                  {status: true}
                                );

                                var totalUserTime = driveTimeCalc(
                                  saved.driverTime,
                                  saved.reachTime
                                );
                                var obj = res.data;
                                obj.location = savedDriver.location;
                                obj.reachTime = saved.reachTime;
                                obj.driverTime = saved.driverTime;
                                obj.tripCost = saved.tripCost;
                                obj.totalUserTime = totalUserTime;
                                admin.messaging().sendToDevice(
                                  data.registrationToken,
                                  {
                                    data: {
                                      message: `trip has been approved from ${saved.pickupAddress} to ${saved.dropoffAddress} `,
                                    },
                                  },
                                  notification_options
                                );
                                socket
                                  .to(users.get(saved.userID))
                                  .emit("tripInfo", obj);
                              } else {
                                console.log(123);
                                io.to(users.get(savedDriver.driverID)).emit(
                                  "success",
                                  {
                                    status: false,
                                    condition: true,
                                  }
                                );
                                io.to(users.get(saved1.userID)).emit(
                                  "success",
                                  {
                                    status: false,
                                    condition: true,
                                  }
                                );
                              }
                            });
                          } catch (error) {
                            console.log("abc");
                          }
                        });
                      });
                    } catch (error) {
                      console.log("hammoud");
                    }
                  }
                );
              });
            });
          }
        );
      });
    } else {
      Pending.findOne({tripID: data.tripID}).then(async (pendingTrip) => {
        let array = pendingTrip.drs;
        var idx = 0;
        for (let i = 0; i < array.length; i++) {
          if (array[i].driverID === data.driverID) {
            array[i].status = 2;
            idx = i;
          }
        }
        await Pending.updateOne(
          {tripID: data.tripID},
          {$set: {drs: array}}
        ).then(() => {
          io.to(users.get(data.driverID)).emit("success", {
            status: true,
            condition: false,
          });
          Pending.findOne({tripID: data.tripID}).then(
            async (updatedPending) => {
              var idx2 = -1;
              let array2 = pendingTrip.drs;
              for (let j = 0; j < array2; j++) {
                if (array2[j].status === 0) {
                  idx2 = j;
                  break;
                }
              }
              if (idx2 === -1) {
                Pending.findOne({tripID: data.tripID}).then(
                  async (pendingTrip2) => {
                    let array3 = [];
                    for (let k = 0; k < pendingTrip2.drs; k++) {
                      await DriverM.findOne({
                        driverID: pendingTrip2.drs[k].driverID,
                      }).then((savedDriver) => {
                        array3.push({
                          driverID: savedDriver.driverID,
                          requestStatus: 1,
                          lat: savedDriver.location.coordinates[0],
                          lng: savedDriver.location.coordinates[1],
                          actionDate: savedDriver.updateLocationDate,
                        });
                      });
                    }
                    TripM.updateOne(
                      {tripID: data.tripID},
                      {$set: {tripDrivers: array3, tripStatusId: 2}}
                    ).then(() => {
                      TripM.findOne({tripID: data.tripID}).then((savedTr) => {
                        try {
                          axios({
                            method: "post",
                            url:
                              "https://devmachine.taketosa.com/api/Trip/NewTrip",
                            data: savedTr,
                            headers: {
                              Authorization: `Bearer ${pendingTrip2.loginToken}`,
                            },
                          }).then((res) => {
                            admin.messaging().sendToDevice(
                              pendingTrip2.registrationToken,
                              {
                                data: {
                                  message:
                                    "there is no drivers available right now",
                                },
                              },
                              notification_options
                            );
                          });
                        } catch (error) {
                          console.log("dada");
                        }
                      });
                    });
                  }
                );
              } else {
                DriverM.findOne({driverID: array2[idx2]}).then(
                  async (driver) => {
                    var reachTime1 = await DistinationDuration(
                      pendingTrip.pickupLat,
                      pendingTrip.pickupLng,
                      driver.location.coordinates[1],
                      driver.location.coordinates[0]
                    );
                    var reachTime = (
                      reachTime1[0].duration.value / 60
                    ).toFixed();
                    var arriveTime = driveTimeCalc(0, reachTime);
                    admin.messaging().sendToDevice(
                      driver.tokenID,
                      {
                        data: {
                          message: "you have a new trip",
                          tripID: `${updatedPending.tripID}`,
                          pickupLat: `${updatedPending.pickupLat}`,
                          pickupLng: `${updatedPending.pickupLng}`,
                          pickupAddress: `${updatedPending.pickupAddress}`,
                          dropoffLat: `${updatedPending.dropoffLat}`,
                          dropoffLng: `${updatedPending.dropoffLng}`,
                          dropoffAddress: `${updatedPending.dropoffAddress}`,
                          userID: `${updatedPending.userId}`,
                          driverTime: `${updatedPending.driverTime}`,
                          reachTime: `${reachTime}`,
                          arriveTime: `${arriveTime}`,
                          tripCost: `${updatedPending.tripCost}`,
                          distance: `${updatedPending.distance}`,
                          category: `${updatedPending.category}`,
                        },
                        notification: {
                          title: "You Have New Trip",
                          body: `from ${updatedPending.pickupAddress} to ${updatedPending.dropoffAddress}`,
                          color: "#151515",
                          sound: "ring",
                          //requireInteraction: true,
                          clickAction: "DriverHomeActivity",
                          channelId: "fcm_default_channel",
                          priority: "high",
                        },
                      },
                      notification_options
                    );
                    var from_to = updatedPending;
                    from_to.reachTime = reachTime;
                    from_to.arriveTime = arriveTime;
                    socket
                      .to(users.get(driver.driverID))
                      .emit("tripInfo", from_to);
                    let now = 0;
                    let interval4 = setInterval(function () {
                      now++;
                      if (now === 20) {
                        Pending.findOne({tripID: data.tripID}).then(
                          (pendingTripE) => {
                            if (pendingTripE.drs[idx2].status === 0) {
                              let array = pendingTripE.drs;
                              array[idx2].status = 3;
                              Pending.updateOne(
                                {tripID: tripID},
                                {$set: {drs: array}}
                              )
                                .then(() => {
                                  Pending.findOne({tripID: tripID}).then(
                                    (updatedPending2) => {
                                      let array5 = updatedPending2.drs;
                                      for (let m = 0; m < array5.length; m++) {
                                        if (array5[m].status === 0) {
                                          ///////////////////////////////////////////
                                        }
                                      }
                                    }
                                  );
                                })
                                .then((updatedPending3) => {
                                  let idx3 = -1;
                                  var array6 = updatedPending3.drs;
                                  for (let n = 0; n < array6.length; n++) {
                                    if (array6[n].status === 0) {
                                      idx3 = n;
                                      break;
                                    }
                                  }
                                  if (idx3 === -1) {
                                    TripM.findOne({tripID: data.tripID}).then(
                                      (trip11) => {
                                        let finalDrivers = [];
                                        for (
                                          let q = 0;
                                          q > array6.length;
                                          q++
                                        ) {
                                          DriverM.find({
                                            driverID: array6[q].driverID,
                                          }).then((driver) => {
                                            finalDrivers.push({
                                              driverID: driver.driverID,
                                              requestStatus: array6[q].status,
                                              lat:
                                                driver.location.coordinates[0],
                                              lng:
                                                driver.location.coordinates[1],
                                              actionDate:
                                                driver.updateLocationDate,
                                            });
                                            let data1 = trip11;
                                            data1.tripStatusId = 2;
                                            data1.tripDrivers = finalDrivers;
                                            TripM.updateOne(
                                              {tripID: data.tripID},
                                              {
                                                $set: {
                                                  tripStatusId: 2,
                                                  tripDrivers: finalDrivers,
                                                },
                                              }
                                            ).then(() => {
                                              TripM.find({
                                                tripID: data.tripID,
                                              }).then((res1) => {
                                                try {
                                                  axios({
                                                    method: "post",
                                                    url:
                                                      "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                                    data: res1,
                                                    headers: {
                                                      Authorization: `Bearer ${updatedPending3.loginToken}`,
                                                    },
                                                  }).then((res3) => {
                                                    admin
                                                      .messaging()
                                                      .sendToDevice(
                                                        updatedPending3.registrationToken,
                                                        {
                                                          data: {
                                                            message:
                                                              "no driver found",
                                                          },
                                                        },
                                                        notification_options
                                                      );
                                                  });
                                                } catch (error) {
                                                  console.log("abc");
                                                }
                                              });
                                            });
                                          });
                                        }
                                      }
                                    );
                                  } else {
                                    DriverM.findOne({
                                      driverID: array6[idx3].driverID,
                                    }).then((dr) => {
                                      Pending.findOne({
                                        tripID: data.tripID,
                                      }).then(async (pen) => {
                                        let from_to = pen;
                                        var reachTime1 = await DistinationDuration(
                                          pen.pickupLat,
                                          pen.pickupLng,
                                          dr.location.coordinates[1],
                                          dr.location.coordinates[0]
                                        );
                                        var reachTime = (
                                          reachTime1[0].duration.value / 60
                                        ).toFixed();
                                        var arriveTime = driveTimeCalc(
                                          0,
                                          reachTime
                                        );
                                        admin.messaging().sendToDevice(
                                          dr.tokenID,
                                          {
                                            data: {
                                              message: "you have a new trip",
                                              tripID: `${pen.tripID}`,
                                              pickupLat: `${pen.pickupLat}`,
                                              pickupLng: `${pen.pickupLng}`,
                                              pickupAddress: `${pen.pickupAddress}`,
                                              dropoffLat: `${pen.dropoffLat}`,
                                              dropoffLng: `${pen.dropoffLng}`,
                                              dropoffAddress: `${pen.dropoffAddress}`,
                                              userID: `${pen.userId}`,
                                              driverTime: `${pen.driverTime}`,
                                              reachTime: `${reachTime}`,
                                              arriveTime: `${arriveTime}`,
                                              tripCost: `${pen.tripCost}`,
                                              distance: `${pen.distance}`,
                                              category: `${pen.category}`,
                                            },
                                            notification: {
                                              title: "You Have New Trip",
                                              body: `from ${pen.pickupAddress} to ${pen.dropoffAddress}`,
                                              color: "#151515",
                                              sound: "ring",
                                              //requireInteraction: true,
                                              clickAction: "DriverHomeActivity",
                                              channelId: "fcm_default_channel",
                                              priority: "high",
                                            },
                                          },
                                          notification_options
                                        );
                                        from_to.reachTime = reachTime;
                                        from_to.arriveTime = arriveTime;
                                        socket
                                          .to(users.get(dr.driverID))
                                          .emit("tripInfo", from_to);
                                        let now115 = 0;
                                        let interval15 = setInterval(
                                          function () {
                                            now++;
                                            if (now === 20) {
                                              Pending.findOne({
                                                tripID: data.tripID,
                                              }).then((pen115) => {
                                                if (
                                                  pen115.drs[idx3].status === 0
                                                ) {
                                                  let array77 = pen115.drs;
                                                  array77[idx].status = 3;
                                                  Pending.updateOne(
                                                    {tripID: data.tripID},
                                                    {
                                                      $set: {
                                                        drs: array77,
                                                      },
                                                    }
                                                  ).then(() => {
                                                    let array123 = [];
                                                    for (
                                                      let r = 0;
                                                      r < pen115.drs;
                                                      r++
                                                    ) {
                                                      DriverM.findOne({
                                                        driverID:
                                                          pen115.drs[r]
                                                            .driverID,
                                                      }).then((tmpDriver) => {
                                                        array123.push({
                                                          driverID:
                                                            tmpDriver.driverID,
                                                          requestStatus:
                                                            pen115.drs[r]
                                                              .status,
                                                          lat:
                                                            tmpDriver.location
                                                              .coordinates[0],
                                                          lng:
                                                            tmpDriver.location
                                                              .coordinates[1],
                                                          actionDate:
                                                            tmpDriver.updateLocationDate,
                                                        });
                                                      });
                                                    }
                                                    TripM.updateOne(
                                                      {tripID: data.tripID},
                                                      {
                                                        $set: {
                                                          tripStatusId: 2,
                                                          tripDrivers: array123,
                                                        },
                                                      }
                                                    ).then(() => {
                                                      TripM.findOne({
                                                        tripID: data.tripID,
                                                      }).then((trip321) => {
                                                        try {
                                                          axios({
                                                            method: "post",
                                                            url:
                                                              "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                                            data: trip321,
                                                            headers: {
                                                              Authorization: `Bearer ${pen115.loginToken}`,
                                                            },
                                                          }).then((res3) => {
                                                            admin
                                                              .messaging()
                                                              .sendToDevice(
                                                                pen115.registrationToken,
                                                                {
                                                                  data: {
                                                                    message:
                                                                      "no driver found",
                                                                  },
                                                                },
                                                                notification_options
                                                              );
                                                          });
                                                        } catch (error) {
                                                          console.log("abc");
                                                        }
                                                      });
                                                    });
                                                  });
                                                }
                                              });
                                            }
                                          },
                                          1000
                                        );
                                      });
                                    });
                                  }
                                });
                            } else {
                              //repeat driver responed
                            }
                          }
                        );
                      }
                    }, 1000);
                  }
                );
              }
            }
          );
        });
      });
    }
  });

  socket.on("arrive", (data) => {
    Pending.findOne({tripID: data.tripID}).then((trip) => {
      socket.to(users.get(trip.userID)).emit("arrive");
    });
  });

  socket.on("finish", (data) => {
    Pending.findOne({tripID: data.tripID}).then((trip) => {
      socket.to(users.get(trip.userID)).emit("finish");
    });
  });

  socket.on("updatelocation", (data) => {
    console.log(data);
    var newLat = data.lat;
    var newLong = data.long;
    try {
      DriverM.findOne({
        driverID: data.driverID,
      })
        .then((driver) =>
          DriverM.updateOne(
            {
              driverID: data.driverID,
            },
            {
              $set: {
                oldLocation: {
                  coordinates: [
                    driver.location.coordinates[0],
                    driver.location.coordinates[1],
                  ],
                  type: "Point",
                },
                location: {
                  coordinates: [newLat, newLong],
                  type: "Point",
                },

                UpdateLocationDate: new Date(),
              },
            }
          ).then(() => {
            const location = {
              coordinates: [newLat, newLong],
              type: "Point",
            };
            const data = {
              status:
                driver.isOnline === true && driver.isBusy == false
                  ? 1
                  : driver.isOnline == true && driver.isBusy == true
                  ? 2
                  : driver.isOnline == false
                  ? 3
                  : 0,
              driverID: driver.driverID,
              location: location,
              categoryCarTypeID: driver.categoryCarTypeID,
              phoneNumber: driver.phoneNumber,
              idNo: driver.idNo,
              driverNameAr: driver.driverNameAr,
              driverNameEn: driver.driverNameEn,
              modelNameAr: driver.modelNameAr,
              modelNameEn: driver.modelNameEn,
              colorNameAr: driver.colorNameAr,
              colorNameEn: driver.colorNameEn,
              carImage: driver.carImage,
              driverImage: driver.driverImage,
              updateLocationDate: driver.updateLocationDate,
              trip: driver.isBusy ? driver.busyTrip : "",
            };
            // console.log(data);
            admins.forEach((admin) => {
              io.to(admin).emit("trackAdmin", data);
            });
          })
        )
        .catch((err) => console.log(err));
    } catch (error) {
      console.log("error");
    }
  });

  socket.on("getavailable", (data) => {
    // console.log(data);
    const id = uuidv4();
    userinterval.set(data.userid, id);
    try {
      DriverM.find({
        isBusy: false,
        isOnline: true,
        isDeleted: false,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [data.lat, data.long],
            },
            //   $maxDistance: 5000,
          },
        },
      }).then(async (res) => {
        //console.log(res);
        var near = res[0];

        const time = await DistinationDuration(
          near.location.coordinates[0],
          near.location.coordinates[1],
          data.long,
          data.lat
        );
        var driversList = [];
        res.map((driver) => {
          const temp = {
            lat: driver.location.coordinates[0],
            lng: driver.location.coordinates[1],
            driverID: driver.driverID,
            oldLat: driver.oldLocation.coordinates[0],
            oldLng: driver.oldLocation.coordinates[1],
          };
          if (driversList.length < 5) driversList.push(temp);
        });
        const data1 = {
          drivers: driversList,
          time:
            time[0].duration == undefined
              ? -1
              : (time[0].duration.value / 60).toFixed(),
        };
        let user_id = users.get(data.userid);
        // console.log(user_id);
        io.to(user_id).emit("getavailable", data1);
      });
      const fun = () => {
        if (
          users.get(data.userid) == undefined ||
          userinterval.get(data.userid) != id
        ) {
          clearInterval(interval);
          //console.log("kkkkkkkkk");
        }
        DriverM.find({
          isBusy: false,
          isOnline: true,
          isDeleted: false,
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [data.lat, data.long],
              },
              //   $maxDistance: 5000,
            },
          },
        }).then(async (res) => {
          var near = res[0];
          console.log(
            near.location.coordinates[0],
            near.location.coordinates[1],
            data.long,
            data.lat
          );

          const time = await DistinationDuration(
            near.location.coordinates[0],
            near.location.coordinates[1],
            data.long,
            data.lat
          );
          var driversList = [];
          res.map((driver) => {
            const temp = {
              lat: driver.location.coordinates[0],
              lng: driver.location.coordinates[1],
              driverID: driver.driverID,
              oldLat: driver.oldLocation.coordinates[0],
              oldLng: driver.oldLocation.coordinates[1],
            };
            if (driversList.length < 5) driversList.push(temp);
          });
          const data1 = {
            drivers: driversList,
            time:
              time[0].duration == undefined
                ? -1
                : (time[0].duration.value / 60).toFixed(),
          };
          if (
            users.get(data.userid) != undefined ||
            userinterval.get(data.userid) == id
          ) {
            let user_id = users.get(data.userid);
            //console.log(user_id);
            io.to(user_id).emit("getavailable", data1);
          }
        });
      };
      var interval = setInterval(fun, 20000);
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("listCategory", async (data) => {
    const id = uuidv4();
    listinterval.set(data.userid, id);
    var discountType = -1;
    var discountValue = 0;
    //console.log(data);

    const config = {
      method: "post",
      url: `http://devmachine.taketosa.com/api/Trip/CheckPromoCode?promoCode=${data.promoCode}`,
      headers: {
        "Content-Type": "application / json",
        Authorization: "Bearer " + data.token,
      },
    };
    if (data.promoCode != "") {
      let promoResponse = await axios(config).then((res) => {
        console.log(res.data);
        if ((!res.data.status || !res.data.data.isValid) && data.promoCode) {
          var user_id = users.get(data.userId);
          discountValue = -1;
          //console.log(user_id);
          io.to(user_id).emit("promoCode", {
            message: res.data.message,
            status: false,
          });
        } else if (res.data.data.isValid) {
          discountType = res.data.data.discountType;
          discountValue = res.data.data.discountValue;
          var user_id = users.get(data.userId);
          io.to(user_id).emit("promoCode", {
            status: true,
          });
        }
      });
    }
    //console.log(discountType, discountValue);
    if (discountValue != -1) {
      try {
        const time = await DistinationDuration(
          data.dropoffLat,
          data.dropoffLng,
          data.pickupLng,
          data.pickupLat
        ).then(async (time) => {
          const category = await CategoryFareM.find({}).then(async (res) => {
            //console.log("tttt", res);

            var responseArray = [];
            var mainCatTime;
            for (var i = 1; i <= res.length; i++) {
              //console.log(i);
              const temp = await DriverM.findOne({
                isBusy: false,
                isOnline: true,
                isDeleted: false,
                location: {
                  $near: {
                    $geometry: {
                      type: "Point",
                      coordinates: [data.pickupLat, data.pickupLng],
                    },
                    //$maxDistance: 5000,
                  },
                },
                categoryCarTypeID: i,
              }).then(async (driver) => {
                if (i == 1 && driver == null) {
                  //console.log(i, driver);
                  let user_id = users.get(data.userid);
                  io.to(user_id).emit("getavailable", {
                    msg: "لا يوجد سائق متاح في منطقتك حالياً",
                  });
                } else if (driver != null) {
                  //console.log(driver);
                  const e = await DistinationDuration(
                    driver.location.coordinates[0],
                    driver.location.coordinates[1],
                    data.pickupLng,
                    data.pickupLat
                  ).then(async (driverTime) => {
                    //  console.log("nm", i, driverTime);
                    const Cost = await tripCost(
                      data.pickupLng,
                      data.pickupLat,
                      data.dropoffLng,
                      data.dropoffLat,
                      driver.categoryCarTypeID,
                      discountType,
                      discountValue
                    ).then((cost) => {
                      // console.log("cost", i, cost);
                      responseArray.push({
                        NameAR: driver.driverNameAr,
                        NameEn: driver.driverNameEn,
                        Photo: res[i - 1].categoryImage,
                        Minutes: (driverTime[0].duration.value / 60).toFixed(),
                        dest: (driverTime[0].distance.value / 1000).toFixed(),
                        Cost: cost,
                        isMain: res[i - 1].isMain,
                      });
                      if (res[i - 1].isMain)
                        mainCatTime = (
                          driverTime[0].duration.value / 60
                        ).toFixed();
                    });
                    //console.log(driver.driverImage);
                  });
                }
              });
            }

            var driveTime = driveTimeCalc(
              parseInt(time[0].duration.value / 60),
              mainCatTime
            );
            const data1 = {
              categories: responseArray,
              mainCatTime,
              driveTime,
            };
            //console.log(data1);
            var user_id = users.get(data.userId);
            io.to(user_id).emit("listCategory", data1);
          });
          const fun = () => {
            if (
              users.get(data.userid) == undefined ||
              listinterval.get(data.userid) != id
            ) {
              clearInterval(interval);
              //console.log("kkkkkkkkk");
            }
            const category = CategoryFareM.find({}).then(async (res) => {
              //console.log("tttt", res);

              var responseArray = [];
              var mainCatTime;
              for (var i = 1; i <= res.length; i++) {
                //console.log(i);
                const temp = await DriverM.findOne({
                  isBusy: false,
                  isOnline: true,
                  isDeleted: false,
                  location: {
                    $near: {
                      $geometry: {
                        type: "Point",
                        coordinates: [data.pickupLat, data.pickupLng],
                      },
                      //$maxDistance: 5000,
                    },
                  },
                  categoryCarTypeID: i,
                }).then(async (driver) => {
                  if (i == 1 && driver == null) {
                    let user_id = users.get(data.userid);
                    io.to(user_id).emit("getavailable", {
                      msg: "لا يوجد سائق متاح في منطقتك حالياً",
                    });
                  } else if (driver != null) {
                    //  console.log(driver);
                    const e = await DistinationDuration(
                      driver.location.coordinates[0],
                      driver.location.coordinates[1],
                      data.pickupLng,
                      data.pickupLat
                    ).then(async (driverTime) => {
                      //  console.log("nm", i, driverTime);
                      const Cost = await tripCost(
                        data.pickupLng,
                        data.pickupLat,
                        data.dropoffLng,
                        data.dropoffLat,
                        driver.categoryCarTypeID,
                        discountType,
                        discountValue
                      ).then((cost) => {
                        //   console.log("cost", i, cost);
                        responseArray.push({
                          NameAR: driver.driverNameAr,
                          NameEn: driver.driverNameEn,
                          Photo: res[i - 1].categoryImage,
                          Minutes: (
                            driverTime[0].duration.value / 60
                          ).toFixed(),
                          dest: (driverTime[0].distance.value / 1000).toFixed(),
                          Cost: cost,
                          isMain: res[i - 1].isMain,
                        });
                        if (res[i - 1].isMain)
                          mainCatTime = (
                            driverTime[0].duration.value / 60
                          ).toFixed();
                      });
                    });
                  }
                });
              }

              var driveTime = driveTimeCalc(
                parseInt(time[0].duration.value / 60),
                mainCatTime
              );
              const data1 = {
                categories: responseArray,
                mainCatTime,
                driveTime,
              };
              //  console.log(data1);
              if (
                users.get(data.userid) != undefined ||
                listinterval.get(data.userid) == id
              ) {
                var user_id = users.get(data.userId);
                console.log(id);
                io.to(user_id).emit("listCategory", data1);
              }
            });
          };
          var interval = setInterval(fun, 20000);
        });
      } catch {}
    }
  });

  socket.on("trackCategory", async (data) => {
    const id = uuidv4();
    //console.log(id);
    trackinterval.set(data.userid, id);
    var discountType = -1;
    var discountValue = 0;
    console.log(data);

    const config = {
      method: "post",
      url: `http://devmachine.taketosa.com/api/Trip/CheckPromoCode?promoCode=${data.promoCode}`,
      headers: {
        "Content-Type": "application / json",
        Authorization: "Bearer " + data.token,
      },
    };
    if (data.promoCode != "") {
      let promoResponse = await axios(config).then((res) => {
        console.log(res.data);
        if ((!res.data.status || !res.data.data.isValid) && data.promoCode) {
          var user_id = users.get(data.userId);
          discountValue = -1;
          console.log(user_id);
          io.to(user_id).emit("promoCode", {
            message: res.data.message,
            status: false,
          });
        } else if (res.data.data.isValid) {
          discountType = res.data.data.discountType;
          discountValue = res.data.data.discountValue;
          io.to(user_id).emit("promoCode", {
            message: res.data.message,
            status: false,
          });
        }
      });
    }
    console.log(discountType, discountValue);
    if (discountValue != -1) {
      try {
        const time = await DistinationDuration(
          data.dropoffLat,
          data.dropoffLng,
          data.pickupLng,
          data.pickupLat
        ).then(async (time) => {
          const category = await CategoryFareM.findOne({
            categoryCarTypeID: data.carCategory,
          }).then(async (res) => {
            //console.log("tttt", res);
            const d = await DriverM.findOne({
              isBusy: false,
              isOnline: true,
              isDeleted: false,
              location: {
                $near: {
                  $geometry: {
                    type: "Point",
                    coordinates: [data.pickupLat, data.pickupLng],
                  },
                  //$maxDistance: 5000,
                },
              },
              categoryCarTypeID: data.carCategory,
            }).then(async (driver) => {
              if (driver == null) {
                let user_id = users.get(data.userid);
                io.to(user_id).emit("trackCategory", {
                  msg: "لا يوجد سائق متاح في منطقتك حالياً",
                });
              } else if (driver != null) {
                //  console.log(driver);
                const e = await DistinationDuration(
                  driver.location.coordinates[0],
                  driver.location.coordinates[1],
                  data.pickupLng,
                  data.pickupLat
                ).then(async (driverTime) => {
                  // console.log("nm", driverTime);
                  const Cost = await tripCost(
                    data.pickupLng,
                    data.pickupLat,
                    data.dropoffLng,
                    data.dropoffLat,
                    driver.categoryCarTypeID,
                    discountType,
                    discountValue
                  ).then((cost) => {
                    const temp = {
                      NameAR: driver.driverNameAr,
                      NameEn: driver.driverNameEn,
                      Photo: driver.driverImage,
                      Minutes: (driverTime[0].duration.value / 60).toFixed(),
                      dest: (driverTime[0].distance.value / 1000).toFixed(),
                      Cost: cost,
                    };
                    var driveTime = driveTimeCalc(
                      (time[0].duration.value / 60).toFixed(),
                      (driverTime[0].duration.value / 60).toFixed()
                    );

                    const data1 = {
                      categories: temp,
                      driveTime,
                    };
                    // console.log(data1);
                    var user_id = users.get(data.userId);
                    io.to(user_id).emit("trackCategory", data1);
                  });
                });
              }
            });
            const fun = () => {
              //console.log(id);
              if (
                users.get(data.userid) == undefined ||
                trackinterval.get(data.userid) != id
              ) {
                clearInterval(interval);
                //console.log("kkkkkkkkk");
              }
              DriverM.findOne({
                isBusy: false,
                isOnline: true,
                isDeleted: false,
                location: {
                  $near: {
                    $geometry: {
                      type: "Point",
                      coordinates: [data.pickupLat, data.pickupLng],
                    },
                    //$maxDistance: 5000,
                  },
                },
                categoryCarTypeID: data.carCategory,
              }).then(async (driver) => {
                if (driver == null) {
                  let user_id = users.get(data.userid);
                  io.to(user_id).emit("trackCategory", {
                    msg: "لا يوجد سائق متاح في منطقتك حالياً",
                  });
                } else if (driver != null) {
                  //  console.log(driver);
                  const e = await DistinationDuration(
                    driver.location.coordinates[0],
                    driver.location.coordinates[1],
                    data.pickupLng,
                    data.pickupLat
                  ).then(async (driverTime) => {
                    // console.log("nm", driverTime);
                    const Cost = await tripCost(
                      data.pickupLng,
                      data.pickupLat,
                      data.dropoffLng,
                      data.dropoffLat,
                      driver.categoryCarTypeID,
                      discountType,
                      discountValue
                    ).then((cost) => {
                      const temp = {
                        NameAR: driver.driverNameAr,
                        NameEn: driver.driverNameEn,
                        Photo: driver.driverImage,
                        Minutes: (driverTime[0].duration.value / 60).toFixed(),
                        dest: (driverTime[0].distance.value / 1000).toFixed(),
                        Cost: cost,
                      };
                      var driveTime = driveTimeCalc(
                        (time[0].duration.value / 60).toFixed(),
                        (driverTime[0].duration.value / 60).toFixed()
                      );
                      const data1 = {
                        categories: temp,
                        driveTime,
                      };
                      //console.log(data1);
                      if (
                        users.get(data.userid) != undefined ||
                        trackinterval.get(data.userid) == id
                      ) {
                        var user_id = users.get(data.userId);
                        io.to(user_id).emit("listCategory", data1);
                      }
                    });
                  });
                }
              });
            };
            var interval = setInterval(fun, 20000);
          });
        });
      } catch {}
    }
  });

  socket.on("AdminGetDrivers", (data) => {
    //console.log(data);
    try {
      if (data.lat == 0) {
        DriverM.find({
          isDeleted: false,
        }).then(async (res) => {
          var list = [];
          res.map((driver) => {
            const temp = {
              status:
                driver.isOnline === true && driver.isBusy == false
                  ? 1
                  : driver.isOnline == true && driver.isBusy == true
                  ? 2
                  : driver.isOnline == false
                  ? 3
                  : 0,
              driverID: driver.driverID,
              location: driver.location,
              categoryCarTypeID: driver.categoryCarTypeID,
              phoneNumber: driver.phoneNumber,
              idNo: driver.idNo,
              driverNameAr: driver.driverNameAr,
              driverNameEn: driver.driverNameEn,
              modelNameAr: driver.modelNameAr,
              modelNameEn: driver.modelNameEn,
              colorNameAr: driver.colorNameAr,
              colorNameEn: driver.colorNameEn,
              carImage: driver.carImage,
              driverImage: driver.driverImage,
              updateLocationDate: driver.updateLocationDate,
              trip: driver.isBusy ? driver.busyTrip : "",
            };
            list.push(temp);
          });
          // console.log(list);

          admins.forEach((admin) => {
            // console.log(admin);
            io.to(admin).emit("AdminGetDrivers", list);
          });
        });
      } else {
        DriverM.find({
          isDeleted: false,
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [data.lat, data.lng],
              },
              $maxDistance: data.maxDistance,
            },
          },
        }).then(async (res) => {
          var list = [];
          res.map((driver) => {
            const temp = {
              status:
                driver.isOnline === true && driver.isBusy == false
                  ? 1
                  : driver.isOnline == true && driver.isBusy == true
                  ? 2
                  : driver.isOnline == false
                  ? 3
                  : 0,
              driverID: driver.driverID,
              location: driver.location,
              categoryCarTypeID: driver.categoryCarTypeID,
              phoneNumber: driver.phoneNumber,
              idNo: driver.idNo,
              driverNameAr: driver.driverNameAr,
              driverNameEn: driver.driverNameEn,
              modelNameAr: driver.modelNameAr,
              modelNameEn: driver.modelNameEn,
              colorNameAr: driver.colorNameAr,
              colorNameEn: driver.colorNameEn,
              carImage: driver.carImage,
              driverImage: driver.driverImage,
              updateLocationDate: driver.updateLocationDate,
              trip: driver.isBusy ? driver.busyTrip : "",
            };
            list.push(temp);
          });

          admins.forEach((admin) => {
            // console.log(admin);
            io.to(admin).emit("AdminGetDrivers", list);
          });
        });
      }
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("AdminGetCount", (data) => {
    console.log(data);
    try {
      if (data.lat === 0) {
        DriverM.find({
          isBusy: true,
        }).then(async (busy) => {
          DriverM.find({
            isOnline: true,
            isBusy: false,
          }).then(async (online) => {
            DriverM.find({
              isOnline: false,
            }).then((offline) => {
              const data = {
                busy: busy.length,
                online: online.length,
                offline: offline.length,
                total: busy.length + online.length + offline.length,
              };
              console.log(data, "dfljklj");

              admins.forEach((admin) => {
                // console.log(admin);
                io.to(admin).emit("AdminGetCount", data);
              });
            });
          });
        });
      } else {
        DriverM.find({
          isBusy: true,
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [data.lat, data.lng],
              },
              $maxDistance: data.maxDistance,
            },
          },
        }).then(async (busy) => {
          DriverM.find({
            isOnline: true,
            isBusy: false,
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [data.lat, data.lng],
                },
                $maxDistance: data.maxDistance,
              },
            },
          }).then(async (online) => {
            DriverM.find({
              isOnline: false,
              location: {
                $near: {
                  $geometry: {
                    type: "Point",
                    coordinates: [data.lat, data.lng],
                  },
                  $maxDistance: data.maxDistance,
                },
              },
            }).then((offline) => {
              const data = {
                busy: busy.length,
                online: online.length,
                offline: offline.length,
                total: busy.length + online.length + offline.length,
              };
              console.log(data);

              admins.forEach((admin) => {
                // console.log(admin);
                io.to(admin).emit("AdminGetCount", data);
              });
            });
          });
        });
      }
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("join", (id) => {
    users.set(id, socket.id);
    console.log(users);
  });

  socket.on("joinAdmin", (id) => {
    admins.set(id, socket.id);
    console.log(admins);
  });

  socket.on("disconnect", (number) => {
    users.delete(number);
    listinterval.delete(number);
    userinterval.delete(number);
    trackinterval.delete(number);
    console.log("user disconnected");
  });

  socket.on("disconnectAdmin", (number) => {
    admins.delete(number);
    console.log("admin disconnected");
  });
});

const Port = process.env.Port || 5000;
server.listen(Port, () => {
  console.log(` Server running on port ${Port}`);
});

const DistinationDuration = async (
  originlat,
  originlong,
  destinlong,
  destinlat
) => {
  var resp = await axios.get(
    "https://maps.googleapis.com/maps/api/distancematrix/json?origins=" +
      originlat +
      "," +
      originlong +
      "&destinations=" +
      destinlat +
      "," +
      destinlong +
      "&key=" +
      google_Key
  );
  // console.log(resp);
  return resp.data.rows[0].elements;
};

const tripCost = async (
  pickupLng,
  pickupLat,
  dropoffLng,
  dropoffLat,
  carCategory,
  discountType,
  discountValue
) => {
  const timedest = await DistinationDuration(
    pickupLat,
    pickupLng,
    dropoffLng,
    dropoffLat
  );
  var distanceTime = (timedest[0].duration.value / 60).toFixed();
  var distanceKM = (timedest[0].distance.value / 1000).toFixed(1);
  //console.log(distanceTime, distanceKM);
  const CategoryFare = await CategoryFareM.findOne({
    categoryCarTypeID: carCategory,
  });
  //console.log(CategoryFare);
  const tax = await DeliverySettingM.find({
    sort: 1,
  });
  //console.log(distanceKM , CategoryFare.minKM,CategoryFare.baseFare)
  var KMCost = (distanceKM - CategoryFare.minKM) * CategoryFare.baseFare;
  //console.log(KMCost)
  //if (KMCost < 3) KMCost = 0;
  var MinCost = distanceTime * CategoryFare.fareMinute;
  var MinFare = CategoryFare.minFare;
  var subTotal = KMCost + MinCost + MinFare;
  //console.log(subTotal);
  if (discountType != -1) {
    //console.log("kljlk", discountType, subTotal, discountValue);

    var discountCost =
      discountType === 1 ? discountValue : (subTotal * discountValue) / 100;
    var TotalAfterDis = subTotal - discountCost;
    //console.log(discountCost, TotalAfterDis);
  } else {
    TotalAfterDis = subTotal;
  }
  var VatCost = (tax * TotalAfterDis) / 100;
  // console.log(TotalAfterDis + VatCost, "kkjkljkl");
  return (TotalAfterDis + VatCost).toFixed(2);
};

function AddMinutesToDate(date, minutes, min) {
  return new Date(date.getTime() + minutes * 60000 + min * 60000);
}
function DateFormat(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  minutes = minutes < 10 ? "0" + minutes : minutes;
  var strTime = hours + ":" + minutes;
  return strTime;
}
const driveTimeCalc = (time1, time2) => {
  var now = new Date();
  var next = AddMinutesToDate(now, time1, time2);
  return DateFormat(next);
};
