/**
 * Chat full-screen cu Djarvis — asistentul AI pentru legislatie RM.
 *
 * Deschis ca Modal din EcranAcasa:
 *  - fara conversationId  -> conversatie noua (urmatorul send o creeaza pe server)
 *  - cu conversationId    -> incarca istoricul si continua
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CuloriApp } from '@/constants/culori';
import {
  trimiteMesajChat,
  obtineConversatie,
  type MesajChat,
} from '@/lib/api/serviciu-chat';

interface Proprietati {
  vizibil: boolean;
  conversatieId?: string | null;
  laInchide: () => void;
  /** Cand conversatia se schimba (prima creere) — ca parintele sa refreseze lista */
  laSchimbareConversatie?: (id: string) => void;
}

const INTRO_DJARVIS = (
  'Salut! Sunt Djarvis, asistentul tau pentru legislatia fiscala si contabila a Moldovei. ' +
  'Spune-mi cu ce te pot ajuta — intrebari despre TVA, impozite, salarii, rapoarte, ' +
  'sau orice situatie in care te afli cu fisc-ul sau contabilitatea.'
);

export function ChatDjarvis({
  vizibil,
  conversatieId,
  laInchide,
  laSchimbareConversatie,
}: Proprietati) {
  const insets = useSafeAreaInsets();
  const [idConv, setIdConv] = useState<string | null>(conversatieId ?? null);
  const [mesaje, setMesaje] = useState<MesajChat[]>([]);
  const [textNou, setTextNou] = useState('');
  const [seIncarca, setSeIncarca] = useState(false);
  const [seTrimite, setSeTrimite] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  // --- Incarca conversatia existenta cand se deschide modal-ul ---
  useEffect(() => {
    if (!vizibil) return;
    setIdConv(conversatieId ?? null);
    if (!conversatieId) {
      setMesaje([]);
      return;
    }
    (async () => {
      setSeIncarca(true);
      try {
        const conv = await obtineConversatie(conversatieId);
        setMesaje(conv.messages || []);
      } catch {
        setMesaje([]);
      } finally {
        setSeIncarca(false);
      }
    })();
  }, [vizibil, conversatieId]);

  // Scroll jos la orice mesaj nou
  useEffect(() => {
    if (mesaje.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [mesaje.length, seTrimite]);

  const trimite = useCallback(async () => {
    const text = textNou.trim();
    if (!text || seTrimite) return;
    setTextNou('');

    // Optimistic UI: adauga mesajul userului imediat
    const tmpId = `tmp-${Date.now()}`;
    const mesajUser: MesajChat = {
      id: tmpId,
      conversation_id: idConv || 'tmp',
      sender_type: 'client',
      content: text,
      confidence: null,
      created_at: new Date().toISOString(),
    };
    setMesaje((prev) => [...prev, mesajUser]);
    setSeTrimite(true);

    try {
      const raspuns = await trimiteMesajChat(text, idConv || undefined);
      // Daca era o conversatie noua, serverul ne-a dat conversation_id
      if (!idConv && raspuns.conversation_id) {
        setIdConv(raspuns.conversation_id);
        laSchimbareConversatie?.(raspuns.conversation_id);
      }
      setMesaje((prev) => [...prev, raspuns]);
    } catch (e: any) {
      setMesaje((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          conversation_id: idConv || 'tmp',
          sender_type: 'ai',
          content:
            'Hmm, ceva nu a mers cu conexiunea. Verifica internetul si incearca din nou.',
          confidence: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSeTrimite(false);
    }
  }, [textNou, seTrimite, idConv, laSchimbareConversatie]);

  return (
    <Modal visible={vizibil} animationType="slide" onRequestClose={laInchide}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[s.antet, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={laInchide} hitSlop={16} style={s.butonInapoi}>
            <Ionicons name="arrow-back" size={22} color={CuloriApp.textPrimar} />
          </Pressable>
          <View style={s.antetText}>
            <View style={s.antetBranding}>
              <View style={s.avatarDjarvis}>
                <Ionicons name="sparkles" size={16} color="#fff" />
              </View>
              <View>
                <Text style={s.antetTitlu}>Djarvis</Text>
                <Text style={s.antetSubtitlu}>
                  {seTrimite ? 'scrie...' : 'Asistent legislatie RM'}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Mesaje */}
        <ScrollView
          ref={scrollRef}
          style={s.listaMesaje}
          contentContainerStyle={s.listaMesajeContinut}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {seIncarca ? (
            <View style={s.incarcareContainer}>
              <ActivityIndicator color={CuloriApp.primar} />
            </View>
          ) : mesaje.length === 0 ? (
            <IntroBula />
          ) : (
            mesaje.map((m) => <Bula key={m.id} mesaj={m} />)
          )}

          {seTrimite && <BulaScrieDjarvis />}
        </ScrollView>

        {/* Input */}
        <View style={[s.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            style={s.input}
            value={textNou}
            onChangeText={setTextNou}
            placeholder="Intreaba Djarvis..."
            placeholderTextColor={CuloriApp.textEstompat}
            multiline
            maxLength={2000}
            editable={!seTrimite}
          />
          <Pressable
            onPress={trimite}
            disabled={!textNou.trim() || seTrimite}
            style={({ pressed }) => [
              s.butonTrimite,
              (!textNou.trim() || seTrimite) && { opacity: 0.5 },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons
              name={seTrimite ? 'hourglass' : 'send'}
              size={18}
              color="#fff"
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function IntroBula() {
  return (
    <View style={s.rand}>
      <View style={s.avatarMicDjarvis}>
        <Ionicons name="sparkles" size={14} color="#fff" />
      </View>
      <View style={[s.bula, s.bulaAi]}>
        <Text style={s.textBulaAi}>{INTRO_DJARVIS}</Text>
      </View>
    </View>
  );
}

function Bula({ mesaj }: { mesaj: MesajChat }) {
  const eUser = mesaj.sender_type === 'client';
  const eContabil = mesaj.sender_type === 'contabil';

  if (eUser) {
    return (
      <View style={[s.rand, s.randDreapta]}>
        <View style={[s.bula, s.bulaUser]}>
          <Text style={s.textBulaUser}>{mesaj.content}</Text>
        </View>
      </View>
    );
  }

  // AI (Djarvis) sau contabil pe stanga
  return (
    <View style={s.rand}>
      <View style={[s.avatarMicDjarvis, eContabil && { backgroundColor: CuloriApp.succes }]}>
        <Ionicons
          name={eContabil ? 'person' : 'sparkles'}
          size={14}
          color="#fff"
        />
      </View>
      <View style={[s.bula, s.bulaAi]}>
        {eContabil && <Text style={s.etichetaMic}>Contabil</Text>}
        <Text style={s.textBulaAi}>{mesaj.content}</Text>
      </View>
    </View>
  );
}

function BulaScrieDjarvis() {
  return (
    <View style={s.rand}>
      <View style={s.avatarMicDjarvis}>
        <Ionicons name="sparkles" size={14} color="#fff" />
      </View>
      <View style={[s.bula, s.bulaAi, s.bulaScrie]}>
        <ActivityIndicator size="small" color={CuloriApp.primar} />
        <Text style={s.textScrie}>Djarvis cauta in legislatie...</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: CuloriApp.fundalSecundar },
  antet: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: CuloriApp.fundalCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CuloriApp.separator,
  },
  butonInapoi: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: CuloriApp.fundalInput,
  },
  antetText: { flex: 1, alignItems: 'center' },
  antetBranding: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarDjarvis: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: CuloriApp.primar,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: CuloriApp.primar, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
  antetTitlu: { fontSize: 15, fontWeight: '800', color: CuloriApp.textPrimar },
  antetSubtitlu: { fontSize: 11, color: CuloriApp.textSecundar, marginTop: 1 },

  listaMesaje: { flex: 1 },
  listaMesajeContinut: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, gap: 10 },
  incarcareContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },

  rand: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  randDreapta: { justifyContent: 'flex-end' },
  avatarMicDjarvis: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: CuloriApp.primar,
    alignItems: 'center', justifyContent: 'center',
  },
  bula: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bulaAi: {
    backgroundColor: CuloriApp.fundalCard,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
  },
  bulaUser: {
    backgroundColor: CuloriApp.primar,
    borderTopRightRadius: 4,
  },
  bulaScrie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textBulaAi: { fontSize: 14, color: CuloriApp.textPrimar, lineHeight: 20 },
  textBulaUser: { fontSize: 14, color: '#fff', lineHeight: 20 },
  textScrie: { fontSize: 12, color: CuloriApp.textSecundar, fontStyle: 'italic' },
  etichetaMic: {
    fontSize: 10,
    fontWeight: '700',
    color: CuloriApp.succes,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: CuloriApp.fundalCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CuloriApp.separator,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    backgroundColor: CuloriApp.fundalInput,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14.5,
    color: CuloriApp.textPrimar,
  },
  butonTrimite: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: CuloriApp.primar,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: CuloriApp.primar, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
});
