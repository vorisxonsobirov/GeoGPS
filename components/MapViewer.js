// components/MapViewer.js
import { Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

let MapComponent;
if (Platform.OS === 'web') {
  MapComponent = require('./WebMap').default;
} else {
  MapComponent = require('./MobileMap').default;
}

export default function MapViewer() {
  const [location, setLocation] = useState(null);
  const [logTable, setLogTable] = useState([]);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchRoute = async (points) => {
    const filteredPoints = points.filter((point, index, arr) =>
      index === 0 || !(point.latitude === arr[index - 1].latitude && point.longitude === arr[index - 1].longitude)
    );
    if (filteredPoints.length < 2) {
      setRouteCoordinates([]);
      return;
    }
    try {
      const coordinates = filteredPoints.map(p => `${p.longitude},${p.latitude}`).join(';');
      const url = `http://router.project-osrm.org/route/v1/foot/${coordinates}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.code === 'Ok') {
        const route = data.routes[0].geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setRouteCoordinates(route);
      } else {
        console.error('Ошибка OSRM:', data.code);
        setRouteCoordinates(filteredPoints);
      }
    } catch (e) {
      console.error('Ошибка запроса маршрута:', e);
      setRouteCoordinates(filteredPoints);
    }
  };

  const saveLogTable = async (logTable) => {
    try {
      await AsyncStorage.setItem('logTable', JSON.stringify(logTable));
    } catch (e) {
      console.error('Ошибка сохранения:', e);
    }
  };

  const loadLogTable = async () => {
    try {
      const savedLog = await AsyncStorage.getItem('logTable');
      if (savedLog) {
        const parsedLog = JSON.parse(savedLog);
        setLogTable(parsedLog);
        fetchRoute(parsedLog);
      }
    } catch (e) {
      console.error('Ошибка загрузки:', e);
    }
  };

  useEffect(() => {
    let subscription;
    (async () => {
      await loadLogTable();
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Нет доступа к геолокации');
        return;
      }
      const initialLoc = await Location.getCurrentPositionAsync({});
      setLocation(initialLoc);
      const entry = { latitude: initialLoc.coords.latitude, longitude: initialLoc.coords.longitude, timestamp: initialLoc.timestamp, isManual: false };
      setLogTable([entry]);
      saveLogTable([entry]);
      fetchRoute([entry]);

      if (Platform.OS !== 'web') {
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 10, timeInterval: 1000 },
          (newLocation) => {
            const distance = calculateDistance(location?.coords.latitude || initialLoc.coords.latitude, location?.coords.longitude || initialLoc.coords.longitude, newLocation.coords.latitude, newLocation.coords.longitude);
            if (distance >= 10 && (newLocation.coords.speed === null || newLocation.coords.speed > 0.1)) {
              const entry = { latitude: newLocation.coords.latitude, longitude: newLocation.coords.longitude, timestamp: newLocation.timestamp, isManual: false };
              setLogTable(prev => {
                const newTable = [...prev, entry].slice(-100);
                saveLogTable(newTable);
                fetchRoute(newTable);
                return newTable;
              });
            }
            setLocation(newLocation);
          }
        );
      }
    })();
    return () => subscription?.remove();
  }, []);

  const addManualMarker = () => {
    if (!location) {
      alert('Местоположение не определено');
      return;
    }
    const entry = { latitude: location.coords.latitude, longitude: location.coords.longitude, timestamp: Date.now(), isManual: true };
    setLogTable(prev => {
      const newTable = [...prev, entry].slice(-100);
      saveLogTable(newTable);
      fetchRoute(newTable);
      return newTable;
    });
  };

  const clearLogTable = async () => {
    try {
      setLogTable([]);
      setRouteCoordinates([]);
      await AsyncStorage.removeItem('logTable');
      alert('Координаты очищены');
    } catch (e) {
      console.error('Ошибка очистки:', e);
    }
  };

  return (
    <MapComponent
      location={location}
      logTable={logTable}
      routeCoordinates={routeCoordinates}
      addManualMarker={addManualMarker}
      clearLogTable={clearLogTable}
    />
  );
}