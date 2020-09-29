import React, {useEffect} from "react";

import io from "socket.io-client";

const socket = io.connect("http://testportal.taketosa.com:5000");

export default function App() {
  useEffect(() => {
    const id = "0955555555";
    socket.emit("join", id);
    const data = {
      lat: 31,
      long: 32.0212,
      number: "1",
      pickupLat: 31,
      pickupLng: 32.0212,
      dropoffLat: 31.01,
      dropoffLng: 32.0222,
    };
  }, []);

  return <div></div>;
}
