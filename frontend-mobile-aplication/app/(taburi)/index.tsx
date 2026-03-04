import { StyleSheet, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectiuneAntet } from '@/components/acasa/sectiune-antet';
import { BannerPrincipal } from '@/components/acasa/banner-principal';
import { SectiuneDespreProiect } from '@/components/acasa/sectiune-despre-proiect';
import { SectiuneLegi } from '@/components/acasa/sectiune-legi';
import { PlaceholderImagine } from '@/components/acasa/placeholder-imagine';
import { SectiuneDocumente } from '@/components/acasa/sectiune-documente';
import { SectiuneAnimata } from '@/components/sectiune-animata';
import { CuloriApp } from '@/constants/culori';

export default function EcranAcasa() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.vizualizareScroll}
        contentContainerStyle={styles.continutScroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}>
        <SectiuneAnimata intarziere={0}>
          <SectiuneAntet numeUtilizator="Maxim" laApasareAvatar={() => {}} />
        </SectiuneAnimata>

        <SectiuneAnimata intarziere={100}>
          <BannerPrincipal />
        </SectiuneAnimata>

        <SectiuneAnimata intarziere={200}>
          <SectiuneDespreProiect />
        </SectiuneAnimata>

        <SectiuneAnimata intarziere={300}>
          <SectiuneLegi laApasareVeziToate={() => {}} />
        </SectiuneAnimata>

        <SectiuneAnimata intarziere={400}>
          <View style={styles.sectiuneImagine}>
            <PlaceholderImagine inaltime={200} eticheta="Document" />
          </View>
        </SectiuneAnimata>

        <SectiuneAnimata intarziere={500}>
          <SectiuneDocumente laApasareCreare={() => {}} laApasareVeziToate={() => {}} />
        </SectiuneAnimata>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CuloriApp.fundal,
  },
  vizualizareScroll: {
    flex: 1,
  },
  continutScroll: {
    paddingBottom: 100,
  },
  sectiuneImagine: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
});
