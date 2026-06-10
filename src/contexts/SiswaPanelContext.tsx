import { createContext, useContext } from 'react';
import type { Siswa } from '../types';

export interface FormDataSiswa {
  name: string; classLevel: string; email: string;
  parentName: string; parentEmail: string; sppAmount: number;
}

interface SiswaPanelContextValue {
  filteredSiswas: Siswa[];
  selectedSiswaId: string;
  setSelectedSiswaId: (id: string) => void;
  studentSearch: string;
  setStudentSearch: (val: string) => void;
  studentClassFilter: string;
  setStudentClassFilter: (val: string) => void;
  newSiswaOpen: boolean;
  setNewSiswaOpen: (val: boolean) => void;
  formDataSiswa: FormDataSiswa;
  setFormDataSiswa: React.Dispatch<React.SetStateAction<FormDataSiswa>>;
  onAddSiswa: (e: React.FormEvent) => void;
  qrSession: { sessionId: string; courseName: string; code: string; generatedAt: string };
  onRegenerateQr: () => void;
  gpsLoading: boolean;
  gpsLocation: { lat: number; lon: number } | null;
  onGpsQuery: () => void;
  onSimulateCheckin: (siswaId: string, method: 'QR_SCAN' | 'LOKASI') => void;
  onToggleSpp: (siswaId: string) => void;
  currentUserRole: string;
}

const Ctx = createContext<SiswaPanelContextValue | null>(null);

export function useSiswaPanel() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSiswaPanel must be used within SiswaPanelProvider');
  return ctx;
}

export const SiswaPanelProvider = Ctx.Provider;
