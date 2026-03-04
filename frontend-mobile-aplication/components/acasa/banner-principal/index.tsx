import { View, Text } from 'react-native';
import { styles } from './styles';

export function BannerPrincipal() {
  return (
    <View style={styles.container}>
      <Text style={styles.titlu}>Smart financial{'\n'}management solutions</Text>
    </View>
  );
}
