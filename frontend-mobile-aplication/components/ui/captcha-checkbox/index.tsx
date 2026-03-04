import { useState, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

interface ProprietatiCaptchaCheckbox {
  valoare: boolean;
  laSchimbare: (validat: boolean) => void;
  eroare?: string;
}

export function CaptchaCheckbox({ valoare, laSchimbare, eroare }: ProprietatiCaptchaCheckbox) {
  const [seVerifica, setSeVerifica] = useState(false);
  const timpApasare = useRef<number>(0);

  const laApasare = () => {
    if (valoare || seVerifica) return;

    timpApasare.current = Date.now();
    setSeVerifica(true);

    // Simuleaza verificare - asteapta 2 secunde
    setTimeout(() => {
      const durataApasare = Date.now() - timpApasare.current;

      // Daca a trecut prea repede (sub 500ms) = bot
      if (durataApasare < 500) {
        setSeVerifica(false);
        return;
      }

      setSeVerifica(false);
      laSchimbare(true);
    }, 2000);
  };

  return (
    <View>
      <Pressable
        onPress={laApasare}
        style={[styles.container, eroare && !valoare && styles.containerEroare]}>
        <View
          style={[
            styles.checkbox,
            valoare && styles.checkboxValidat,
            seVerifica && styles.checkboxSeVerifica,
          ]}>
          {seVerifica ? (
            <ActivityIndicator size="small" color="#999" />
          ) : valoare ? (
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          ) : null}
        </View>
        <Text style={styles.text}>Nu sunt robot</Text>
      </Pressable>
      {eroare && !valoare && <Text style={styles.textEroare}>{eroare}</Text>}
    </View>
  );
}
