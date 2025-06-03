
import React from 'react';
import { StyleSheet, Text, ScrollView } from 'react-native';

export default function CoordinatesScreen({ route }) {
  const { logTable } = route.params;

  return (
    <ScrollView style={styles.coordinatesContainer}>
      <Text style={styles.header}>Лог точек:</Text>
      {logTable.length === 0 ? (
        <Text style={styles.logText}>Нет записанных точек</Text>
      ) : (
        logTable.map((point, index) => (
          <Text
            key={index}
            style={[
              styles.logText,
              point.isManual && styles.manualMarker, // Добавляем стиль для пользовательских меток
            ]}
          >
            {`${point.isManual ? 'Моя метка' : 'Точка'} ${index + 1}: ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)} (${new Date(point.timestamp).toLocaleTimeString()})`}
          </Text>
        ))
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
    color: '#4CAF50', // Зелёный цвет для пользовательских меток
    fontWeight: 'bold', // Жирный шрифт для выделения
  },
});
