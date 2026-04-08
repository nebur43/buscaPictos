import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@buscaPictos_search_history';
const MAX_HISTORY_ITEMS = 100;

export const saveHistory = async (query, pictoId) => {
  if (!query || query.trim() === '' || !pictoId) return;
  try {
    const normalizedQuery = query.trim().toLowerCase();
    const existingHistoryStr = await AsyncStorage.getItem(HISTORY_KEY);
    let history = existingHistoryStr ? JSON.parse(existingHistoryStr) : [];
    
    // Support old history format (strings) vs new format (objects)
    // Filter out if already exists (checking both formats)
    history = history.filter(item => {
      const itemWord = typeof item === 'string' ? item : item.word;
      return itemWord !== normalizedQuery;
    });
    
    // Add to the front in new format
    history.unshift({ word: normalizedQuery, id: pictoId });
    
    // Cap at max items
    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Error saving history:", error);
  }
};

export const getHistory = async () => {
  try {
    const historyStr = await AsyncStorage.getItem(HISTORY_KEY);
    return historyStr ? JSON.parse(historyStr) : [];
  } catch (error) {
    console.error("Error completely fetching history:", error);
    return [];
  }
};
