/**
 * Ecran Acasa - Hub de comunicare
 *
 * Continut:
 * - Header cu salutare si avatar
 * - Buton mare "Intrebare urgenta AI" - deschide chat cu AI-ul instant
 * - Lista conversatiilor cu contabili (cele mai recente sus)
 * - Stari: loading, gol (fara conversatii), cu date
 */
import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CuloriApp } from '@/constants/culori';
import { useAutentificare } from '@/hooks/use-autentificare';
import { obtineConversatii, type ConversatieChat } from '@/lib/api/serviciu-chat';
import { OpenOnWeb } from '@/components/open-on-web';
import { AlegeContabil } from '@/components/alege-contabil';
import { ChatDjarvis } from '@/components/chat-djarvis';
import { stiluri } from './styles-acasa';

function formateazaData(dataIso: string): string {
  const data = new Date(dataIso);
  const acum = new Date();
  const diferentaMs = acum.getTime() - data.getTime();
  const diferentaMin = Math.floor(diferentaMs / 60000);
  const diferentaOre = Math.floor(diferentaMin / 60);
  const diferentaZile = Math.floor(diferentaOre / 24);

  if (diferentaMin < 1) return 'Acum';
  if (diferentaMin < 60) return `${diferentaMin} min`;
  if (diferentaOre < 24) return `${diferentaOre} h`;
  if (diferentaZile < 7) return `${diferentaZile} z`;
  return data.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
}

function previzualizareUltimMesaj(conversatie: ConversatieChat): string {
  const ultim = conversatie.messages[conversatie.messages.length - 1];
  if (!ultim) return 'Conversatie noua';
  const text = ultim.content;
  return text.length > 80 ? text.slice(0, 80) + '...' : text;
}

export default function EcranAcasa() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { utilizator } = useAutentificare();

  const [conversatii, setConversatii] = useState<ConversatieChat[]>([]);
  const [seIncarca, setSeIncarca] = useState(true);
  const [reincarcare, setReincarcare] = useState(false);
  const [modalContabil, setModalContabil] = useState(false);
  const [chatVizibil, setChatVizibil] = useState(false);
  const [chatConversatieId, setChatConversatieId] = useState<string | null>(null);

  const deschideChat = useCallback((conversationId?: string | null) => {
    setChatConversatieId(conversationId ?? null);
    setChatVizibil(true);
  }, []);

  const incarcaConversatii = useCallback(async () => {
    try {
      const date = await obtineConversatii();
      setConversatii(date);
    } catch {
      setConversatii([]);
    } finally {
      setSeIncarca(false);
      setReincarcare(false);
    }
  }, []);

  useEffect(() => {
    incarcaConversatii();
  }, [incarcaConversatii]);

  const laReincarcare = useCallback(() => {
    setReincarcare(true);
    incarcaConversatii();
  }, [incarcaConversatii]);

  const numeUtilizator = utilizator?.numeUtilizator || 'Utilizator';
  const initialaNume = numeUtilizator.charAt(0).toUpperCase();

  return (
    <View style={[stiluri.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={stiluri.scroll}
        contentContainerStyle={stiluri.continutScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={reincarcare}
            onRefresh={laReincarcare}
            tintColor={CuloriApp.primar}
            colors={[CuloriApp.primar]}
          />
        }
      >
        {/* Header cu salutare */}
        <View style={stiluri.antet}>
          <View style={stiluri.antetText}>
            <Text style={stiluri.salutare}>Buna ziua,</Text>
            <Text style={stiluri.numeUtilizator}>{numeUtilizator}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <OpenOnWeb cale="/home" varianta="icon" />
            <TouchableOpacity
              style={stiluri.avatar}
              onPress={() => router.push('/(taburi)/profil')}
              activeOpacity={0.8}
            >
              <Text style={stiluri.avatarText}>{initialaNume}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner cu intrebare urgenta AI */}
        <TouchableOpacity
          style={stiluri.bannerAi}
          activeOpacity={0.9}
          onPress={() => deschideChat(null)}
        >
          <View style={stiluri.bannerAiOverlay} />
          <View style={stiluri.bannerAiContinut}>
            <View style={stiluri.bannerAiIconWrap}>
              <Ionicons name="sparkles" size={28} color="#FFFFFF" />
            </View>
            <View style={stiluri.bannerAiText}>
              <Text style={stiluri.bannerAiTitlu}>Intrebare urgenta?</Text>
              <Text style={stiluri.bannerAiSubtitlu}>
                Asistentul AI raspunde instant la intrebari contabile
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Sectiune actiuni rapide */}
        <View style={stiluri.actiuniRapide}>
          <TouchableOpacity style={stiluri.actiuneRapida} activeOpacity={0.85}>
            <View style={[stiluri.actiuneIcon, { backgroundColor: '#eef2ff' }]}>
              <Ionicons name="receipt-outline" size={22} color={CuloriApp.primar} />
            </View>
            <Text style={stiluri.actiuneText}>Factura</Text>
          </TouchableOpacity>
          <TouchableOpacity style={stiluri.actiuneRapida} activeOpacity={0.85}>
            <View style={[stiluri.actiuneIcon, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="calculator-outline" size={22} color={CuloriApp.secundar} />
            </View>
            <Text style={stiluri.actiuneText}>TVA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={stiluri.actiuneRapida} activeOpacity={0.85}>
            <View style={[stiluri.actiuneIcon, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="document-text-outline" size={22} color={CuloriApp.accent} />
            </View>
            <Text style={stiluri.actiuneText}>Raport</Text>
          </TouchableOpacity>
          <TouchableOpacity style={stiluri.actiuneRapida} activeOpacity={0.85}>
            <View style={[stiluri.actiuneIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="cash-outline" size={22} color={CuloriApp.succes} />
            </View>
            <Text style={stiluri.actiuneText}>Salarii</Text>
          </TouchableOpacity>
        </View>

        {/* Card alege contabil */}
        <TouchableOpacity
          style={stiluri.cardContabil}
          activeOpacity={0.85}
          onPress={() => setModalContabil(true)}
        >
          <View style={stiluri.cardContabilIcon}>
            <Ionicons name="people" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={stiluri.cardContabilTitlu}>Alege un contabil</Text>
            <Text style={stiluri.cardContabilSubtitlu}>
              Conecteaza-te cu un contabil disponibil
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={CuloriApp.primar} />
        </TouchableOpacity>

        {/* Sectiune conversatii */}
        <View style={stiluri.sectiuneConversatii}>
          <View style={stiluri.antetSectiune}>
            <Text style={stiluri.titluSectiune}>Conversatiile mele</Text>
            <OpenOnWeb cale="/home" varianta="pill" text="Chat pe web" />
          </View>

          {seIncarca ? (
            <View style={stiluri.stareIncarcare}>
              <ActivityIndicator color={CuloriApp.primar} />
              <Text style={stiluri.stareIncarcareText}>Se incarca...</Text>
            </View>
          ) : conversatii.length === 0 ? (
            <View style={stiluri.stareGoala}>
              <View style={stiluri.stareGoalaIconWrap}>
                <Ionicons name="chatbubbles-outline" size={36} color={CuloriApp.primar} />
              </View>
              <Text style={stiluri.stareGoalaTitlu}>Nicio conversatie inca</Text>
              <Text style={stiluri.stareGoalaText}>
                Apasa pe butonul de sus pentru a incepe o conversatie cu AI sau un contabil
              </Text>
            </View>
          ) : (
            conversatii.map((conv) => {
              const ultimMesaj = conv.messages[conv.messages.length - 1];
              const esteEscalat = conv.is_escalated && !conv.is_resolved;
              const esteAi = ultimMesaj?.sender_type === 'ai';
              const esteContabil = ultimMesaj?.sender_type === 'contabil';

              return (
                <TouchableOpacity
                  key={conv.id}
                  style={stiluri.cardConversatie}
                  activeOpacity={0.85}
                  onPress={() => deschideChat(conv.id)}
                >
                  <View
                    style={[
                      stiluri.cardAvatar,
                      esteContabil && { backgroundColor: CuloriApp.succesFundal },
                      esteEscalat && { backgroundColor: CuloriApp.avertizareFundal },
                    ]}
                  >
                    <Ionicons
                      name={
                        esteContabil
                          ? 'person'
                          : esteEscalat
                            ? 'time-outline'
                            : 'sparkles'
                      }
                      size={20}
                      color={
                        esteContabil
                          ? CuloriApp.succes
                          : esteEscalat
                            ? CuloriApp.avertizare
                            : CuloriApp.primar
                      }
                    />
                  </View>
                  <View style={stiluri.cardContinut}>
                    <View style={stiluri.cardAntet}>
                      <Text style={stiluri.cardTitlu} numberOfLines={1}>
                        {esteContabil
                          ? 'Contabil'
                          : esteEscalat
                            ? 'In asteptare contabil'
                            : esteAi
                              ? 'Asistent AI'
                              : 'Conversatie'}
                      </Text>
                      <Text style={stiluri.cardData}>{formateazaData(conv.created_at)}</Text>
                    </View>
                    <Text style={stiluri.cardMesaj} numberOfLines={2}>
                      {previzualizareUltimMesaj(conv)}
                    </Text>
                    {esteEscalat && (
                      <View style={stiluri.eticheta}>
                        <Ionicons name="time" size={11} color={CuloriApp.avertizare} />
                        <Text style={stiluri.etichetaText}>Asteapta raspuns</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal alegere contabil */}
      <Modal
        visible={modalContabil}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalContabil(false)}
      >
        <AlegeContabil
          laInchidere={() => setModalContabil(false)}
          laAlegere={() => setModalContabil(false)}
        />
      </Modal>

      {/* Chat cu Djarvis — full screen */}
      <ChatDjarvis
        vizibil={chatVizibil}
        conversatieId={chatConversatieId}
        laInchide={() => {
          setChatVizibil(false);
          // Reincarca conversatiile sa vedem pe home-ul actualizat
          incarcaConversatii();
        }}
        laSchimbareConversatie={(id) => setChatConversatieId(id)}
      />
    </View>
  );
}
