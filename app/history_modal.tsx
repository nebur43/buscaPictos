import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getHistory } from '../services/history';

export default function HistoryModal() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await getHistory();
      setHistory(data);
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const handleSelect = (item: any) => {
    const query = typeof item === 'string' ? item : item.word;
    router.navigate({ pathname: '/', params: { searchStr: query } });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#FF6B6B" style={{marginTop: 50}}/>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No hay búsquedas recientes.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, idx) => {
            const word = typeof item === 'string' ? item : item.word;
            return `${word}-${idx}`;
          }}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => {
            const word = typeof item === 'string' ? item : item.word;
            return (
              <TouchableOpacity style={styles.historyItem} onPress={() => handleSelect(item)}>
                <Ionicons name="search" size={20} color="#888" />
                <Text style={styles.historyText}>{word}</Text>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 15, fontSize: 18, color: '#888' },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 18, borderRadius: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  historyText: { flex: 1, fontSize: 18, color: '#333', marginLeft: 15, textTransform: 'capitalize' }
});
