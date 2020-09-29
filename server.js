const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");

const Driver = require("./routes/driver");
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

require("dotenv/config");

var google_Key = "AIzaSyCKW4oeH-_tRtLAT_sWK9G7wbgEOpxWAzI";

const app = express();
app.use(cors());
app.use(express.json());
var users = new Map();

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

app.use("/driver", Driver);

const server = http.createServer(app);
const io = socketIo(server);

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

  socket.on("newTrip", (data) => {
    const registrationToken = req.body.registrationToken;
    const options = notification_options;
    var userID = data.userId;
    var pickupLat = data.pickupLat;
    var pickupLng = data.pickupLng;
    var dropoffLat = data.dropoffLat;
    var dropoffLng = data.dropoffLng;
    DriverM.find({
      location: {
        $near: {
          $geometry: {type: "Point", coordinates: [pickupLat, pickupLng]},
          $maxDistance: 5000,
        },
      },
      isBusy: false,
      isOnline: true,
      isDeleted: false,
      categoryCarTypeID: data.categoryCarTypeID,
    }).then((drivers) => {
      console.log(drivers);
      ConstraintsM.findOne({name: "next"}).then((val) => {
        var Trip_ID = val.tripID;
        console.log(val, Trip_ID);
        ConstraintsM.update({name: "next"}, {$set: {tripID: Trip_ID + 1}}).then(
          () => {
            console.log("get drivers");
            var dr = [];
            const trip = new TripM({
              pickupLat: pickupLat,
              pickupLng: pickupLng,
              pickAddress: data.pickAddress,
              dropoffLat: dropoffLat,
              dropoffLng: dropoffLng,
              dropoffAddress: data.pickAddress,
              promoCode: data.promoCode,
              categoryCarTypeID: data.categoryCarTypeID,
              tripID: Trip_ID,
              tripStatusId: 2,
              tripDrivers: [],
            });
            var from_to = {
              pickupLat: pickupLat,
              pickupLng: pickupLng,
              pickAddress: data.pickAddress,
              dropoffLat: pickupLat,
              dropoffLng: pickupLng,
              dropoffAddress: data.pickAddress,
              userId: userID,
              tripID: Trip_ID,
            };

            if (drivers.length > 0) {
              admin
                .messaging()
                .sendToDevice(
                  users.get(drivers[0].driverID),
                  from_to,
                  notification_options
                )
                .on("driverRespond", (data) => {
                  requestStatus = data.requestStatus;
                  dr.push({
                    driverID: drivers[0].driverID,
                    requestStatus: requestStatus,
                    location: drivers[0].location,
                    actionDate: Date.now(),
                  });
                  if (data.requestStatus === 1) {
                    admin
                      .messaging()
                      .sendToDevice(
                        data.registrationToken,
                        {
                          message: "تم قبول رحلتك",
                          approved: true,
                          driver: dr[0],
                        },
                        notification_options
                      )
                      .then((response) => {
                        res.status(200).send("Notification sent successfully");
                      })
                      .catch((error) => {
                        console.log(error);
                      });
                    ////// save trip
                    try {
                      trip.tripDrivers = dr;
                      DriverM.update(
                        {driverID: drivers[0].driverID},
                        {$set: {isBusy: true, busyTrip: from_to}}
                      ).then(() => {
                        const savedTrip = trip.save();
                      });
                      savedTrip.then((saved) => {
                        axios({
                          method: "post",
                          url:
                            "https://devmachine.taketosa.com/api/Trip/NewTrip",
                          data: saved,
                          headers: {Authorization: `Bearer ${data.token}`},
                        });
                      });
                    } catch (error) {
                      console.log(error);
                    }
                  } else if (drivers.length > 1) {
                    admin
                      .messaging()
                      .sendToDevice(
                        users.get(drivers[1].driverID),
                        from_to,
                        notification_options
                      )
                      .on("driverRespond", (data) => {
                        requestStatus = data.requestStatus;
                        dr.push({
                          driverID: drivers[1].driverID,
                          requestStatus: requestStatus,
                          location: drivers[1].location,
                          actionDate: Date.now(),
                        });
                        if (data.requestStatus === 1) {
                          admin
                            .messaging()
                            .sendToDevice(
                              data.registrationToken,
                              {
                                message: "تم قبول رحلتك",
                                approved: true,
                                driver: dr[1],
                              },
                              notification_options
                            )
                            .then((response) => {
                              res
                                .status(200)
                                .send("Notification sent successfully");
                            })
                            .catch((error) => {
                              console.log(error);
                            });
                          ////// save trip
                          try {
                            trip.tripDrivers = dr;
                            DriverM.update(
                              {driverID: drivers[1].driverID},
                              {$set: {isBusy: true, busyTrip: from_to}}
                            ).then(() => {
                              const savedTrip = trip.save();
                            });
                            savedTrip.then((saved) => {
                              axios({
                                method: "post",
                                url:
                                  "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                data: saved,
                                headers: {
                                  Authorization: `Bearer ${data.token}`,
                                },
                              });
                            });
                          } catch (error) {
                            console.log(error);
                          }
                        } else if (drivers.length > 2) {
                          admin
                            .messaging()
                            .sendToDevice(
                              users.get(drivers[2].driverID),
                              from_to,
                              notification_options
                            )
                            .on("driverRespond", (data) => {
                              requestStatus = data.requestStatus;
                              dr.push({
                                driverID: drivers[2].driverID,
                                requestStatus: requestStatus,
                                location: drivers[1].location,
                                actionDate: Date.now(),
                              });
                            });
                          if (data.requestStatus === 1) {
                            admin
                              .messaging()
                              .sendToDevice(
                                data.registrationToken,
                                {
                                  message: "تم قبول رحلتك",
                                  approved: true,
                                  driver: dr[2],
                                },
                                notification_options
                              )
                              .then((response) => {
                                res
                                  .status(200)
                                  .send("Notification sent successfully");
                              })
                              .catch((error) => {
                                console.log(error);
                              });
                            ////// save trip
                            try {
                              trip.tripDrivers = dr;
                              DriverM.update(
                                {driverID: drivers[1].driverID},
                                {$set: {isBusy: true, busyTrip: from_to}}
                              ).then(() => {
                                const savedTrip = trip.save();
                              });
                              savedTrip.then((saved) => {
                                axios({
                                  method: "post",
                                  url:
                                    "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                  data: saved,
                                  headers: {
                                    Authorization: `Bearer ${data.token}`,
                                  },
                                });
                              });
                            } catch (error) {
                              console.log(error);
                            }
                          } else {
                            admin
                              .messaging()
                              .sendToDevice(
                                data.registrationToken,
                                {
                                  message: "لا يوجد سائق في منطقتك الحالية",
                                  approved: false,
                                },
                                notification_options
                              )
                              .then((response) => {
                                res
                                  .status(200)
                                  .send("Notification sent successfully");
                              })
                              .catch((error) => {
                                console.log(error);
                              });
                            ///// save trip
                            try {
                              trip.tripDrivers = dr;
                              const savedTrip = trip.save();
                              savedTrip.then((saved) => {
                                axios({
                                  method: "post",
                                  url:
                                    "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                  data: saved,
                                  headers: {
                                    Authorization: `Bearer ${data.token}`,
                                  },
                                });
                              });
                            } catch (error) {
                              console.log(error);
                            }
                          }
                        } else {
                          admin
                            .messaging()
                            .sendToDevice(
                              data.registrationToken,
                              {
                                message: "لا يوجد سائق في منطقتك الحالية",
                                approved: false,
                              },
                              notification_options
                            )
                            .then((response) => {
                              res
                                .status(200)
                                .send("Notification sent successfully");
                            })
                            .catch((error) => {
                              console.log(error);
                            });
                          ///// save trip
                          try {
                            trip.tripDrivers = dr;
                            const savedTrip = trip.save();
                            savedTrip.then((saved) => {
                              axios({
                                method: "post",
                                url:
                                  "https://devmachine.taketosa.com/api/Trip/NewTrip",
                                data: saved,
                                headers: {
                                  Authorization: `Bearer ${data.token}`,
                                },
                              });
                            });
                          } catch (error) {
                            console.log(error);
                          }
                        }
                      });
                  } else {
                    admin
                      .messaging()
                      .sendToDevice(
                        data.registrationToken,
                        {
                          message: "لا يوجد سائق في منطقتك الحالية",
                          approved: false,
                        },
                        notification_options
                      )
                      .then((response) => {
                        res.status(200).send("Notification sent successfully");
                      })
                      .catch((error) => {
                        console.log(error);
                      });
                    ///// save trip
                    try {
                      trip.tripDrivers = dr;
                      const savedTrip = trip.save();
                      savedTrip.then((saved) => {
                        axios({
                          method: "post",
                          url:
                            "https://devmachine.taketosa.com/api/Trip/NewTrip",
                          data: saved,
                          headers: {Authorization: `Bearer ${data.token}`},
                        });
                      });
                    } catch (error) {
                      console.log(error);
                    }
                  }
                });
            }
          }
        );
      });
    });
  });

  socket.on("updatelocation", (data) => {
    try {
      DriverM.findOne({
        driverID: data.driverID,
      })
        .then(() =>
          DriverM.updateOne(
            {
              driverID: data.driverID,
            },
            {
              $set: {
                location: {
                  coordinates: [data.lat, data.long],
                  type: "Point",
                },
                UpdateLocationDate: new Date(),
              },
            }
          ).then((res) => console.log(res))
        )
        .catch((err) => console.log(err));
    } catch (error) {
      console.log("error");
    }
  });

  socket.on("getavailable", (data) => {
    // console.log(data);
    try {
      DriverM.find({
        isBusy: false,
        isOnline: true,
        isDeleted: false,
        location: {
          $near: {
            $geometry: {type: "Point", coordinates: [data.lat, data.long]},
            //   $maxDistance: 5000,
          },
        },
      }).then(async (res) => {
        //console.log(res);
        var near = res[0];
        // console.log(near);

        const time = await DistinationDuration(
          near.location.coordinates[0],
          near.location.coordinates[1],
          data.long,
          data.lat
        );
        var driversList = [];
        res.map((driver) => {
          driversList.push(driver.location.coordinates);
        });
        const data1 = {
          drivers: driversList,
          time: time[0].duration.value / 60,
        };
        //console.log(data1);

        let user_id = users.get(data.userid);
        io.to(user_id).emit("getavailable", data1);
      });
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("trackdriverlocation", (data) => {
    try {
      DriverM.findOne({
        isBusy: false,
        isOnline: true,
        isDeleted: false,
        driverID: data.driverID,
      }).then((res) => {
        console.log(res.location.coordinates);

        let user_id = users.get(data.userid);
        io.to(user_id).emit("trackdriverlocation", res.location);
      });
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("listCategory", async (data) => {
    if (data.promoCode) {
      const promoResponse = await axios.get(
        "https://devmachine.taketosa.com/api/Trip/CheckPromoCode",
        {
          params: {promoCode: data.promoCode},
          headers: {Authorization: `Bearer ${data.token}`},
        }
      );
      // console.log(promoResponse.data);
    }
    if (
      (!promoResponse.data.status || !promoResponse.data.data.isValid) &&
      data.promoCode
    ) {
      var user_id = users.get(data.userId);
      io.to(user_id).emit("promoCode", {
        messageEn: promoResponse.messageEn,
        messageAr: promoResponse.messageAr,
      });
    } else {
      var discountType;
      var discountValue;
      if (data.promoCode) {
        (discountType = promoResponse.data.data.discountType),
          (discountValue = promoResponse.data.data.discountValue);
      } else {
        discountType = -1;
        discountValue = 0;
      }
      try {
        const category = CategoryFareM.find({}).then(async (res) => {
          //console.log("tttt", res);
          var responseArray = [];
          for (var i = 1; i <= res.length; i++) {
            //  console.log(i);
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
                    1,
                    10,
                    discountType,
                    discountValue
                  ).then((cost) => {
                    //   console.log("cost", i, cost);
                    responseArray.push({
                      NameAR: driver.driverNameAr,
                      NameEn: driver.driverNameEn,
                      Photo: driver.driverImage,
                      Minutes: driverTime[0].duration.text,
                      dest: driverTime[0].distance.text,
                      Cost: cost,
                    });
                  });
                });
              }
            });
          }
          var min = 100000;
          responseArray.map((driver) => {
            driver.Cost < min ? (min = driver.Cost) : "";
          });
          //  console.log(min);
          responseArray.map((driver) => {
            Object.defineProperty(driver, "isCheap", {
              value: driver.Cost === min ? true : false,
              writable: true,
              enumerable: true,
              configurable: true,
            });
            // console.log(driver);
          });
          //console.log(responseArray);
          var user_id = users.get(data.userId);
          io.to(user_id).emit("listCategory", responseArray);
        });
      } catch {}
    }
  });

  socket.on("AdminGetDrivers", (data) => {
    console.log(data);
    try {
      DriverM.find({
        isDeleted: false,
        location: {
          $near: {
            $geometry: {type: "Point", coordinates: [data.lat, data.lng]},
          },
          //$maxDistance: data.maxDistance,
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
        console.log(list);
        let user_id = users.get(0);
        io.to(user_id).emit("AdminGetDrivers", list);
      });
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("join", (id) => {
    users.set(id, socket.id);
    console.log(users);
  });

  socket.on("disconnect", (number) => {
    users.delete(number);
    console.log("user disconnected");
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
  // console.log(resp.data.rows[0]);
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
  // console.log(distanceTime, distanceKM);
  const CategoryFare = await CategoryFareM.findOne({
    categoryCarTypeID: carCategory,
  });
  //console.log(CategoryFare)
  const tax = await DeliverySettingM.find({sort: 1});
  var KMCost = (distanceKM - CategoryFare.minKM) * CategoryFare.baseFare;
  //if (KMCost < 3) KMCost = 0;
  var MinCost = distanceTime * CategoryFare.fareMinute;
  var MinFare = CategoryFare.minFare;
  var subTotal = KMCost + MinCost + MinFare;
  if (discountType != -1) {
    var discountCost =
      discountType === 1 ? discountValue : (SubTotal * discountValue) / 100;
    var TotalAfterDis = subTotal - discountCost;
  } else TotalAfterDis = subTotal;
  var VatCost = (tax * TotalAfterDis) / 100;
  //console.log(TotalAfterDis + VatCost, "kkjkljkl")
  return TotalAfterDis + VatCost;
};