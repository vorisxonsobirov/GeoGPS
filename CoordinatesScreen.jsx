
import React from 'react';
import { StyleSheet, Text, ScrollView } from 'react-native';

export default function CoordinatesScreen({ route }) {
  const { logTable } = route.params;

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

  const distances = logTable.map((point, index) => {
    if (index === 0) return 0;
    const prevPoint = logTable[index - 1];
    return calculateDistance(
      prevPoint.latitude,
      prevPoint.longitude,
      point.latitude,
      point.longitude
    );
  });

  const totalDistance = distances.reduce((sum, dist) => sum + dist, 0);

  return (
    <ScrollView style={styles.coordinatesContainer}>
      <Text style={styles.header}>Лог точек:</Text>
      {logTable.length === 0 ? (
        <Text style={styles.logText}>Нет записанных точек</Text>
      ) : (
        <>
          {logTable.map((point, index) => (
            <Text
              key={index}
              style={[
                styles.logText,
                point.isManual && styles.manualMarker,
              ]}
            >
              {`${point.isManual ? 'Моя метка' : 'Точка'} ${index + 1}: ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)} (${new Date(point.timestamp).toLocaleTimeString()}) — ${distances[index].toFixed(1)} м`}
            </Text>
          ))}
          <Text style={styles.totalDistance}>
            Общее расстояние: {totalDistance.toFixed(1)} м
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  coordinatesContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logText: {
    fontSize: 16,
    marginVertical: 5,
  },
  manualMarker: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  totalDistance: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#000',
  },
});
