// components/WebMap.js
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
/>

import L from 'leaflet';

function WebMap({ location, logTable, routeCoordinates, addManualMarker, clearLogTable }) {
  const [userLocation, setUserLocation] = useState(location);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ coords: { latitude, longitude } });
        },
        (err) => console.error('Ошибка геолокации:', err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
  }, []);

  const handleAddMarker = () => {
    if (userLocation) addManualMarker();
  };

  const handleClear = () => clearLogTable();

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer center={userLocation?.coords ? [userLocation.coords.latitude, userLocation.coords.longitude] : [51.505, -0.09]} zoom={13} style={{ height: '100%' }}>
        <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {userLocation && (
          <Marker position={[userLocation.coords.latitude, userLocation.coords.longitude]}>
            <Popup>Ты здесь</Popup>
          </Marker>
        )}
        {logTable.map((p, i) => (
          <Marker key={i} position={[p.latitude, p.longitude]}>
            <Popup>{p.isManual ? `Моя метка ${i + 1}` : `Точка ${i + 1}`}<br />{new Date(p.timestamp).toLocaleTimeString()}</Popup>
          </Marker>
        ))}
        {routeCoordinates.length > 1 && <Polyline positions={routeCoordinates.map(p => [p.latitude, p.longitude])} color="red" />}
      </MapContainer>
      <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
        <button onClick={handleAddMarker} style={{ margin: 5 }}>Поставить метку</button>
        <button onClick={handleClear} style={{ margin: 5 }}>Очистить координаты</button>
      </div>
    </div>
  );
}

export default WebMap;