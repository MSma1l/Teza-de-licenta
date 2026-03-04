import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CuloriApp } from '@/constants/culori';
import { styles } from './styles';

interface ProprietatiSectiuneAntet {
  numeUtilizator: string;
  laApasareAvatar?: () => void;
}

export function SectiuneAntet({ numeUtilizator, laApasareAvatar }: ProprietatiSectiuneAntet) {
  return (
    <View style={styles.container}>
      <Text style={styles.salut}>Hello, {numeUtilizator}!</Text>
      <Pressable onPress={laApasareAvatar} style={styles.butonAvatar}>
        <View style={styles.avatar}>
          <Ionicons name="person-circle-outline" size={36} color={CuloriApp.textPrimar} />
        </View>
      </Pressable>
    </View>
  );
}
