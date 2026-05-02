import { Ionicons } from '@expo/vector-icons';
import * as Localization from 'expo-localization';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Keyboard, Linking, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchPictograms } from '../services/api';
import { getHistory, saveHistory } from '../services/history';
import { DEFAULT_LIST } from '../constants/default_list';

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPlayMode, setIsPlayMode] = useState(true);
  const [esVoiceId, setEsVoiceId] = useState<string | undefined>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { searchStr } = useLocalSearchParams();
  const router = useRouter();

  // Determine num of columns based on width
  // Minimum 2
  const numColumns = Math.max(2, Math.floor(width / 150));

  useEffect(() => {
    if (searchStr) {
      setQuery(searchStr as string);
      executeSearch(searchStr as string);
    } else {
      setQuery('');
      loadRandomHistory();
    }
  }, [searchStr]);

  const loadRandomHistory = async () => {
    setLoading(true);
    try {
      const history = await getHistory();
      
      // Filter to only include items with IDs (new format)
      const historyItems = (history || []).filter((item: any) => typeof item === 'object' && item.id);
      
      // Combine with DEFAULT_LIST
      // Use a Map to avoid duplicates by word
      const combinedMap = new Map();
      
      // First add defaults
      DEFAULT_LIST.forEach((item: any) => {
        combinedMap.set(item.word.toLowerCase(), item);
      });
      
      // Then add history (overwriting or keeping defaults depends on preference, 
      // here history will overwrite defaults if same word exists)
      historyItems.forEach((item: any) => {
        combinedMap.set(item.word.toLowerCase(), item);
      });

      const allItems = Array.from(combinedMap.values());

      if (allItems.length === 0) {
        setResults([]);
        return;
      }

      // Shuffle and take up to 20
      const shuffled = [...allItems].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 20);

      // Map to results format
      const formatted = selected.map((item: any) => ({
        id: item.id,
        imageUrl: `https://static.arasaac.org/pictograms/${item.id}/${item.id}_300.png`,
        keywords: [item.word],
        score: 0
      }));

      setResults(formatted);
    } catch (error) {
      console.error("Error loading random history:", error);
    } finally {
      setLoading(false);
    }
  };

  const speakText = async (text: string) => {
    let resolvedVoiceId = esVoiceId;
    
    // Resolve dynamic voice explicitly if state hasn't captured it yet
    if (!resolvedVoiceId) {
      try {
        const locales = Localization.getLocales();
        const sysLocale = locales && locales.length > 0 ? locales[0].languageTag : 'es-ES';
        
        const voices = await Speech.getAvailableVoicesAsync();
        let voice = voices.find(v => v.language.replace('_', '-') === sysLocale);
        
        if (!voice) {
          voice = voices.find(v => v.language.startsWith('es'));
        }

        if (voice) {
          resolvedVoiceId = voice.identifier;
          setEsVoiceId(resolvedVoiceId);
        }
      } catch (e) {
        console.log("Voice fetch error:", e);
      }
    }
    
    Speech.speak(text, resolvedVoiceId ? { voice: resolvedVoiceId } : { language: 'es-ES' });
  };

  const handleSearch = (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    Keyboard.dismiss();
    // Añadir al stack de navegación nativo usando push:
    router.push({ pathname: '/', params: { searchStr: q } });
  };

  const executeSearch = async (q: string) => {
    speakText(q);

    setLoading(true);
    try {
      const data = await searchPictograms(q);
      setResults(data);
      if (data && data.length > 0) {
        // Guardamos el primer _id del resultado
        await saveHistory(q, data[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePictoPress = async (pictoWord: string) => {
    if (!pictoWord) return;
    
    // Si ya se está leyendo algo en voz alta, no hacer nada
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) return;
    
    if (isPlayMode) {
      if (pictoWord.trim().localeCompare(query.trim(), 'es', { sensitivity: 'base' }) !== 0) {
        setQuery(pictoWord);
        handleSearch(pictoWord);
      } else {
        speakText(pictoWord);
      }
    } else {
      speakText(pictoWord);
    }
  };

  const showLegalInfo = () => {
    Alert.alert(
      "Sobre BuscaPictos",
      "❤ Dedicado con todo mi cariño a mi hija Alejandra.\n\n" +
      "Esta aplicación es una herramienta independiente y gratuita.\n\n" +
      "Al utilizar recursos de ARASAAC, esta aplicación se distribuye íntegramente bajo la licencia Creative Commons BY-NC-SA.\n\n" +
      "Los pictogramas son propiedad del Gobierno de Aragón, creados por Sergio Palao para ARASAAC. Fuente oficial: arasaac.org",
      [
        { text: "Cerrar", style: "cancel" },
        { text: "Visitar ARASAAC", onPress: () => Linking.openURL('https://arasaac.org') }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(15, insets.top + 5) }]}>
        <Text style={styles.title}>BuscaPictos</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerBtn} onPress={showLegalInfo}>
            <Ionicons name="information-circle-outline" size={28} color="#FF6B6B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setIsPlayMode(!isPlayMode)}>
            <Ionicons name={isPlayMode ? "play-circle" : "pause-circle"} size={32} color="#FF6B6B" />
          </TouchableOpacity>
          <Link href="/history_modal" asChild>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="time" size={28} color="#FF6B6B" />
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Escribe una palabra ..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color="#bbb" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch()}>
          <Ionicons name="search" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerMode}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centerMode}>
          <Ionicons name="images-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>¡Busca algo para ver los pictogramas!</Text>
        </View>
      ) : (
        <FlatList
          key={numColumns} // Force re-render on orientation change
          data={results}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          contentContainerStyle={styles.gridContainer}
          renderItem={({ item }) => {
            const word = item.keywords.length > 0 ? item.keywords[0] : '';
            return (
              <TouchableOpacity 
                style={[styles.gridItem, { width: (width - 32) / numColumns - 10 }]}
                onPress={() => handlePictoPress(word)}
                activeOpacity={0.7}
              >
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="contain" />
                </View>
                {item.keywords.slice(0, 1).map((kw: string, idx: number) => (
                  <Text key={idx} style={styles.keyword} numberOfLines={2}>{kw}</Text>
                ))}
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
  header: {
    paddingHorizontal: 20, paddingBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 3
  },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { padding: 4, marginLeft: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#333' },
  searchContainer: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  inputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 25, borderWidth: 1, borderColor: '#E0E0E0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  searchInput: {
    flex: 1, height: 50, paddingHorizontal: 20, fontSize: 16, color: '#333'
  },
  clearButton: {
    padding: 10, marginRight: 5
  },
  searchButton: {
    marginLeft: 10, width: 50, height: 50, borderRadius: 25, backgroundColor: '#FF6B6B',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4
  },
  centerMode: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 15, fontSize: 18, color: '#888', fontWeight: '500' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#FF6B6B' },
  gridContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  gridItem: { margin: 5, alignItems: 'center' },
  imageContainer: {
    width: '100%', aspectRatio: 1, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', padding: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F0F0F0'
  },
  image: { width: '100%', height: '100%' },
  keyword: { marginTop: 8, fontSize: 14, fontWeight: '600', color: '#444', textAlign: 'center', textTransform: 'capitalize' }
});
