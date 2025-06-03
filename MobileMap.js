import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CoordinatesScreen from './CoordinatesScreen';

function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [logTable, setLogTable] = useState([]);
  const [lastPosition, setLastPosition] = useState(null);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
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
        setLogTable(JSON.parse(savedLog));
      }
    } catch (e) {
      console.error('Ошибка загрузки:', e);
    }
  };

  const clearLogTable = async () => {
    try {
      setLogTable([]);
      await AsyncStorage.removeItem('logTable');
      alert('Координаты очищены');
    } catch (e) {
      console.error('Ошибка очистки:', e);
    }
  };

  const addManualMarker = () => {
    if (!location) {
      alert('Местоположение ещё не определено');
      return;
    }
    const entry = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: Date.now(),
      isManual: true,
    };
    setLogTable(prev => {
      const newTable = [...prev, entry].slice(-100);
      saveLogTable(newTable);
      return newTable;
    });
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
      setLastPosition(initialLoc.coords);

      const entry = {
        latitude: initialLoc.coords.latitude,
        longitude: initialLoc.coords.longitude,
        timestamp: initialLoc.timestamp,
        isManual: false,
      };
      setLogTable(prev => {
        const newTable = [...prev, entry].slice(-100);
        saveLogTable(newTable);
        return newTable;
      });

      // ВНИМАНИЕ: вот здесь меняем только distanceInterval
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 50,  // только при перемещении на 50 метров
          timeInterval: 0,       // отключаем таймер, чтобы не писать по времени
        },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;

          if (!lastPosition) return;

          const distance = calculateDistance(
            lastPosition.latitude,
            lastPosition.longitude,
            latitude,
            longitude
          );

          if (distance >= 50) {
            const entry = {
              latitude,
              longitude,
              timestamp: newLocation.timestamp,
              isManual: false,
            };
            setLogTable(prev => {
              const newTable = [...prev, entry].slice(-100);
              saveLogTable(newTable);
              return newTable;
            });
            setLastPosition({ latitude, longitude });
          }

          setLocation(newLocation);
        }
      );
    })();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

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
            {logTable.length > 1 && (
              <Polyline
                coordinates={logTable.map(p => ({
                  latitude: p.latitude,
                  longitude: p.longitude,
                }))}
                strokeColor="#FF0000"
                strokeWidth={3}
              />
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
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
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

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Map">
        <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Карта' }} />
        <Stack.Screen name="Coordinates" component={CoordinatesScreen} options={{ title: 'Координаты' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 0.7 },
  buttonContainer: {
    flex: 0.3,
    justifyContent: 'space-around',
    padding: 10,
  },
});
