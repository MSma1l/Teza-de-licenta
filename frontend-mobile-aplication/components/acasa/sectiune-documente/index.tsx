import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CuloriApp } from '@/constants/culori';
import { CardDocument } from '../card-document';
import { styles } from './styles';

const DOCUMENTE_EXEMPLU = [
  {
    id: '1',
    nume: 'DocumentName',
    elemente: [
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
    ],
  },
  {
    id: '2',
    nume: 'DocumentName 2',
    elemente: [
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
    ],
  },
  {
    id: '3',
    nume: 'DocumentName 3',
    elemente: [
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
      'the necessary information.',
    ],
  },
];

interface ProprietatiSectiuneDocumente {
  laApasareCreare?: () => void;
  laApasareVeziToate?: () => void;
}

export function SectiuneDocumente({ laApasareCreare, laApasareVeziToate }: ProprietatiSectiuneDocumente) {
  return (
    <View style={styles.container}>
      <Text style={styles.titlu}>The most often{'\n'}generated{'\n'}documents</Text>
      <Text style={styles.descriere}>
        The following are the most often generated documents and the necessary information.
      </Text>

      <Pressable onPress={laApasareCreare} style={styles.butonCreare}>
        <Text style={styles.textButonCreare}>Create document</Text>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.continutScroll}
      >
        {DOCUMENTE_EXEMPLU.map((doc) => (
          <CardDocument key={doc.id} nume={doc.nume} elemente={doc.elemente} />
        ))}
      </ScrollView>

      <Pressable onPress={laApasareVeziToate} style={styles.butonCta}>
        <Text style={styles.textCta}>View all documents</Text>
        <Ionicons name="arrow-forward" size={16} color={CuloriApp.textPrimar} />
      </Pressable>
    </View>
  );
}
