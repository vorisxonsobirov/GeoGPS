// // App.js
// import React, { useEffect, useState } from 'react';
// import { StyleSheet, Text, View, Button } from 'react-native';
// import * as Location from 'expo-location';
// import MapView, { Marker, Polyline } from 'react-native-maps';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import CoordinatesScreen from './CoordinatesScreen';

// function MapScreen({ navigation }) {
//   const [location, setLocation] = useState(null);
//   const [logTable, setLogTable] = useState([]);
//   const [lastPosition, setLastPosition] = useState(null);
//   const [routeCoordinates, setRouteCoordinates] = useState([]);

//   const calculateDistance = (lat1, lon1, lat2, lon2) => {
//     const R = 6371e3;
//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;
//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;
//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a = Math.sin(Δφ / 2) ** 2 +
//               Math.cos(φ1) * Math.cos(φ2) *
//               Math.sin(Δλ / 2) ** 2;
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
//   };

  
// const fetchRoute = async (points) => {
//   const filteredPoints = points.filter((point, index, arr) => {
//     if (index === 0) return true;
//     const prev = arr[index - 1];
//     return !(point.latitude === prev.latitude && point.longitude === prev.longitude);
//   });

//   if (filteredPoints.length < 2) {
//     setRouteCoordinates([]);
//     return;
//   }

//   try {
//     const coordinates = filteredPoints.map(p => `${p.longitude},${p.latitude}`).join(';');
//     const url = `http://router.project-osrm.org/route/v1/foot/${coordinates}?overview=full&geometries=geojson`;
//     const response = await fetch(url);
//     const data = await response.json();

//     if (data.code === 'Ok') {
//       const route = data.routes[0].geometry.coordinates.map(coord => ({
//         latitude: coord[1],
//         longitude: coord[0],
//       }));
//       setRouteCoordinates(route);
//     } else {
//       console.error('Ошибка OSRM:', data.code);
//       setRouteCoordinates(filteredPoints.map(p => ({
//         latitude: p.latitude,
//         longitude: p.longitude,
//       })));
//     }
//   } catch (e) {
//     console.error('Ошибка запроса маршрута:', e);
//     setRouteCoordinates(filteredPoints.map(p => ({
//       latitude: p.latitude,
//       longitude: p.longitude,
//     })));
//   }
// };




//   const saveLogTable = async (logTable) => {
//     try {
//       await AsyncStorage.setItem('logTable', JSON.stringify(logTable));
//     } catch (e) {
//       console.error('Ошибка сохранения:', e);
//     }
//   };

//   const loadLogTable = async () => {
//     try {
//       const savedLog = await AsyncStorage.getItem('logTable');
//       if (savedLog) {
//         const parsedLog = JSON.parse(savedLog);
//         setLogTable(parsedLog);
//         fetchRoute(parsedLog);
//       }
//     } catch (e) {
//       console.error('Ошибка загрузки:', e);
//     }
//   };

//   const clearLogTable = async () => {
//     try {
//       setLogTable([]);
//       setRouteCoordinates([]);
//       await AsyncStorage.removeItem('logTable');
//       alert('Координаты очищены');
//     } catch (e) {
//       console.error('Ошибка очистки:', e);
//     }
//   };

//   const addManualMarker = () => {
//     if (!location) {
//       alert('Местоположение ещё не определено');
//       return;
//     }
//     const entry = {
//       latitude: location.coords.latitude,
//       longitude: location.coords.longitude,
//       timestamp: Date.now(),
//       isManual: true,
//     };
//     setLogTable(prev => {
//       const newTable = [...prev, entry].slice(-100);
//       saveLogTable(newTable);
//       fetchRoute(newTable);
//       return newTable;
//     });
//   };

//   useEffect(() => {
//     let subscription;

//     (async () => {
//       await loadLogTable();

//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         alert('Нет доступа к геолокации');
//         return;
//       }

//       const initialLoc = await Location.getCurrentPositionAsync({});
//       setLocation(initialLoc);
//       setLastPosition(initialLoc.coords);

//       const entry = {
//         latitude: initialLoc.coords.latitude,
//         longitude: initialLoc.coords.longitude,
//         timestamp: initialLoc.timestamp,
//         isManual: false,
//       };
//       setLogTable(prev => {
//         const newTable = [...prev, entry].slice(-100);
//         saveLogTable(newTable);
//         fetchRoute(newTable);
//         return newTable;
//       });

//       subscription = await Location.watchPositionAsync(
//         {
//           accuracy: Location.Accuracy.High,
//           distanceInterval: 50,
//           timeInterval: 0,
//         },
//         (newLocation) => {
//           const { latitude, longitude, speed } = newLocation.coords;

//           if (!lastPosition) return;

//           const distance = calculateDistance(
//             lastPosition.latitude,
//             lastPosition.longitude,
//             latitude,
//             longitude
//           );

//           if (distance >= 50 && distance >= 10 && (speed === null || speed > 0.1)) {
//             const entry = {
//               latitude,
//               longitude,
//               timestamp: newLocation.timestamp,
//               isManual: false,
//             };
//             setLogTable(prev => {
//               const newTable = [...prev, entry].slice(-100);
//               saveLogTable(newTable);
//               fetchRoute(newTable);
//               return newTable;
//             });
//             setLastPosition({ latitude, longitude });
//           }

//           setLocation(newLocation);
//         }
//       );
//     })();

//     return () => {
//       if (subscription) {
//         subscription.remove();
//       }
//     };
//   }, []);

//   return (
//     <View style={styles.container}>
//       {location ? (
//         <>
//           <MapView
//             style={styles.map}
//             region={{
//               latitude: location.coords.latitude,
//               longitude: location.coords.longitude,
//               latitudeDelta: 0.01,
//               longitudeDelta: 0.01,
//             }}
//           >
//             {routeCoordinates.length > 1 && (
//               <Polyline
//                 coordinates={routeCoordinates}
//                 strokeColor="#FF0000"
//                 strokeWidth={3}
//               />
//             )}

//             {logTable.map((p, i) => (
//               <Marker
//                 key={i}
//                 coordinate={{ latitude: p.latitude, longitude: p.longitude }}
//                 title={p.isManual ? `Моя метка ${i + 1}` : `Точка ${i + 1}`}
//                 description={`Время: ${new Date(p.timestamp).toLocaleTimeString()}`}
//                 pinColor={p.isManual ? 'green' : 'red'}
//               />
//             ))}

//             <Marker
//               coordinate={{
//                 latitude: location.coords.latitude,
//                 longitude: location.coords.longitude,
//               }}
//               title="Ты здесь"
//               pinColor="blue"
//             />
//           </MapView>
//           <View style={styles.buttonContainer}>
//             <Button title="Поставить метку" onPress={addManualMarker} color="#4CAF50" />
//             <Button title="Посмотреть координаты" onPress={() => navigation.navigate('Coordinates', { logTable })} />
//             <Button title="Очистить координаты" onPress={clearLogTable} color="#FF0000" />
//           </View>
//         </>
//       ) : (
//         <Text>Определяем местоположение...</Text>
//       )}
//     </View>
//   );
// }

// const Stack = createStackNavigator();

// export default function App() {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator initialRouteName="Map">
//         <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Карта' }} />
//         <Stack.Screen name="Coordinates" component={CoordinatesScreen} options={{ title: 'Координаты' }} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   map: { flex: 0.7 },
//   buttonContainer: {
//     flex: 0.3,
//     justifyContent: 'space-around',
//     padding: 10,
//   },
// });


// components/MobileMap.js
// components/MobileMap.js
import React from 'react';
import { StyleSheet, View, Button, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import CoordinatesScreen from './CoordinatesScreen';

const Stack = createStackNavigator();

function MapScreen({ location, logTable, routeCoordinates, addManualMarker, clearLogTable, navigation }) {
  return (
    <View style={styles.container}>
      {location ? (
        <>
          <MapView
            style={styles.map}
            region={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {routeCoordinates.length > 1 && (
              <Polyline coordinates={routeCoordinates} strokeColor="#FF0000" strokeWidth={3} />
            )}
            {logTable.map((p, i) => (
              <Marker
                key={i}
                coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                title={p.isManual ? `Моя метка ${i + 1}` : `Точка ${i + 1}`}
                description={`Время: ${new Date(p.timestamp).toLocaleTimeString()}`}
                pinColor={p.isManual ? 'green' : 'red'}
              />
            ))}
            <Marker
              coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
              title="Ты здесь"
              pinColor="blue"
            />
          </MapView>
          <View style={styles.buttonContainer}>
            <Button title="Поставить метку" onPress={addManualMarker} color="#4CAF50" />
            <Button title="Посмотреть координаты" onPress={() => navigation.navigate('Coordinates', { logTable })} />
            <Button title="Очистить координаты" onPress={clearLogTable} color="#FF0000" />
          </View>
        </>
      ) : (
        <Text>Определяем местоположение...</Text>
      )}
    </View>
  );
}

export default function MobileMap({ location, logTable, routeCoordinates, addManualMarker, clearLogTable }) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Map">
        <Stack.Screen name="Map" options={{ title: 'Карта' }}>
          {props => <MapScreen {...props} location={location} logTable={logTable} routeCoordinates={routeCoordinates} addManualMarker={addManualMarker} clearLogTable={clearLogTable} />}
        </Stack.Screen>
        <Stack.Screen name="Coordinates" component={CoordinatesScreen} options={{ title: 'Координаты' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 0.7 },
  buttonContainer: { flex: 0.3, justifyContent: 'space-around', padding: 10 },
});