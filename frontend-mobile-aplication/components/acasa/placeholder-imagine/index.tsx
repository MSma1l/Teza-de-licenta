import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CuloriApp } from '@/constants/culori';
import { styles } from './styles';

interface ProprietatiPlaceholderImagine {
  latime?: number | string;
  inaltime?: number;
  eticheta?: string;
}

export function PlaceholderImagine({ latime = '100%', inaltime = 180, eticheta }: ProprietatiPlaceholderImagine) {
  return (
    <View style={[styles.container, { width: latime as number, height: inaltime }]}>
      <Ionicons name="image-outline" size={40} color={CuloriApp.textEstompat} />
      {eticheta && <Text style={styles.eticheta}>{eticheta}</Text>}
    </View>
  );
}
