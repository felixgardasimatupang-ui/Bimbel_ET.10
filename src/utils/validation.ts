export const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const sanitizeCSV = (val: string) => {
  if (/^[=+\-@]/.test(val)) return `'${val}`;
  if (val.includes('"') || val.includes(',') || val.includes('\n')) return `"${val.replace(/"/g, '""')}"`;
  return val;
};

export const filterSiswas = (
  siswas: { name: string; id: string; parentName: string; classLevel: string }[],
  search: string,
  classFilter: string,
) => siswas.filter((s) => {
  const q = search.toLowerCase();
  const matchesSearch = s.name.toLowerCase().includes(q) ||
    s.id.toLowerCase().includes(q) ||
    s.parentName.toLowerCase().includes(q);
  const matchesClass = classFilter === 'Semua' || s.classLevel.includes(classFilter);
  return matchesSearch && matchesClass;
});

export const filterMateris = (
  materis: { title: string; author: string; subject: string; isLocked: boolean }[],
  search: string,
  subjectFilter: string,
  userRole: string,
) => materis.filter((m) => {
  const q = search.toLowerCase();
  const matchesSearch = m.title.toLowerCase().includes(q) ||
    m.author.toLowerCase().includes(q);
  const matchesSub = subjectFilter === 'Semua' || m.subject.toLowerCase() === subjectFilter.toLowerCase();
  if (userRole === 'SISWA' && m.isLocked) return false;
  return matchesSearch && matchesSub;
});

export const hasDuplicateSPPThisMonth = (
  transactions: { payeeName: string; type: string; date: string }[],
  siswaId: string,
) => transactions.some((tx) =>
  tx.payeeName.includes(siswaId) && tx.type === 'SPP_MASUK' &&
  tx.date.startsWith(new Date().toISOString().split('T')[0].slice(0, 7))
);

export const calculateQuizScore = (
  answers: Record<string, number>,
  questions: { id: string; correctIndex: number }[],
) => {
  if (questions.length === 0) return 0;
  let correct = 0;
  questions.forEach((q) => {
    if (answers[q.id] === q.correctIndex) correct++;
  });
  return Math.round((correct / questions.length) * 100);
};

export const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function getEnvNumber(key: string, fallback: number): number {
  const val = import.meta.env[key];
  return val ? parseFloat(val) : fallback;
}

export const GPS_DEFAULT = {
  lat: getEnvNumber('VITE_GPS_LAT', -6.2088),
  lon: getEnvNumber('VITE_GPS_LON', 106.8456),
} as const;
