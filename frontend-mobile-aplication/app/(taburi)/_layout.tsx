import { Tabs } from 'expo-router';
import React from 'react';

import { BaraNavigare } from '@/components/bara-navigare';

export default function LayoutTaburi() {
  return (
    <Tabs
      tabBar={(props) => <BaraNavigare {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Acasa' }} />
      <Tabs.Screen name="meniu" options={{ title: 'Meniu' }} />
      <Tabs.Screen name="creare" options={{ title: 'Creare' }} />
      <Tabs.Screen name="notificari" options={{ title: 'Notificari' }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
