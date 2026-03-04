import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const CHEIE_TOKEN = 'token_autentificare';

const esteWeb = Platform.OS === 'web';

export async function salveazaToken(token: string): Promise<void> {
  if (esteWeb) {
    localStorage.setItem(CHEIE_TOKEN, token);
  } else {
    await SecureStore.setItemAsync(CHEIE_TOKEN, token);
  }
}

export async function citesteToken(): Promise<string | null> {
  if (esteWeb) {
    return localStorage.getItem(CHEIE_TOKEN);
  }
  return await SecureStore.getItemAsync(CHEIE_TOKEN);
}

export async function stergeToken(): Promise<void> {
  if (esteWeb) {
    localStorage.removeItem(CHEIE_TOKEN);
  } else {
    await SecureStore.deleteItemAsync(CHEIE_TOKEN);
  }
}
