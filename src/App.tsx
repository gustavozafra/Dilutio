import React, { useState, useEffect } from 'react';
import { Download, FileText, FlaskConical, Beaker, Check, Hexagon, Moon, Sun } from 'lucide-react';
import Snowfall from 'react-snowfall';
import { CalcMode, PatientPrescription } from './types';
import { useCannabisCalculations } from './hooks/useCannabisCalculations';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { TraceabilityPanel } from './components/TraceabilityPanel';
import { MatrixStandardizationForm } from './components/MatrixStandardizationForm';
import { DashboardStatus } from './components/DashboardStatus';
import { ClinicalFractioning } from './components/ClinicalFractioning';

const generateBatchNumber = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `LOT.${yyyy}${mm}${dd}.${hh}${min}`;
};

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [snowing, setSnowing] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const [technician, setTechnician] = useState('');
  const [batchNumber] = useState(generateBatchNumber());
  const [date] = useState(new Date().toLocaleDateString('pt-BR'));

  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfType, setPdfType] = useState<'base' | 'full'>('full');

  const [extractType, setExtractType] = useState<string>('rosin');
  const [calcMode, setCalcMode] = useState<CalcMode>('mass');
  const [m_extrato, setMExtrato] = useState<string>('');
  const [p_coa, setPCoa] = useState<string>('');
  const [c_base, setCBase] = useState<string>('');
  const [v_final, setVFinal] = useState<string>('');

  const [patients, setPatients] = useState<PatientPrescription[]>([
    { id: crypto.randomUUID(), name: '', c_alvo: '', v_frasco: '' }
  ]);

  const {
    baseCalculations,
    patientCalculations,
    hasErrors,
    totalAliquotaRequired,
    basePasteSufficient
  } = useCannabisCalculations(
    { extractType, calcMode, m_extrato, p_coa, c_base, v_final },
    patients
  );

  const handleAddPatient = () => {
    setPatients([...patients, { id: crypto.randomUUID(), name: '', c_alvo: '', v_frasco: '' }]);
  };

  const handleRemovePatient = (id: string) => {
    setPatients(patients.filter(p => p.id !== id));
  };

  const handlePatientChange = (id: string, field: keyof PatientPrescription, value: string) => {
    setPatients(patients.map(p => {
      if (p.id === id) {
        if (field === 'c_alvo' || field === 'v_frasco') {
          const numValue = Number(value);
          if (value !== '' && (isNaN(numValue) || numValue < 0)) return p;
        }
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handlePrint = async (type: 'base' | 'full') => {
    setPdfType(type);
    setIsGenerating(true);
    try {
      // Lazy-load heavy PDF dependencies only when needed
      const [{ pdf }, { NativePdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./components/NativePdfDocument'),
      ]);

      const doc = (
        <NativePdfDocument
          pdfType={type}
          batchNumber={batchNumber}
          date={date}
          technician={technician}
          extractType={extractType}
          p_coa={p_coa}
          baseCalculations={baseCalculations}
          patientCalculations={patientCalculations}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Erro ao gerar POP:', error);
      alert('Erro na emissão do documento.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-clinical-bg dark:bg-zinc-950 text-clinical-900 dark:text-zinc-100 font-sans relative selection:bg-clinical-500 selection:text-white pb-32 transition-colors duration-500 flex flex-col">
      {/* Easter Egg */}
      {snowing && (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
          <Snowfall snowflakeCount={150} color={isDark ? '#cbd5e1' : '#a1a1aa'} />
        </div>
      )}
      {pdfUrl && (
        <PdfPreviewModal
          pdfUrl={pdfUrl}
          batchNumber={batchNumber}
          onClose={() => setPdfUrl(null)}
        />
      )}

      {/* Header Editorial */}
      <header className="pt-12 pb-8 px-6 border-b border-clinical-100 dark:border-zinc-800 transition-colors duration-500 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="flex items-center gap-5">
          {/* Chemical Element Logo */}
          <div
            onDoubleClick={() => setSnowing(!snowing)}
            title="Double click me for a surprise"
            className="w-16 h-16 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex flex-col items-center justify-center shadow-md border-t border-zinc-700 dark:border-zinc-200 relative overflow-hidden shrink-0 select-none cursor-pointer group transition-colors duration-500"
          >
            <div className="absolute top-1.5 left-1.5 text-[8px] font-mono text-blue-400 font-bold">12</div>
            <div className="absolute top-1.5 right-1.5 text-[6px] font-mono text-zinc-500 dark:text-zinc-400 transition-colors duration-500">24.305</div>
            <div className="text-2xl font-serif text-white dark:text-zinc-900 font-medium leading-none mt-1.5 tracking-tight group-hover:scale-110 transition-transform">Di</div>
            <div className="text-[6px] font-mono text-zinc-400 dark:text-zinc-500 tracking-widest uppercase mt-0.5 transition-colors duration-500">Dilutio</div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-2 transition-colors duration-500">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80"></span>
              Sistema Farmacotécnico / v.2.0
            </p>
            <h1 className="font-serif text-4xl tracking-tight text-zinc-900 dark:text-zinc-100 leading-none transition-colors duration-500">
              Dilutio<span className="text-blue-500">.</span>
            </h1>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-end sm:items-center">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-zinc-200/50 dark:focus:ring-zinc-700/50 shrink-0"
            title="Alternar Tema Escuro"
          >
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
          <button
            onClick={() => handlePrint('base')}
            disabled={!baseCalculations.isValid || !technician || isGenerating}
            className="pro-button-secondary"
          >
            <span className="text-[11px] font-bold tracking-widest uppercase">Base POP</span>
            {isGenerating && pdfType === 'base' ? (
              <div className="w-4 h-4 border-2 border-inherit border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            )}
          </button>
          <button
            onClick={() => handlePrint('full')}
            disabled={hasErrors || !baseCalculations.isValid || !technician || isGenerating}
            className="pro-button-primary"
          >
            <span className="text-[11px] font-bold tracking-widest uppercase">Dossiê POP</span>
            {isGenerating && pdfType === 'full' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-12 mt-8">

        {/* Left Column: Traceability & Matriz */}
        <div className="lg:col-span-5 flex flex-col">
          <TraceabilityPanel
            technician={technician}
            setTechnician={setTechnician}
            batchNumber={batchNumber}
            date={date}
          />
          <MatrixStandardizationForm
            extractType={extractType}
            setExtractType={setExtractType}
            calcMode={calcMode}
            setCalcMode={setCalcMode}
            p_coa={p_coa}
            setPCoa={setPCoa}
            m_extrato={m_extrato}
            setMExtrato={setMExtrato}
            v_final={v_final}
            setVFinal={setVFinal}
            c_base={c_base}
            setCBase={setCBase}
            baseCalculations={baseCalculations}
          />
        </div>

        {/* Vertical Divider for large screens */}
        <div className="hidden lg:block lg:col-span-1 relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-clinical-100 dark:via-zinc-800 to-transparent transform -translate-x-1/2 transition-colors duration-500"></div>
        </div>

        {/* Right Column: Instância B & Status */}
        <div className="lg:col-span-6 flex flex-col h-full">
          <div className="flex-grow">
            <ClinicalFractioning
              patients={patients}
              patientCalculations={patientCalculations}
              basePasteIsValid={baseCalculations.isValid}
              basePasteSufficient={basePasteSufficient}
              totalAliquotaRequired={totalAliquotaRequired}
              v_final_base={baseCalculations.v_final_base}
              handleAddPatient={handleAddPatient}
              handleRemovePatient={handleRemovePatient}
              handlePatientChange={handlePatientChange}
            />
          </div>
          <div className="mt-8">
            <DashboardStatus isValid={baseCalculations.isValid} />
          </div>
        </div>
      </div>

      {/* Footer Herbarium */}
      <footer className="max-w-6xl mx-auto px-6 mt-16 pb-8 flex-shrink-0">
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors duration-500">
          <div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium tracking-wide transition-colors duration-500">
              Desenvolvido e mantido por{' '}
              <a
                href="https://www.herbarium.ong.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-900 dark:text-zinc-100 font-bold hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-blue-600 dark:hover:decoration-blue-400 underline-offset-4"
              >
                Herbarium Genetics
              </a>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tracking-widest uppercase transition-colors duration-500">
              Operational Systems
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
