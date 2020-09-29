import React, {useState, useEffect, useContext} from "react";
import axios from "axios";
import {AuthContext} from "./AuthContext";
import io from "socket.io-client";
import {ToastProvider, useToasts} from "react-toast-notifications";

export const WaslniContext = React.createContext();

export function WaslniProvider(Props) {
  const [avelDriv, setAvelDriv] = useState([]);
  const [currentlocation, setCurrentlocation] = useState({lat: "", long: ""});
  const authContext = useContext(AuthContext);
  const token = authContext.auth;
  const [chat, setChat] = useState([]);
  const [trip, setTrip] = useState([]);

  const {addToast} = useToasts();
  useEffect(() => {
    async function feachdata() {
      const data = {number: localStorage.getItem("number")};
      if (authContext.isdriver) {
        const res = await axios({
          method: "post",
          url: `http://localhost:5000/trip/get_trips_by_driver`,
          data,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => {
            console.log("rew", res);
            res.data.data.map((tri) => {
              trip.push(tri);
            });
          })
          .catch((err) => {
            addToast("error try again", {appearance: "error"});
          });
      } else {
        const res = await axios({
          method: "post",
          url: `http://localhost:5000/trip/get_trips_by_user`,
          data,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => {
            console.log(res);
            res.data.data.map((tri) => {
              trip.push(tri);
            });
          })
          .catch((err) => {
            addToast("error try again", {appearance: "error"});
          });
      }
    }
    console.log(trip);
    feachdata();
  }, []);
  useEffect(async () => {
    const result = await axios
      .get(`http://localhost:5000/driver/get_available`)
      .then((res) => {
        res.data.data.map((driver) => {
          avelDriv.push(driver);
        });
      })
      .catch((err) => {
        alert("error");
      });
    avelDriv.map((co) => console.log("dssdsd", co));
  }, []);
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      console.log(position.coords.latitude, position.coords.longitude);
      setCurrentlocation({
        lat: position.coords.latitude,
        long: position.coords.longitude,
      });
    });
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition((position) => {
        console.log(position.coords.latitude, position.coords.longitude);
        setCurrentlocation({
          lat: position.coords.latitude,
          long: position.coords.longitude,
        });
      });
      console.log("This will run every second!");
    }, 36000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    async function fetchData() {
      if (localStorage.getItem("isdriver")) {
        const data = {driver: localStorage.getItem("number")};
        console.log("jkhk");
        const res = await axios({
          method: "post",
          url: "http://localhost:5000/chat/get_driver_chat",
          data: data,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        res.data.messages.map((message) => chat.push(message));
        // chat.map((e) => console.log(e));
      } else {
        const data = {client: localStorage.getItem("number")};
        const res = await axios({
          method: "post",
          url: "http://localhost:5000/chat/get_client_chat",
          data: data,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        res.data.messages.map((message) => {
          chat.push(message);
        });
      }
    }
    fetchData();
  }, []);

  return (
    <WaslniContext.Provider
      value={{trip, avelDriv, currentlocation, chat, setChat, setTrip}}
    >
      {Props.children}
    </WaslniContext.Provider>
  );
}
