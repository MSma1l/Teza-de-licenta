/**
 * Tab Meniu - Documente, recomandari AI, termene fiscale
 *
 * Continut:
 * - Header cu cautare
 * - Statistici rapide (total documente, urgente, etc)
 * - Sectiune "Recomandari AI" (mock pana cand AI agent va fi gata)
 * - Sectiune "Termene fiscale" (mock pana cand admin seteaza)
 * - Lista documente (sortabila)
 *
 * NOTE: Recomandarile si termenele sunt momentan mock.
 * Acest tab va consuma viitorul AI agent (vezi memory: ai_agent_features.md)
 */
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { CuloriApp } from '@/constants/culori';
import { cerereApi } from '@/lib/api/client-api';
import { OpenOnWeb } from '@/components/open-on-web';

interface DocumentApi {
  id: string;
  title: string;
  document_type: string;
  status: string;
  file_size: number | null;
  urgency_score: number | null;
  created_at: string;
}

interface RaspunsListaDocumente {
  documents: DocumentApi[];
  total: number;
}

const ETICHETE_TIP: Record<string, string> = {
  factura: 'Factura',
  chitanta: 'Chitanta',
  contract: 'Contract',
  declaratie_fiscala: 'Declaratie fiscala',
  stat_plata: 'Stat de plata',
  extras_bancar: 'Extras bancar',
  altele: 'Altele',
};

const CULORI_STATUS: Record<string, { fundal: string; text: string }> = {
  aprobat: { fundal: '#d1fae5', text: '#059669' },
  verificat: { fundal: '#dbeafe', text: '#2563eb' },
  pending_approval: { fundal: '#fef3c7', text: '#d97706' },
  in_procesare: { fundal: '#f3e8ff', text: '#7c3aed' },
  incarcat: { fundal: '#f1f5f9', text: '#475569' },
  respins: { fundal: '#fee2e2', text: '#dc2626' },
};

// Recomandari AI mock - vor veni de la AI agent in viitor
const RECOMANDARI_MOCK = [
  {
    id: 'r1',
    iconita: 'document-text-outline' as const,
    titlu: 'Factura furnizor lipsa',
    descriere: 'Pentru raportare TVA luna aceasta lipsesc 2 facturi de achizitie',
    prioritate: 'inalta' as const,
  },
  {
    id: 'r2',
    iconita: 'cash-outline' as const,
    titlu: 'Extras bancar',
    descriere: 'Incarca extrasul bancar pentru reconciliere',
    prioritate: 'medie' as const,
  },
];

// Termene fiscale mock - vor fi setate de admin
const TERMENE_MOCK = [
  {
    id: 't1',
    titlu: 'Declaratie TVA',
    data: '25 aprilie 2026',
    zileRamase: 16,
    iconita: 'calendar' as const,
  },
  {
    id: 't2',
    titlu: 'Contributii sociale',
    data: '25 aprilie 2026',
    zileRamase: 16,
    iconita: 'people' as const,
  },
];

export default function EcranMeniu() {
  const insets = useSafeAreaInsets();
  const [documente, setDocumente] = useState<DocumentApi[]>([]);
  const [seIncarca, setSeIncarca] = useState(true);
  const [reincarcare, setReincarcare] = useState(false);
  const [cautare, setCautare] = useState('');

  const incarca = useCallback(async () => {
    try {
      const date = await cerereApi<RaspunsListaDocumente>('/documents/');
      setDocumente(date.documents || []);
    } catch {
      setDocumente([]);
    } finally {
      setSeIncarca(false);
      setReincarcare(false);
    }
  }, []);

  useEffect(() => {
    incarca();
  }, [incarca]);

  const documenteFiltrate = documente.filter((d) =>
    d.title.toLowerCase().includes(cautare.toLowerCase())
  );

  const totalDocumente = documente.length;
  const totalUrgente = documente.filter((d) => (d.urgency_score ?? 0) > 50).length;
  const totalAprobate = documente.filter((d) => d.status === 'aprobat').length;

  return (
    <View style={[stiluri.container, { paddingTop: insets.top }]}>
      <View style={stiluri.antet}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={stiluri.antetTitlu}>Documentele mele</Text>
            <Text style={stiluri.antetSubtitlu}>{totalDocumente} documente in total</Text>
          </View>
          <OpenOnWeb cale="/documents" varianta="icon" />
        </View>
      </View>

      <ScrollView
        style={stiluri.scroll}
        contentContainerStyle={stiluri.continutScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={reincarcare}
            onRefresh={() => {
              setReincarcare(true);
              incarca();
            }}
            tintColor={CuloriApp.primar}
            colors={[CuloriApp.primar]}
          />
        }
      >
        {/* Statistici */}
        <View style={stiluri.statistici}>
          <View style={[stiluri.cardStatistica, { backgroundColor: '#eef2ff' }]}>
            <Ionicons name="folder-open" size={22} color={CuloriApp.primar} />
            <Text style={stiluri.statisticaNumar}>{totalDocumente}</Text>
            <Text style={stiluri.statisticaText}>Total</Text>
          </View>
          <View style={[stiluri.cardStatistica, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="alert-circle" size={22} color={CuloriApp.avertizare} />
            <Text style={stiluri.statisticaNumar}>{totalUrgente}</Text>
            <Text style={stiluri.statisticaText}>Urgente</Text>
          </View>
          <View style={[stiluri.cardStatistica, { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="checkmark-circle" size={22} color={CuloriApp.succes} />
            <Text style={stiluri.statisticaNumar}>{totalAprobate}</Text>
            <Text style={stiluri.statisticaText}>Aprobate</Text>
          </View>
        </View>

        {/* Recomandari AI */}
        <View style={stiluri.sectiune}>
          <View style={stiluri.antetSectiune}>
            <View style={stiluri.titluCuIcon}>
              <Ionicons name="sparkles" size={18} color={CuloriApp.primar} />
              <Text style={stiluri.titluSectiune}>Recomandari AI</Text>
            </View>
          </View>
          {RECOMANDARI_MOCK.map((rec) => (
            <View key={rec.id} style={stiluri.cardRecomandare}>
              <View
                style={[
                  stiluri.cardRecomandareIcon,
                  rec.prioritate === 'inalta' && { backgroundColor: CuloriApp.eroareFundal },
                ]}
              >
                <Ionicons
                  name={rec.iconita}
                  size={20}
                  color={rec.prioritate === 'inalta' ? CuloriApp.eroare : CuloriApp.primar}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={stiluri.cardRecomandareTitlu}>{rec.titlu}</Text>
                <Text style={stiluri.cardRecomandareDescriere}>{rec.descriere}</Text>
              </View>
              {rec.prioritate === 'inalta' && (
                <View style={stiluri.etichetaPrioritate}>
                  <Text style={stiluri.etichetaPrioritateText}>Urgent</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Termene fiscale */}
        <View style={stiluri.sectiune}>
          <View style={stiluri.antetSectiune}>
            <View style={stiluri.titluCuIcon}>
              <Ionicons name="calendar" size={18} color={CuloriApp.secundar} />
              <Text style={stiluri.titluSectiune}>Termene fiscale</Text>
            </View>
          </View>
          {TERMENE_MOCK.map((t) => (
            <View key={t.id} style={stiluri.cardTermen}>
              <View style={stiluri.cardTermenStanga}>
                <View style={stiluri.cardTermenIcon}>
                  <Ionicons name={t.iconita} size={20} color={CuloriApp.secundar} />
                </View>
                <View>
                  <Text style={stiluri.cardTermenTitlu}>{t.titlu}</Text>
                  <Text style={stiluri.cardTermenData}>{t.data}</Text>
                </View>
              </View>
              <View
                style={[
                  stiluri.cardTermenZile,
                  t.zileRamase < 7 && { backgroundColor: CuloriApp.eroareFundal },
                ]}
              >
                <Text
                  style={[
                    stiluri.cardTermenZileText,
                    t.zileRamase < 7 && { color: CuloriApp.eroare },
                  ]}
                >
                  {t.zileRamase} zile
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Cautare documente */}
        <View style={stiluri.sectiune}>
          <View style={stiluri.antetSectiune}>
            <View style={stiluri.titluCuIcon}>
              <Ionicons name="documents" size={18} color={CuloriApp.textPrimar} />
              <Text style={stiluri.titluSectiune}>Documente</Text>
            </View>
            <OpenOnWeb cale="/documents" varianta="pill" text="Vezi pe web" />
          </View>

          <View style={stiluri.cautareWrap}>
            <Ionicons
              name="search"
              size={18}
              color={CuloriApp.textEstompat}
              style={stiluri.cautareIcon}
            />
            <TextInput
              style={stiluri.cautareInput}
              value={cautare}
              onChangeText={setCautare}
              placeholder="Cauta document..."
              placeholderTextColor={CuloriApp.textEstompat}
            />
          </View>

          {seIncarca ? (
            <View style={stiluri.stareIncarcare}>
              <ActivityIndicator color={CuloriApp.primar} />
            </View>
          ) : documenteFiltrate.length === 0 ? (
            <View style={stiluri.stareGoala}>
              <Ionicons name="document-outline" size={42} color={CuloriApp.textEstompat} />
              <Text style={stiluri.stareGoalaText}>
                {cautare ? 'Niciun document gasit' : 'Niciun document incarcat inca'}
              </Text>
            </View>
          ) : (
            documenteFiltrate.map((doc) => {
              const culoriStatus = CULORI_STATUS[doc.status] || { fundal: '#f1f5f9', text: '#475569' };
              const tipEticheta = ETICHETE_TIP[doc.document_type] || doc.document_type;
              const data = new Date(doc.created_at).toLocaleDateString('ro-RO', {
                day: '2-digit',
                month: 'short',
              });

              return (
                <TouchableOpacity key={doc.id} style={stiluri.cardDocument} activeOpacity={0.85}>
                  <View style={stiluri.cardDocumentIconWrap}>
                    <Ionicons name="document-text" size={22} color={CuloriApp.primar} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={stiluri.cardDocumentTitlu} numberOfLines={1}>
                      {doc.title}
                    </Text>
                    <View style={stiluri.cardDocumentMeta}>
                      <Text style={stiluri.cardDocumentTip}>{tipEticheta}</Text>
                      <Text style={stiluri.cardDocumentSeparator}>•</Text>
                      <Text style={stiluri.cardDocumentData}>{data}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      stiluri.cardDocumentStatus,
                      { backgroundColor: culoriStatus.fundal },
                    ]}
                  >
                    <Text style={[stiluri.cardDocumentStatusText, { color: culoriStatus.text }]}>
                      {doc.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const stiluri = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CuloriApp.fundalSecundar,
  },
  antet: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  antetTitlu: {
    fontSize: 24,
    fontWeight: '800',
    color: CuloriApp.textPrimar,
  },
  antetSubtitlu: {
    fontSize: 13,
    color: CuloriApp.textSecundar,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  continutScroll: {
    paddingBottom: 120,
  },

  // Statistici
  statistici: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  cardStatistica: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statisticaNumar: {
    fontSize: 24,
    fontWeight: '800',
    color: CuloriApp.textPrimar,
  },
  statisticaText: {
    fontSize: 11,
    color: CuloriApp.textSecundar,
    fontWeight: '600',
  },

  // Sectiune
  sectiune: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  antetSectiune: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titluCuIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titluSectiune: {
    fontSize: 17,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
  },

  // Card recomandare
  cardRecomandare: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CuloriApp.fundalCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
    gap: 12,
  },
  cardRecomandareIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRecomandareTitlu: {
    fontSize: 14,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
    marginBottom: 2,
  },
  cardRecomandareDescriere: {
    fontSize: 12,
    color: CuloriApp.textSecundar,
    lineHeight: 16,
  },
  etichetaPrioritate: {
    backgroundColor: CuloriApp.eroare,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  etichetaPrioritateText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // Card termen
  cardTermen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CuloriApp.fundalCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
  },
  cardTermenStanga: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTermenIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTermenTitlu: {
    fontSize: 14,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
  },
  cardTermenData: {
    fontSize: 12,
    color: CuloriApp.textSecundar,
    marginTop: 2,
  },
  cardTermenZile: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cardTermenZileText: {
    fontSize: 12,
    fontWeight: '700',
    color: CuloriApp.secundar,
  },

  // Cautare
  cautareWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CuloriApp.fundalCard,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
    marginBottom: 12,
  },
  cautareIcon: {
    marginRight: 10,
  },
  cautareInput: {
    flex: 1,
    fontSize: 14,
    color: CuloriApp.textPrimar,
  },

  // Stari
  stareIncarcare: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  stareGoala: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 10,
  },
  stareGoalaText: {
    fontSize: 13,
    color: CuloriApp.textEstompat,
  },

  // Card document
  cardDocument: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CuloriApp.fundalCard,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  cardDocumentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDocumentTitlu: {
    fontSize: 14,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
  },
  cardDocumentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  cardDocumentTip: {
    fontSize: 11,
    color: CuloriApp.textSecundar,
    fontWeight: '600',
  },
  cardDocumentSeparator: {
    fontSize: 11,
    color: CuloriApp.textEstompat,
  },
  cardDocumentData: {
    fontSize: 11,
    color: CuloriApp.textEstompat,
  },
  cardDocumentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardDocumentStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
});
