import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CuloriApp } from '@/constants/culori';
import { styles } from './styles';

interface ElementLege {
  id: string;
  titlu: string;
  descriere: string;
  iconita: keyof typeof Ionicons.glyphMap;
}

const DATE_LEGI: ElementLege[] = [
  {
    id: '1',
    titlu: 'Laws 12.1',
    descriere: 'texttexttexttexttexttexttexttexttexttexttexttexttexttextexttexttexttexttexttexttext',
    iconita: 'globe-outline',
  },
  {
    id: '2',
    titlu: 'Laws 12.2',
    descriere: 'texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext',
    iconita: 'globe-outline',
  },
  {
    id: '3',
    titlu: 'Laws 12.3',
    descriere: 'texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext',
    iconita: 'people-outline',
  },
  {
    id: '4',
    titlu: 'Laws 12/2',
    descriere: 'texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext',
    iconita: 'trending-up-outline',
  },
];

function CardLege({ element }: { element: ElementLege }) {
  return (
    <View style={styles.cardLege}>
      <Ionicons name={element.iconita} size={22} color={CuloriApp.textPrimar} />
      <Text style={styles.titluLege}>{element.titlu}</Text>
      <Text style={styles.descriereLege} numberOfLines={4}>
        {element.descriere}
      </Text>
    </View>
  );
}

interface ProprietatiSectiuneLegi {
  laApasareVeziToate?: () => void;
}

export function SectiuneLegi({ laApasareVeziToate }: ProprietatiSectiuneLegi) {
  return (
    <View style={styles.container}>
      <Text style={styles.titluSectiune}>The main laws in the field</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.continutScroll}
      >
        {DATE_LEGI.map((element) => (
          <CardLege key={element.id} element={element} />
        ))}
      </ScrollView>

      <Pressable onPress={laApasareVeziToate} style={styles.butonCta}>
        <Text style={styles.textCta}>See all laws</Text>
        <Ionicons name="arrow-forward" size={16} color={CuloriApp.textPrimar} />
      </Pressable>
    </View>
  );
}
