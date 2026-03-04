import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CuloriApp } from '@/constants/culori';
import { styles } from './styles';

interface ProprietatiCardDocument {
  nume: string;
  elemente: string[];
}

export function CardDocument({ nume, elemente }: ProprietatiCardDocument) {
  return (
    <View style={styles.card}>
      <Text style={styles.titluCard}>{nume}</Text>
      {elemente.map((element, index) => (
        <View key={index} style={styles.elementBifat}>
          <Ionicons name="checkmark" size={18} color={CuloriApp.textPrimar} />
          <Text style={styles.textBifat}>{element}</Text>
        </View>
      ))}
    </View>
  );
}
