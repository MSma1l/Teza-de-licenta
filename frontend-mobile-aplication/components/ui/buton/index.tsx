import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

interface ProprietatiButon {
  text: string;
  laApasare: () => void;
  seIncarca?: boolean;
  dezactivat?: boolean;
}

export function Buton({ text, laApasare, seIncarca = false, dezactivat = false }: ProprietatiButon) {
  return (
    <Pressable
      onPress={laApasare}
      disabled={dezactivat || seIncarca}
      style={[styles.container, (seIncarca || dezactivat) && styles.containerSeIncarca]}>
      <Text style={styles.text}>{text}</Text>
      <View style={styles.cercIconita}>
        {seIncarca ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
        )}
      </View>
    </Pressable>
  );
}
