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
const {fdatasync} = require("fs");
const {v4: uuidv4} = require("uuid");
const Driver = require("./models/Driver");

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
        console.log(res.data);
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
              pickAddress: data.pickAddress,
              dropoffLat: dropoffLat,
              dropoffLng: dropoffLng,
              dropoffAddress: data.dropoffAddress,
              promoCode: data.promoCode,
              categoryCarTypeID: data.categoryCarTypeID,
              cancelReasonID: 0,
              paymentStatusID: data.paymentStatusID,
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
            var dist = parseInt(driverTime[0].distance.value / 1000);
            if (dist === 0) dist++;
            var from_to = {
              pickupLat: pickupLat,
              pickupLng: pickupLng,
              pickAddress: data.pickAddress,
              dropoffLat: dropoffLat,
              dropoffLng: dropoffLng,
              dropoffAddress: data.dropoffAddress,
              userId: userID,
              tripID: Trip_ID,
              driverTime: parseInt(driverTime[0].duration.value / 60),
              distance: dist,
              paymentStatusID: data.paymentStatusID,
            };
            //console.log(from_to)

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

              if (drivers.length > 1)
                var reachTime1 = await DistinationDuration(
                  pickupLat,
                  pickupLng,
                  drivers[1].location.coordinates[1],
                  drivers[1].location.coordinates[0]
                );
              if (drivers.length > 2)
                var reachTime2 = await DistinationDuration(
                  pickupLat,
                  pickupLng,
                  drivers[2].location.coordinates[1],
                  drivers[2].location.coordinates[0]
                );

              from_to.reachTime = parseInt(reachTime[0].duration.value / 60);
              from_to.arriveTime = driveTimeCalc(0, from_to.reachTime);

              var totalUserTime = driveTimeCalc(
                from_to.driverTime,
                from_to.reachTime
              );

              from_to.totalUserTime = totalUserTime;

              try {
                admin
                  .messaging()
                  .sendToDevice(
                    drivers[0].tokenID,
                    {data: {message: "you have a new trip"}},
                    notification_options
                  )
                  .then(() => {
                    var distance = 20;
                    var now = 0;
                    console.log(users.get(drivers[0].driverID), "driver");
                    console.log(users.get(userID), "user");
                    console.log(
                      from_to,
                      users.get(drivers[0].driverID),
                      drivers[0].driverID
                    );
                    socket
                      .to(users.get(drivers[0].driverID))
                      .emit("tripInfo", from_to);

                    var x = setInterval(function () {
                      now++;
                      socket.on("driverRespond", (data2) => {
                        console.log(data2);
                        clearInterval(x);
                        socket
                          .to(users.get(drivers[0].driverID))
                          .emit("driverRespond", data2);
                      });
                      socket.on("cancel", (data3) => {
                        try {
                          trip.cancelReasonID = data3;
                          admin
                            .messaging()
                            .sendToDevice(
                              drivers[0].tokenID,
                              {data: {message: "trip canceled"}},
                              notification_options
                            )
                            .then(() => {
                              try {
                                trip.tripDrivers = dr;
                                const savedTrip = trip.save();
                                savedTrip.then((saved) => {
                                  try {
                                    axios({
                                      method: "post",
                                      url:
                                        "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                      data: saved,
                                      headers: {
                                        Authorization: `Bearer ${data.token}`,
                                      },
                                    });
                                  } catch (error) {
                                    console.log("abc");
                                  }
                                });
                              } catch (error) {
                                console.log(error);
                              }
                            });
                        } catch (error) {
                          console.log("error");
                        }
                        clearInterval(x);
                      });
                      if (now === distance) {
                        clearInterval(x);
                        console.log("clear interval");
                        socket
                          .to(users.get(drivers[0].driverID))
                          .emit("driverRespond", {requestStatus: 3});
                      }
                    }, 1000);
                  })
                  .then("driverRespond", async (data1) => {
                    console.log("god");
                    requestStatus = data1.requestStatus;
                    dr.push({
                      driverID: drivers[0].driverID,
                      requestStatus: requestStatus,
                      location: drivers[0].location,
                      actionDate: Date.now(),
                    });

                    if (data1.requestStatus === 1) {
                      ////// save trip
                      try {
                        trip.tripDrivers = dr;
                        DriverM.update(
                          {
                            driverID: drivers[0].driverID,
                          },
                          {
                            $set: {
                              isBusy: true,
                              busyTrip: from_to,
                            },
                          }
                        )
                          .then(() => {
                            const savedTrip = trip.save();
                          })
                          .then(() => {
                            console.log(saved);
                            savedTrip
                              .then((saved) => {
                                try {
                                  axios({
                                    method: "post",
                                    url:
                                      "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                    data: saved,
                                    headers: {
                                      Authorization: `Bearer ${data.token}`,
                                    },
                                  }).then((res) => {
                                    var obj = res.data;
                                    obj.location = drivers[0].location;
                                    obj.reachTime = from_to.reachTime;
                                    obj.driverTime = from_to.driverTime;
                                    obj.tripCost = from_to.tripCost;
                                    obj.totalUserTime = totalUserTime;
                                    admin.messaging().sendToDevice(
                                      data.registrationToken,
                                      {
                                        data: {
                                          message: `trip has been approved from ${pickAddress} to ${dropoffAddress} `,
                                        },
                                      },
                                      notification_options
                                    );
                                    socket
                                      .to(users.get(userID))
                                      .emit("tripInfo", obj);
                                  });
                                } catch (erro) {
                                  console.log("abs");
                                }
                              })
                              .then(async () => {
                                const data = {
                                  status:
                                    drivers[0].isOnline === true &&
                                    drivers[0].isBusy == false
                                      ? 1
                                      : drivers[0].isOnline == true &&
                                        drivers[0].isBusy == true
                                      ? 2
                                      : drivers[0].isOnline == false
                                      ? 3
                                      : 0,
                                  driverID: drivers[0].driverID,
                                  location: drivers[0].location,
                                  categoryCarTypeID:
                                    drivers[0].categoryCarTypeID,
                                  phoneNumber: drivers[0].phoneNumber,
                                  idNo: drivers[0].idNo,
                                  driverNameAr: drivers[0].driverNameAr,
                                  driverNameEn: drivers[0].driverNameEn,
                                  modelNameAr: drivers[0].modelNameAr,
                                  modelNameEn: drivers[0].modelNameEn,
                                  colorNameAr: drivers[0].colorNameAr,
                                  colorNameEn: drivers[0].colorNameEn,
                                  carImage: drivers[0].carImage,
                                  driverImage: drivers[0].driverImage,
                                  updateLocationDate:
                                    drivers[0].updateLocationDate,
                                  trip: drivers[0].isBusy
                                    ? drivers[0].busyTrip
                                    : "",
                                };
                                console.log(data);
                                admins.forEach((admin) => {
                                  socket.to(admin).emit("trackAdmin", data);
                                  socket.to(admin).emit("trackCount"); ////////////////////////// need some data
                                });
                              })
                              .then(() => {
                                var tr = setInterval(function () {
                                  DriverM.find({driverID: dr[0].driverID}).then(
                                    (driver) => {
                                      socket
                                        .to(users.get(userID))
                                        .emit(
                                          "trackDriverLocation",
                                          driver.location
                                        );
                                    }
                                  );
                                  socket.on("arrive", () => {
                                    clearInterval(tr);
                                  });
                                }, 1000);
                                socket.on("finish", () => {
                                  socket.to(users.get(userID)).emit("finish");
                                });
                              })
                              .catch((error) => {
                                console.log(error);
                              });
                          });
                      } catch (error) {
                        console.log(error);
                      }
                    } else if (drivers.length > 1) {
                      from_to.reachTime = parseInt(
                        reachTime1[0].duration.value / 60
                      );
                      from_to.arriveTime = driveTimeCalc(0, from_to.reachTime);

                      var totalUserTime = driveTimeCalc(
                        from_to.driverTime,
                        from_to.reachTime
                      );

                      from_to.totalUserTime = totalUserTime;
                      try {
                        admin
                          .messaging()
                          .sendToDevice(
                            drivers[1].tokenID,
                            {data: {message: "you have a new trip"}},
                            notification_options
                          )
                          .then(() => {
                            var distance = 20;
                            var now = 0;
                            socket
                              .to(users.get(drivers[1].tokenID))
                              .emit("tripInfo", from_to);
                            var x = setInterval(function () {
                              now++;
                              socket.on("driverRespond", (data2) => {
                                clearInterval(x);
                                socket
                                  .to(users.get(drivers[1].driverID))
                                  .emit("driverRespond", data2);
                              });
                              socket.on("cancel", (data3) => {
                                try {
                                  trip.cancelReasonID = data3;
                                  admin
                                    .messaging()
                                    .sendToDevice(
                                      drivers[1].tokenID,
                                      {data: {message: "trip canceled"}},
                                      notification_options
                                    )
                                    .then(() => {
                                      try {
                                        trip.tripDrivers = dr;
                                        const savedTrip = trip.save();
                                        savedTrip.then((saved) => {
                                          try {
                                            axios({
                                              method: "post",
                                              url:
                                                "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                              data: saved,
                                              headers: {
                                                Authorization: `Bearer ${data.token}`,
                                              },
                                            });
                                          } catch (error) {
                                            console.log("abc");
                                          }
                                        });
                                      } catch (error) {
                                        console.log(error);
                                      }
                                    });
                                } catch (error) {
                                  console.log("error");
                                }
                                clearInterval(x);
                              });
                              if (now === distance) {
                                clearInterval(x);
                                console.log("clear interval");
                                socket
                                  .to(users.get(drivers[1].driverID))
                                  .emit("driverRespond", {requestStatus: 3});
                              }
                            }, 1000);
                          })
                          .then("driverRespond", async (data1) => {
                            requestStatus = data1.requestStatus;
                            dr.push({
                              driverID: drivers[1].driverID,
                              requestStatus: requestStatus,
                              location: drivers[1].location,
                              actionDate: Date.now(),
                            });
                            if (data1.requestStatus === 1) {
                              ////// save trip
                              try {
                                trip.tripDrivers = dr;
                                DriverM.update(
                                  {
                                    driverID: drivers[1].driverID,
                                  },
                                  {
                                    $set: {
                                      isBusy: true,
                                      busyTrip: from_to,
                                    },
                                  }
                                )
                                  .then(() => {
                                    const savedTrip = trip.save();
                                  })
                                  .then(() => {
                                    savedTrip
                                      .then((saved) => {
                                        try {
                                          axios({
                                            method: "post",
                                            url:
                                              "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                            data: saved,
                                            headers: {
                                              Authorization: `Bearer ${data.token}`,
                                            },
                                          }).then((res) => {
                                            var obj = res.data;
                                            obj.location = drivers[1].location;
                                            obj.reachTime = from_to.reachTime;
                                            obj.driverTime = from_to.driverTime;
                                            obj.tripCost = from_to.tripCost;
                                            obj.totalUserTime = totalUserTime;
                                            admin.messaging().sendToDevice(
                                              data.registrationToken,
                                              {
                                                data: {
                                                  message: `trip has been approved from ${pickAddress} to ${dropoffAddress} `,
                                                },
                                              },
                                              notification_options
                                            );
                                            socket
                                              .to(users.get(userID))
                                              .emit("tripInfo", obj);
                                          });
                                        } catch (erro) {
                                          console.log("abs");
                                        }
                                      })
                                      .then(async () => {
                                        const data = {
                                          status:
                                            drivers[1].isOnline === true &&
                                            drivers[1].isBusy == false
                                              ? 1
                                              : drivers[1].isOnline == true &&
                                                drivers[1].isBusy == true
                                              ? 2
                                              : drivers[1].isOnline == false
                                              ? 3
                                              : 0,
                                          driverID: drivers[1].driverID,
                                          location: drivers[1].location,
                                          categoryCarTypeID:
                                            drivers[1].categoryCarTypeID,
                                          phoneNumber: drivers[1].phoneNumber,
                                          idNo: drivers[1].idNo,
                                          driverNameAr: drivers[1].driverNameAr,
                                          driverNameEn: drivers[1].driverNameEn,
                                          modelNameAr: drivers[1].modelNameAr,
                                          modelNameEn: drivers[1].modelNameEn,
                                          colorNameAr: drivers[1].colorNameAr,
                                          colorNameEn: drivers[1].colorNameEn,
                                          carImage: drivers[1].carImage,
                                          driverImage: drivers[1].driverImage,
                                          updateLocationDate:
                                            drivers[1].updateLocationDate,
                                          trip: drivers[1].isBusy
                                            ? drivers[1].busyTrip
                                            : "",
                                        };
                                        console.log(data);
                                        admins.forEach((admin) => {
                                          socket
                                            .to(admin)
                                            .emit("trackAdmin", data);
                                          socket.to(admin).emit("trackCount"); ////////////////////////// need some data
                                        });
                                      })
                                      .then(() => {
                                        var tr = setInterval(function () {
                                          DriverM.find({
                                            driverID: dr[1].driverID,
                                          }).then((driver) => {
                                            socket
                                              .to(users.get(userID))
                                              .emit(
                                                "trackDriverLocation",
                                                driver.location
                                              );
                                          });
                                          socket.on("arrive", () => {
                                            clearInterval(tr);
                                          });
                                        }, 1000);
                                        socket.on("finish", () => {
                                          socket
                                            .to(users.get(userID))
                                            .emit("finish");
                                        });
                                      })
                                      .catch((error) => {
                                        console.log(error);
                                      });
                                  });
                              } catch (error) {
                                console.log(error);
                              }
                            } else if (drivers.length > 2) {
                              from_to.reachTime = parseInt(
                                reachTime2[0].duration.value / 60
                              );
                              from_to.arriveTime = driveTimeCalc(
                                0,
                                from_to.reachTime
                              );

                              var totalUserTime = driveTimeCalc(
                                from_to.driverTime,
                                from_to.reachTime
                              );

                              from_to.totalUserTime = totalUserTime;
                              try {
                                admin
                                  .messaging()
                                  .sendToDevice(
                                    drivers[2].tokenID,
                                    {data: {message: "you have a new trip"}},
                                    notification_options
                                  )
                                  .then(() => {
                                    var distance = 20;
                                    var now = 0;
                                    socket
                                      .to(users.get(drivers[2].tokenID))
                                      .emit("tripInfo", from_to);
                                    var x = setInterval(function () {
                                      now++;
                                      socket.on("driverRespond", (data2) => {
                                        clearInterval(x);
                                        socket
                                          .to(users.get(drivers[2].driverID))
                                          .emit("driverRespond", data2);
                                      });
                                      socket.on("cancel", (data3) => {
                                        try {
                                          trip.cancelReasonID = data3;
                                          admin
                                            .messaging()
                                            .sendToDevice(
                                              drivers[2].tokenID,
                                              {
                                                data: {
                                                  message: "trip canceled",
                                                },
                                              },
                                              notification_options
                                            )
                                            .then(() => {
                                              try {
                                                trip.tripDrivers = dr;
                                                const savedTrip = trip.save();
                                                savedTrip.then((saved) => {
                                                  try {
                                                    axios({
                                                      method: "post",
                                                      url:
                                                        "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                                      data: saved,
                                                      headers: {
                                                        Authorization: `Bearer ${data.token}`,
                                                      },
                                                    });
                                                  } catch (error) {
                                                    console.log("abc");
                                                  }
                                                });
                                              } catch (error) {
                                                console.log(error);
                                              }
                                            });
                                        } catch (error) {
                                          console.log("error");
                                        }
                                        clearInterval(x);
                                      });
                                      if (now === distance) {
                                        clearInterval(x);
                                        console.log("clear interval");
                                        socket
                                          .to(users.get(drivers[2].driverID))
                                          .emit("driverRespond", {
                                            requestStatus: 3,
                                          });
                                      }
                                    }, 1000);
                                  })
                                  .then("driverRespond", async (data1) => {
                                    requestStatus = data1.requestStatus;
                                    dr.push({
                                      driverID: drivers[2].driverID,
                                      requestStatus: requestStatus,
                                      location: drivers[2].location,
                                      actionDate: Date.now(),
                                    });
                                    if (data1.requestStatus === 1) {
                                      ////// save trip
                                      try {
                                        trip.tripDrivers = dr;
                                        DriverM.update(
                                          {
                                            driverID: drivers[2].driverID,
                                          },
                                          {
                                            $set: {
                                              isBusy: true,
                                              busyTrip: from_to,
                                            },
                                          }
                                        )
                                          .then(() => {
                                            const savedTrip = trip.save();
                                          })
                                          .then(() => {
                                            savedTrip
                                              .then((saved) => {
                                                try {
                                                  axios({
                                                    method: "post",
                                                    url:
                                                      "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                                    data: saved,
                                                    headers: {
                                                      Authorization: `Bearer ${data.token}`,
                                                    },
                                                  }).then((res) => {
                                                    var obj = res.data;
                                                    obj.location =
                                                      drivers[2].location;
                                                    obj.reachTime =
                                                      from_to.reachTime;
                                                    obj.driverTime =
                                                      from_to.driverTime;
                                                    obj.tripCost =
                                                      from_to.tripCost;
                                                    obj.totalUserTime = totalUserTime;
                                                    admin
                                                      .messaging()
                                                      .sendToDevice(
                                                        data.registrationToken,
                                                        {
                                                          data: {
                                                            message: `trip has been approved from ${pickAddress} to ${dropoffAddress} `,
                                                          },
                                                        },
                                                        notification_options
                                                      );
                                                    socket
                                                      .to(users.get(userID))
                                                      .emit("tripInfo", obj);
                                                  });
                                                } catch (erro) {
                                                  console.log("abs");
                                                }
                                              })
                                              .then(async () => {
                                                const data = {
                                                  status:
                                                    drivers[2].isOnline ===
                                                      true &&
                                                    drivers[2].isBusy == false
                                                      ? 1
                                                      : drivers[2].isOnline ==
                                                          true &&
                                                        drivers[2].isBusy ==
                                                          true
                                                      ? 2
                                                      : drivers[2].isOnline ==
                                                        false
                                                      ? 3
                                                      : 0,
                                                  driverID: drivers[2].driverID,
                                                  location: drivers[2].location,
                                                  categoryCarTypeID:
                                                    drivers[2]
                                                      .categoryCarTypeID,
                                                  phoneNumber:
                                                    drivers[2].phoneNumber,
                                                  idNo: drivers[2].idNo,
                                                  driverNameAr:
                                                    drivers[2].driverNameAr,
                                                  driverNameEn:
                                                    drivers[2].driverNameEn,
                                                  modelNameAr:
                                                    drivers[2].modelNameAr,
                                                  modelNameEn:
                                                    drivers[2].modelNameEn,
                                                  colorNameAr:
                                                    drivers[2].colorNameAr,
                                                  colorNameEn:
                                                    drivers[2].colorNameEn,
                                                  carImage: drivers[2].carImage,
                                                  driverImage:
                                                    drivers[2].driverImage,
                                                  updateLocationDate:
                                                    drivers[2]
                                                      .updateLocationDate,
                                                  trip: drivers[2].isBusy
                                                    ? drivers[2].busyTrip
                                                    : "",
                                                };
                                                console.log(data);
                                                admins.forEach((admin) => {
                                                  socket
                                                    .to(admin)
                                                    .emit("trackAdmin", data);
                                                  socket
                                                    .to(admin)
                                                    .emit("trackCount"); ////////////////////////// need some data
                                                });
                                              })
                                              .then(() => {
                                                var tr = setInterval(
                                                  function () {
                                                    DriverM.find({
                                                      driverID: dr[2].driverID,
                                                    }).then((driver) => {
                                                      socket
                                                        .to(users.get(userID))
                                                        .emit(
                                                          "trackDriverLocation",
                                                          driver.location
                                                        );
                                                    });
                                                    socket.on("arrive", () => {
                                                      clearInterval(tr);
                                                    });
                                                  },
                                                  1000
                                                );
                                                socket.on("finish", () => {
                                                  socket
                                                    .to(users.get(userID))
                                                    .emit("finish");
                                                });
                                              })
                                              .catch((error) => {
                                                console.log(error);
                                              });
                                          });
                                      } catch (error) {
                                        console.log(error);
                                      }
                                    } else {
                                      try {
                                        admin.messaging().sendToDevice(
                                          data.registrationToken,
                                          {
                                            data: {
                                              message:
                                                "there is no drivers available right now",
                                            },
                                          },
                                          notification_options
                                        );
                                      } catch (error) {
                                        console.log("abc");
                                      }
                                      ///// save trip
                                      try {
                                        trip.tripDrivers = dr;
                                        const savedTrip = trip.save();
                                        savedTrip.then((saved) => {
                                          try {
                                            axios({
                                              method: "post",
                                              url:
                                                "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                              data: saved,
                                              headers: {
                                                Authorization: `Bearer ${data.token}`,
                                              },
                                            });
                                          } catch (error) {
                                            console.log("abc");
                                          }
                                        });
                                      } catch (error) {
                                        console.log(error);
                                      }
                                    }
                                  });
                              } catch (error) {
                                console.log(error);
                              }
                            } else {
                              try {
                                admin.messaging().sendToDevice(
                                  data.registrationToken,
                                  {
                                    data: {
                                      message:
                                        "there is no drivers available right now",
                                    },
                                  },
                                  notification_options
                                );
                              } catch (error) {
                                console.log("abc");
                              }
                              ///// save trip
                              try {
                                trip.tripDrivers = dr;
                                const savedTrip = trip.save();
                                savedTrip.then((saved) => {
                                  try {
                                    axios({
                                      method: "post",
                                      url:
                                        "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                      data: saved,
                                      headers: {
                                        Authorization: `Bearer ${data.token}`,
                                      },
                                    });
                                  } catch (error) {
                                    console.log("abc");
                                  }
                                });
                              } catch (error) {
                                console.log(error);
                              }
                            }
                          });
                      } catch (error) {
                        console.log(error);
                      }
                    } else {
                      try {
                        admin.messaging().sendToDevice(
                          data.registrationToken,
                          {
                            data: {
                              message:
                                "there is no drivers available right now",
                            },
                          },
                          notification_options
                        );
                      } catch (error) {
                        console.log("abc");
                      }
                      ///// save trip
                      try {
                        trip.tripDrivers = dr;
                        const savedTrip = trip.save();
                        savedTrip.then((saved) => {
                          try {
                            axios({
                              method: "post",
                              url:
                                "https://devmachine.taketosa.com/api/Trip/NewTrip",
                              data: saved,
                              headers: {
                                Authorization: `Bearer ${data.token}`,
                              },
                            });
                          } catch (error) {
                            console.log("abc");
                          }
                        });
                      } catch (error) {
                        console.log(error);
                      }
                    }
                  });
              } catch (error) {
                console.log("asd");
              }
            }
          });
        });
      });
    }
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
              : parseInt(time[0].duration.value / 60),
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
                : parseInt(time[0].duration.value / 60),
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
    console.log("kljkljlk");
    listinterval.set(data.userid, id);
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
          var user_id = users.get(data.userId);
          io.to(user_id).emit("promoCode", {
            status: true,
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
                        Photo: driver.carImage,
                        Minutes: parseInt(driverTime[0].duration.value / 60),
                        dest: parseInt(driverTime[0].distance.value / 1000),
                        Cost: parseInt(cost),
                        isMain: res[i - 1].isMain,
                      });
                      if (res[i - 1].isMain)
                        mainCatTime = parseInt(
                          driverTime[0].duration.value / 60
                        );
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
            console.log(data1);
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
                          Photo: driver.driverImage,
                          Minutes: parseInt(driverTime[0].duration.value / 60),
                          dest: parseInt(driverTime[0].distance.value / 1000),
                          Cost: cost,
                          isMain: res[i - 1].isMain,
                        });
                        if (res[i - 1].isMain)
                          mainCatTime = parseInt(
                            driverTime[0].duration.value / 60
                          );
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
                      Minutes: parseInt(driverTime[0].duration.value / 60),
                      dest: parseInt(driverTime[0].distance.value / 1000),
                      Cost: cost,
                    };
                    var driveTime = driveTimeCalc(
                      parseInt(time[0].duration.value / 60),
                      parseInt(driverTime[0].duration.value / 60)
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
                        Minutes: parseInt(driverTime[0].duration.value / 60),
                        dest: parseInt(driverTime[0].distance.value / 1000),
                        Cost: cost,
                      };
                      var driveTime = driveTimeCalc(
                        parseInt(time[0].duration.value / 60),
                        parseInt(driverTime[0].duration.value / 60)
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
  var distanceTime = timedest[0].duration.value / 60;
  var distanceKM = timedest[0].distance.value / 1000;
  //console.log(carCategory)
  //console.log(distanceTime, distanceKM);
  const CategoryFare = await CategoryFareM.findOne({
    categoryCarTypeID: carCategory,
  });
  //console.log(CategoryFare);
  const tax = await DeliverySettingM.find({
    sort: 1,
  });
  var KMCost = (distanceKM - CategoryFare.minKM) * CategoryFare.baseFare;
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
  return TotalAfterDis + VatCost;
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
