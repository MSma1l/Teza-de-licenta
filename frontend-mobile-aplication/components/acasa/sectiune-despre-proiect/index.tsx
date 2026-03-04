import { View, Text } from 'react-native';
import { styles } from './styles';

export function SectiuneDespreProiect() {
  return (
    <View style={styles.container}>
      <Text style={styles.titlu}>About Project</Text>
      <Text style={styles.descriere}>
        About Project Text About Project Text About Project Text About Project Text About Project Text
      </Text>
    </View>
  );
}
