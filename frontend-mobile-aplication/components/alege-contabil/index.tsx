/**
 * Ecran alegere contabil — lista contabililor disponibili cu avatare si buton "Alege".
 * Se poate deschide ca modal sau inline.
 */
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CuloriApp } from '@/constants/culori';
import {
  obtineContabiliDisponibili,
  alegeContabil,
  type ContabilInfo,
} from '@/lib/api/serviciu-contabili';

interface AlegeContabilProps {
  laInchidere?: () => void;
  laAlegere?: (contabil: ContabilInfo) => void;
}

export function AlegeContabil({ laInchidere, laAlegere }: AlegeContabilProps) {
  const [contabili, setContabili] = useState<ContabilInfo[]>([]);
  const [seIncarca, setSeIncarca] = useState(true);
  const [alegereInCurs, setAlegereInCurs] = useState<string | null>(null);
  const [eroare, setEroare] = useState('');

  useEffect(() => {
    incarca();
  }, []);

  const incarca = async () => {
    setSeIncarca(true);
    setEroare('');
    try {
      const lista = await obtineContabiliDisponibili();
      setContabili(lista);
    } catch (err) {
      setEroare(err instanceof Error ? err.message : 'Eroare la incarcarea contabililor');
    } finally {
      setSeIncarca(false);
    }
  };

  const handleAlege = async (contabil: ContabilInfo) => {
    setAlegereInCurs(contabil.id);
    try {
      await alegeContabil(contabil.id);
      Alert.alert(
        'Succes',
        `Contabilul ${contabil.full_name || contabil.username} a fost asignat cu succes!`,
        [{ text: 'OK', onPress: () => laAlegere?.(contabil) }],
      );
    } catch (err) {
      const mesaj = err instanceof Error ? err.message : 'Eroare la asignare';
      Alert.alert('Eroare', mesaj);
    } finally {
      setAlegereInCurs(null);
    }
  };

  const renderContabil = ({ item }: { item: ContabilInfo }) => {
    const initiala = (item.full_name || item.username).charAt(0).toUpperCase();
    const esteInCurs = alegereInCurs === item.id;

    return (
      <View style={stiluri.card}>
        {/* Avatar */}
        <View style={stiluri.avatar}>
          <Text style={stiluri.avatarText}>{initiala}</Text>
        </View>

        {/* Info */}
        <View style={stiluri.info}>
          <Text style={stiluri.nume}>{item.full_name || item.username}</Text>
          <Text style={stiluri.email}>{item.email}</Text>
          {item.phone && (
            <View style={stiluri.telefonRow}>
              <Ionicons name="call-outline" size={12} color={CuloriApp.textEstompat} />
              <Text style={stiluri.telefon}>{item.phone}</Text>
            </View>
          )}
        </View>

        {/* Buton alege */}
        <Pressable
          onPress={() => handleAlege(item)}
          disabled={esteInCurs}
          style={({ pressed }) => [stiluri.butonAlege, pressed && { opacity: 0.7 }]}
        >
          {esteInCurs ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              <Text style={stiluri.butonText}>Alege</Text>
            </>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <View style={stiluri.container}>
      {/* Header */}
      <View style={stiluri.header}>
        <View style={{ flex: 1 }}>
          <Text style={stiluri.titlu}>Alege un contabil</Text>
          <Text style={stiluri.subtitlu}>
            {contabili.length} contabili disponibili
          </Text>
        </View>
        {laInchidere && (
          <Pressable onPress={laInchidere} hitSlop={10}>
            <Ionicons name="close" size={24} color={CuloriApp.textSecundar} />
          </Pressable>
        )}
      </View>

      {/* Continut */}
      {seIncarca ? (
        <View style={stiluri.centrat}>
          <ActivityIndicator size="large" color={CuloriApp.primar} />
        </View>
      ) : eroare ? (
        <View style={stiluri.centrat}>
          <Ionicons name="alert-circle-outline" size={48} color={CuloriApp.eroare} />
          <Text style={stiluri.eroareText}>{eroare}</Text>
          <Pressable onPress={incarca} style={stiluri.butonRetry}>
            <Text style={stiluri.butonRetryText}>Reincearca</Text>
          </Pressable>
        </View>
      ) : contabili.length === 0 ? (
        <View style={stiluri.centrat}>
          <Ionicons name="people-outline" size={48} color={CuloriApp.textEstompat} />
          <Text style={stiluri.golText}>Niciun contabil disponibil momentan</Text>
        </View>
      ) : (
        <FlatList
          data={contabili}
          keyExtractor={(item) => item.id}
          renderItem={renderContabil}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const stiluri = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CuloriApp.fundalSecundar,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  titlu: {
    fontSize: 22,
    fontWeight: '800',
    color: CuloriApp.textPrimar,
  },
  subtitlu: {
    fontSize: 13,
    color: CuloriApp.textSecundar,
    marginTop: 2,
  },
  centrat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  },
  eroareText: {
    fontSize: 14,
    color: CuloriApp.eroare,
    textAlign: 'center',
  },
  golText: {
    fontSize: 14,
    color: CuloriApp.textEstompat,
    textAlign: 'center',
  },
  butonRetry: {
    backgroundColor: CuloriApp.primar,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  butonRetryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: CuloriApp.fundalCard,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: CuloriApp.primar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  info: {
    flex: 1,
  },
  nume: {
    fontSize: 16,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
  },
  email: {
    fontSize: 13,
    color: CuloriApp.textSecundar,
    marginTop: 2,
  },
  telefonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  telefon: {
    fontSize: 12,
    color: CuloriApp.textEstompat,
  },
  butonAlege: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CuloriApp.primar,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  butonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
