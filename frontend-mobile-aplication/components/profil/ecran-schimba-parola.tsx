/**
 * Ecran Schimba parola — current + new + confirm, direct in aplicatie mobila.
 */
import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CuloriApp } from '@/constants/culori';
import { cerereApi } from '@/lib/api/client-api';

interface Props {
  laInchidere: () => void;
}

export function EcranSchimbaParola({ laInchidere }: Props) {
  const [parolaActuala, setParolaActuala] = useState('');
  const [parolaNoua, setParolaNoua] = useState('');
  const [confirmaParola, setConfirmaParola] = useState('');
  const [seIncarca, setSeIncarca] = useState(false);
  const [vizibil, setVizibil] = useState({ actual: false, nou: false, confirm: false });

  const handleSchimba = async () => {
    if (!parolaActuala || !parolaNoua || !confirmaParola) {
      Alert.alert('Eroare', 'Completeaza toate campurile');
      return;
    }
    if (parolaNoua.length < 8) {
      Alert.alert('Eroare', 'Parola noua trebuie sa aiba minim 8 caractere');
      return;
    }
    if (!/[A-Z]/.test(parolaNoua) || !/[a-z]/.test(parolaNoua) || !/\d/.test(parolaNoua)) {
      Alert.alert('Eroare', 'Parola trebuie sa contina: 1 majuscula, 1 minuscula, 1 cifra');
      return;
    }
    if (parolaNoua !== confirmaParola) {
      Alert.alert('Eroare', 'Parolele noi nu coincid');
      return;
    }

    setSeIncarca(true);
    try {
      await cerereApi('/users/me/change-password', {
        metoda: 'POST',
        corp: {
          current_password: parolaActuala,
          new_password: parolaNoua,
          confirm_password: confirmaParola,
        },
      });
      Alert.alert('Succes', 'Parola a fost schimbata!', [
        { text: 'OK', onPress: laInchidere },
      ]);
    } catch (err) {
      Alert.alert('Eroare', err instanceof Error ? err.message : 'Eroare la schimbarea parolei');
    } finally {
      setSeIncarca(false);
    }
  };

  const campParola = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    vizibilKey: 'actual' | 'nou' | 'confirm',
    placeholder: string,
  ) => (
    <View style={s.camp}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputWrap}>
        <Ionicons name="lock-closed-outline" size={20} color={CuloriApp.textEstompat} />
        <TextInput
          style={s.input}
          value={value}
          onChangeText={(v) => onChange(v.slice(0, 128))}
          placeholder={placeholder}
          placeholderTextColor={CuloriApp.textEstompat}
          secureTextEntry={!vizibil[vizibilKey]}
          maxLength={128}
        />
        <Pressable onPress={() => setVizibil((p) => ({ ...p, [vizibilKey]: !p[vizibilKey] }))}>
          <Ionicons
            name={vizibil[vizibilKey] ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={CuloriApp.textEstompat}
          />
        </Pressable>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Pressable onPress={laInchidere} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={CuloriApp.textPrimar} />
          </Pressable>
          <Text style={s.titlu}>Schimba parola</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Info securitate */}
        <View style={s.infoCard}>
          <Ionicons name="shield-checkmark" size={20} color={CuloriApp.primar} />
          <Text style={s.infoText}>
            Parola trebuie sa aiba minim 8 caractere, cel putin o majuscula, o minuscula si o cifra.
          </Text>
        </View>

        <View style={s.form}>
          {campParola('Parola actuala', parolaActuala, setParolaActuala, 'actual', 'Parola curenta')}
          {campParola('Parola noua', parolaNoua, setParolaNoua, 'nou', 'Parola noua')}
          {campParola('Confirma parola', confirmaParola, setConfirmaParola, 'confirm', 'Repeta parola noua')}
        </View>

        <Pressable
          onPress={handleSchimba}
          disabled={seIncarca}
          style={({ pressed }) => [s.buton, pressed && { opacity: 0.85 }]}
        >
          {seIncarca ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="key" size={18} color="#FFFFFF" />
              <Text style={s.butonText}>Schimba parola</Text>
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
    marginBottom: 20,
  },
  titlu: { fontSize: 20, fontWeight: '800', color: CuloriApp.textPrimar },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#eef2ff', borderRadius: 14, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: '#e0e7ff',
  },
  infoText: { flex: 1, fontSize: 13, color: CuloriApp.textSecundar, lineHeight: 18 },
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
  buton: {
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
