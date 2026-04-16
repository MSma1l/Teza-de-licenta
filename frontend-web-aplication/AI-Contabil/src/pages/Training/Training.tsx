/**
 * Pagina Training - Antrenare modele AI
 * Accesibilă doar pentru admin și contabil.
 *
 * Tab-uri:
 * 1. Dashboard - statistici, modele active, progres
 * 2. Revizie Documente - vizualizare OCR + corecții
 * 3. Ghid Antrenare - tutorial vizual pas cu pas
 * 4. Contabili (DOAR admin) - creare cont contabil + gestionare roluri
 */
import { useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import TrainingDashboard from './components/TrainingDashboard';
import DocumentReview from './components/DocumentReview';
import TrainingGuide from './components/TrainingGuide';
import ContabilManagement from './components/ContabilManagement';
import { useAuth } from '../../context/AuthContext';

type TabId = 'dashboard' | 'review' | 'guide' | 'contabili';

const TABS_BAZA: { id: TabId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'review', label: 'Revizie Documente', icon: '🔍' },
  { id: 'guide', label: 'Ghid Antrenare', icon: '📖' },
];

const TAB_CONTABILI: { id: TabId; label: string; icon: string } = {
  id: 'contabili',
  label: 'Contabili',
  icon: '👤',
};

export default function Training() {
  const { user } = useAuth();
  const esteAdmin = (user?.role || '').toLowerCase() === 'admin' || (user?.role || '').toLowerCase() === 'super_admin';
  const TABS = esteAdmin ? [...TABS_BAZA, TAB_CONTABILI] : TABS_BAZA;

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-[1400px] mx-auto w-full px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-neutral-black">
            Antrenare Model AI
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Vizualizează, corectează și antrenează modelul de recunoaștere documente
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 border-b border-neutral-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-neutral-500 border-transparent hover:text-neutral-black hover:border-neutral-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && <TrainingDashboard />}
        {activeTab === 'review' && <DocumentReview />}
        {activeTab === 'guide' && <TrainingGuide />}
        {activeTab === 'contabili' && esteAdmin && <ContabilManagement />}
      </div>

      <Footer />
    </div>
  );
}
