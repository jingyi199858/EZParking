import "mapbox-gl/dist/mapbox-gl.css";
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import * as React from 'react';
import { useEffect } from 'react';
import { useState, useRef, useCallback } from "react";
import { render } from "react-dom";
import MapGL from "react-map-gl";
import Geocoder from "react-map-gl-geocoder";
import ReactMapGL, {Marker, Popup, GeolocateControl, NavigationControl} from 'react-map-gl';
import CityPin from "./city_pins";
import "./app.css";
import axios from "axios";
import {format} from "timeago.js"
import Register from './components/Register';
import Login from './components/Login'

const navControlStyle = {
  top : 50,
  left : 10
}

const geoLocateStyle = {
  top : 10,
  left : 10
}

const App = () => {
  const myStorage = window.localStorage;
  const [currentUser, setCurrentUser] = useState(myStorage.getItem("user"));
  const [pins,setPins] = useState([]);
  const [currentPlaceId, setCurrentPlaceId] = useState(null);
  const [newPlace, setNewPlace] = useState(null);
  const [street, setStreet] = useState(null);
  const [desc, setDesc] = useState(null);
  const [rating, setRating] = useState(0);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [viewport, setViewport] = useState({
    latitude: 40.74454886832962,
    longitude: -74.02553887611165,
    zoom: 14
  });
  const mapRef = useRef();
  const handleViewportChange = useCallback(
    (newViewport) => setViewport(newViewport),
    []
  );

  // if you are happy with Geocoder default settings, you can just use handleViewportChange directly
  const handleGeocoderViewportChange = useCallback(
    (newViewport) => {
      const geocoderDefaultOverrides = { transitionDuration: 1000 };

      return handleViewportChange({
        ...newViewport,
        ...geocoderDefaultOverrides
      });
    },
    [handleViewportChange]
  );

  useEffect(()=>{
    const getPins = async ()=>{
      try {
        const res = await axios.get("/pins");
        setPins(res.data);
      } catch (err) {
        console.log(err)
      }
    };
    getPins()
  }, []);


  const handleMarkerClick = (id, lat, long)=>{
    setCurrentPlaceId(id);
    setViewport({...viewport, latitude:lat, longitude: long});
  }

  const handleAddClick = (e)=>{
    const [long,lat] = e.lngLat;
    setNewPlace({
      lat,
      long,
    });
  };

  const handleSubmit = async (e)=>{
    e.preventDefault();
    const newPin = {
      username: currentUser,
      street,
      desc,
      rating,
      lat: newPlace.lat,
      long: newPlace.long,

    };

    try {
      const res = await axios.post("/pins", newPin)
      setPins([...pins, res.data])
      setNewPlace(null);
    } catch (error) {
      console.log(error)
    }
  };

  const handleLogout = ()=>{
    myStorage.removeItem("user");
    setCurrentUser(null);
  };

  const SIZE = 20;
  const UNIT = "px";

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <ReactMapGL
        ref={mapRef}
        {...viewport}
        mapboxApiAccessToken={process.env.REACT_APP_MAPBOX}
        width="100%"
        height="100%"
        mapStyle="mapbox://styles/safak/cknndpyfq268f17p53nmpwira"
        //onViewportChange={(viewport) => setViewport(viewport)}
        onDblClick={handleAddClick}
        doubleClickZoom={false}
        dragPan="false"
        touchAction="pan-y"
        onViewportChange={handleViewportChange}
      >
        <Geocoder
          mapRef={mapRef}
          onViewportChange={handleGeocoderViewportChange}
          mapboxApiAccessToken={process.env.REACT_APP_MAPBOX}
          position="bottom-left"
        />
      <GeolocateControl 
        style={geoLocateStyle}
        auto
        />
      <NavigationControl style={navControlStyle}/>

      {pins.map(p=>(
    <>
      
      <Marker latitude={p.lat} longitude={p.long}>
        <CityPin size={20} onClick={()=>handleMarkerClick(p._id, p.lat, p.long)}
        />
      </Marker>
      {p._id === currentPlaceId &&(
      <Popup
          latitude={p.lat}
          longitude={p.long}
          closeButton={true}
          closeOnClick={true}
          anchor="bottom" 
          onClose={()=>setCurrentPlaceId(null)}
        >
          <div className="card">
            <label>Street</label>
            <h4 className="place">{p.street}</h4>
            <label>Desc</label>
            <p  className="desc">{p.desc}</p>
            <p className="rating">{p.rating}</p>
            <label>Rating (Do you think it's useful?)</label>
            <span className="username">Created by <b>{p.username ? (p.username) : ("Someone around")}</b></span>
            <span className="date">{format(p.createdAt)}</span>
          </div>
        </Popup>
      )} 
        </>
        ))}
        {newPlace && (
        <Popup
          latitude={newPlace.lat}
          longitude={newPlace.long}
          closeButton={true}
          closeOnClick={true}
          anchor="bottom" 
          onClose={()=>setNewPlace(null)}
        >
        <div>
          <form onSubmit={handleSubmit}>
            <label>Street</label>
            <input placeholder="Enter Street" onChange={(e)=>setStreet(e.target.value)}/>
            <label>Desc</label>
            <textarea placeholder="Say something about it" onChange={(e)=>setDesc(e.target.value)}/>
            <button className="submitButton" type="submit">Add Pin</button>
          </form>
        </div>
          </Popup>
        )}
        {currentUser ? (<button className="button logout" onClick={handleLogout}>Log out</button>) : (
          <div className="buttons">
            <button className="button login" onClick={() => setShowLogin(true)}>Log in</button>
            <button className="button register" onClick={() => setShowRegister(true)}>Register</button>
          </div>
        )}
        {showRegister && <Register setShowRegister={setShowRegister} />}
        {showLogin && (
        <Login 
          setShowLogin={setShowLogin} 
          myStorage={myStorage}
          setCurrentUser={setCurrentUser}
        />
        )}
      </ReactMapGL>
    </div>
  );
};

//render(<App />, document.getElementById("root"));
export default App;
