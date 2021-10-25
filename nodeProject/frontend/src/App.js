import * as React from 'react';
import { useState } from 'react';
import ReactMapGL, {Marker, Popup, GeolocateControl} from 'react-map-gl';
import {Room, Star} from "@material-ui/icons"
import "./app.css";
import axios from "axios";
import {format} from "timeago.js"

function App() {
  const currentUser = "James";
  const [pins,setPins] = useState([]);
  const [currentPlaceId, setCurrentPlaceId] = useState(null);
  const [newPlace, setNewPlace] = useState(null);
  const [title, setTitle] = useState(null);
  const [desc, setDesc] = useState(null);
  const [rating, setRating] = useState(0);
  const [viewport, setViewport] = useState({
    width: "100vw",
    height: "100vh",
    latitude: 40.74454886832962,
    longitude: -74.02553887611165,
    zoom: 14
  });

  React.useEffect(()=>{
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
      title,
      desc,
      rating,
      lat: newPlace.lat,
      long: newPlace.long,

    }

    try {
      const res = await axios.post("/pins", newPin)
      setPins([...pins, res.data])
      setNewPlace(null);
    } catch (error) {
      console.log(error)
    }
  }



  return (
    <div className="App">
      <ReactMapGL
      {...viewport}
      mapboxApiAccessToken={process.env.REACT_APP_MAPBOX}
      onViewportChange={nextViewport => setViewport(nextViewport)}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      onClick = {handleAddClick}
      dragPan="false"
      touchAction="pan-y"
    >

      {pins.map(p=>(
<>
      
      <Marker latitude={p.lat} longitude={p.long} offsetLeft={-25.35} offsetTop={-45}>
        <Room style={{ fontSize: viewport.zoom * 3, color: p.username === currentUser ? "tomato" :"slateblue",
         cursor:"pointer", 
        }}
        onClick={()=>handleMarkerClick(p._id, p.lat, p.long)}
        />
      </Marker>
      {p._id === currentPlaceId &&
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
            <h4 className="place">{p.title}</h4>
            <label>Desc</label>
            <p  className="desc">{p.desc}</p>
            <label>Difficulty</label>
            <div className="stars">
              {Array(p.rating).fill(<Star className="star" />)}
            </div>
            <label>Information</label>
            <span className="username">Created by <b>{p.username}</b></span>
            <span className="date">{format(p.createdAt)}</span>
          </div>
        </Popup>
        } 
        </>
        ))}
        {newPlace &&
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
            <input placeholder="Enter Title" onChange={(e)=>setTitle(e.target.value)}/>
            <label>Desc</label>
            <textarea placeholder="Say something about it" onChange={(e)=>setDesc(e.target.value)}/>
            <label>Difficulty</label>
            <select onChange={(e)=>setRating(e.target.value)}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            <button className="submitButton" type="submit">Add Pin</button>
          </form>
        </div>
          </Popup>
          }
    </ReactMapGL>
    </div>
  );
}

export default App;
