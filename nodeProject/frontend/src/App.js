import "mapbox-gl/dist/mapbox-gl.css";
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import * as React from 'react';
import { useEffect } from 'react';
import { useState, useRef, useCallback } from "react";
import { render } from "react-dom";
import MapGL from "react-map-gl";
import Geocoder from "react-map-gl-geocoder";
import ReactMapGL, {Marker, Popup, GeolocateControl, NavigationControl, FlyToInterpolator} from 'react-map-gl';
import CityPin from "./city_pins";
import "./app.css";
import axios from "axios";
import {format} from "timeago.js";
import Register from './components/Register';
import Login from './components/Login';
//import { ThumbUp } from "@material-ui/icons";
import useSwr from "swr";
import useSupercluster from "use-supercluster"

const fetcher = (...args) => fetch(...args).then(response => response.json());

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


  //const url = "https://data.cityofnewyork.us/resource/tapx-gr7a.json";
  const url = "https://data.cityofnewyork.us/api/geospatial/5jsj-cq4s?method=export&format=GeoJSON"
  const { data, error} = useSwr(url, fetcher);
  const points = data && !error ? data.features : [];
  const nyc_pins = points.map(point => ({
      type: "Feature",
      properties: {
        cluster: false,
        pinId: point.id
      },
      geometry: { type: "Point", 
      coordinates: [parseFloat(point.properties.long), parseFloat(point.properties.lat)] 
    }
  }));

  //get bounds
  const bounds = mapRef.current
    ? mapRef.current
        .getMap()
        .getBounds()
        .toArray()
        .flat()
    : null;

  //get cluster
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewport.zoom,
    options: { radius: 75, maxZoom: 20 }
  });

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
        maxZoom={20}
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
        />
      <NavigationControl style={navControlStyle}/>

      {clusters.map(cluster =>{
        const [long, lat] = cluster.geometry.coordinates;
        const {
          cluster: isCluster, 
          point_count: pointCount} = cluster.properties;

        if (isCluster) {
          return (
            <Marker 
              key={cluster.id} 
              latitude={lat} 
              longitude={long}
            >
              <div 
                className="cluster-marker"
                onClick={() =>{
                  const expansionZoom = Math.min(
                    supercluster.getClusterExpansionZoom(cluster.id), 20
                  );
                  setViewport({
                    ...viewport,
                    latitude:lat, longitude: long,
                    zoom: expansionZoom,
                    transitionInterpolator: new FlyToInterpolator({
                      speed:2
                    }),
                    transitionDuration: "auto"
                  })
                }} 
              >
                {pointCount}
              </div>
            </Marker>
          );
        }

        return (
        <Marker 
          key={cluster.properties.pinId}
          latitude={lat}
          longitude={long}
        >
        </Marker>
        );
        })}

      {pins.map(p=>(
    <>
      
      <Marker latitude={p.lat} longitude={p.long}>
        <CityPin 
          fill={'#d62'}
          size={20} 
          onClick={()=>handleMarkerClick(p._id, p.lat, p.long)}
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
            <label>Street(What is the Street Name?)</label>
            <h4 className="place">{p.street}</h4>
            <label>Desc(Parking available?)</label>
            <p  className="desc">{p.desc}</p>
            {/* <label>Rating (Do you think it's useful?)</label>
            <p className="rating">{p.rating}</p> */}
            <label>Information</label>
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
          anchor="top" 
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
