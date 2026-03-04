import { ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ProprietatiSectiuneAnimata {
  children: React.ReactNode;
  intarziere?: number;
  stil?: ViewStyle;
}

export function SectiuneAnimata({
  children,
  intarziere = 0,
  stil,
}: ProprietatiSectiuneAnimata) {
  return (
    <Animated.View
      entering={FadeInDown.delay(intarziere).duration(700).springify()}
      style={stil}>
      {children}
    </Animated.View>
  );
}
