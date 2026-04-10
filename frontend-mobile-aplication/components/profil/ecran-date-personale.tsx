/**
 * Ecran Date personale — editare nume, email, telefon direct in aplicatia mobila.
 */
import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CuloriApp } from '@/constants/culori';
import { useAutentificare } from '@/hooks/use-autentificare';
import { cerereApi } from '@/lib/api/client-api';
import { sanitizeazaInput, sanitizeazaEmail } from '@/lib/securitate/sanitizare';

interface Props {
  laInchidere: () => void;
}

export function EcranDatePersonale({ laInchidere }: Props) {
  const { utilizator } = useAutentificare();
  const [nume, setNume] = useState(utilizator?.numeUtilizator || '');
  const [email, setEmail] = useState(utilizator?.email || '');
  const [telefon, setTelefon] = useState('');
  const [seIncarca, setSeIncarca] = useState(false);

  const handleSalveaza = async () => {
    if (!nume.trim()) {
      Alert.alert('Eroare', 'Numele este obligatoriu');
      return;
    }
    setSeIncarca(true);
    try {
      await cerereApi('/users/me', {
        metoda: 'PUT',
        corp: {
          full_name: sanitizeazaInput(nume.trim()),
          email: sanitizeazaEmail(email),
          phone: telefon.replace(/[^0-9+]/g, '') || null,
        },
      });
      Alert.alert('Succes', 'Datele au fost salvate!', [
        { text: 'OK', onPress: laInchidere },
      ]);
    } catch (err) {
      Alert.alert('Eroare', err instanceof Error ? err.message : 'Eroare la salvare');
    } finally {
      setSeIncarca(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={laInchidere} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={CuloriApp.textPrimar} />
          </Pressable>
          <Text style={s.titlu}>Date personale</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Form */}
        <View style={s.form}>
          <View style={s.camp}>
            <Text style={s.label}>Nume complet</Text>
            <View style={s.inputWrap}>
              <Ionicons name="person-outline" size={20} color={CuloriApp.textEstompat} />
              <TextInput
                style={s.input}
                value={nume}
                onChangeText={(v) => setNume(v.replace(/[<>"'`]/g, '').slice(0, 200))}
                placeholder="Numele tau"
                placeholderTextColor={CuloriApp.textEstompat}
                maxLength={200}
              />
            </View>
          </View>

          <View style={s.camp}>
            <Text style={s.label}>Email</Text>
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={20} color={CuloriApp.textEstompat} />
              <TextInput
                style={s.input}
                value={email}
                onChangeText={(v) => setEmail(v.replace(/[<>"'`\s]/g, '').slice(0, 255))}
                placeholder="email@exemplu.md"
                placeholderTextColor={CuloriApp.textEstompat}
                keyboardType="email-address"
                autoCapitalize="none"
                maxLength={255}
              />
            </View>
          </View>

          <View style={s.camp}>
            <Text style={s.label}>Telefon</Text>
            <View style={s.inputWrap}>
              <Ionicons name="call-outline" size={20} color={CuloriApp.textEstompat} />
              <TextInput
                style={s.input}
                value={telefon}
                onChangeText={(v) => setTelefon(v.replace(/[^0-9+]/g, '').slice(0, 16))}
                placeholder="+373 XXXXXXXX"
                placeholderTextColor={CuloriApp.textEstompat}
                keyboardType="phone-pad"
                maxLength={16}
              />
            </View>
          </View>
        </View>

        {/* Buton salvare */}
        <Pressable
          onPress={handleSalveaza}
          disabled={seIncarca}
          style={({ pressed }) => [s.butonSalvare, pressed && { opacity: 0.85 }]}
        >
          {seIncarca ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={s.butonText}>Salveaza</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: CuloriApp.fundalSecundar },
  scroll: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24,
  },
  titlu: { fontSize: 20, fontWeight: '800', color: CuloriApp.textPrimar },
  form: { gap: 16 },
  camp: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: CuloriApp.textSecundar, marginLeft: 4 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CuloriApp.fundalCard, borderRadius: 14,
    borderWidth: 1, borderColor: CuloriApp.bordura,
    paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  input: { flex: 1, fontSize: 15, color: CuloriApp.textPrimar, fontWeight: '500' },
  butonSalvare: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: CuloriApp.primar, paddingVertical: 14, borderRadius: 14,
    marginTop: 28,
    ...Platform.select({
      ios: { shadowColor: CuloriApp.primar, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  butonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
