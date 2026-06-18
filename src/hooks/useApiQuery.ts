import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudentsApi, TeachersApi, FinanceApi, MaterialsApi, NotificationsApi, SchedulesApi } from '../api/client';
import type { Siswa, Teacher, Transaksi, MateriBelajar, Notifikasi, Schedule } from '../types';

export function useStudentsQuery() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await StudentsApi.list();
      if (!res.success) throw new Error(res.error || 'Gagal memuat siswa');
      return res.data!.data as Siswa[];
    },
  });
}

export function useStudentsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Siswa>) => {
      const res = await StudentsApi.create(data);
      if (!res.success) throw new Error(res.error || 'Gagal membuat siswa');
      return res.data as Siswa;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useToggleSppMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await StudentsApi.toggleSpp(id);
      if (!res.success) throw new Error(res.error || 'Gagal toggle SPP');
      return res.data as Siswa;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useCheckinMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, method }: { id: string; method: string }) => {
      const res = await StudentsApi.checkin(id, method);
      if (!res.success) throw new Error(res.error || 'Gagal checkin');
      return res.data as Siswa;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useTeachersQuery() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const res = await TeachersApi.list();
      if (!res.success) throw new Error(res.error || 'Gagal memuat pengajar');
      return res.data!.data as Teacher[];
    },
  });
}

export function useTeacherEvaluationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pedagogical, professional, social, feedback }: { id: string; pedagogical: number; professional: number; social: number; feedback: string }) => {
      const res = await TeachersApi.evaluate(id, { pedagogical, professional, social, feedback });
      if (!res.success) throw new Error(res.error || 'Gagal evaluasi');
      return res.data as Teacher;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  });
}

export function useTransactionsQuery() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await FinanceApi.transactions();
      if (!res.success) throw new Error(res.error || 'Gagal memuat transaksi');
      return res.data!.data as Transaksi[];
    },
  });
}

export function useFinanceSummaryQuery() {
  return useQuery({
    queryKey: ['finance-summary'],
    queryFn: async () => {
      const res = await FinanceApi.summary();
      if (!res.success) throw new Error(res.error || 'Gagal memuat ringkasan');
      return res.data;
    },
  });
}

export function useMaterialsQuery() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const res = await MaterialsApi.list();
      if (!res.success) throw new Error(res.error || 'Gagal memuat materi');
      return res.data!.data as MateriBelajar[];
    },
  });
}

export function useMaterialCreateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<MateriBelajar>) => {
      const res = await MaterialsApi.create(data);
      if (!res.success) throw new Error(res.error || 'Gagal membuat materi');
      return res.data as MateriBelajar;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  });
}

export function useMaterialDownloadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await MaterialsApi.download(id);
      if (!res.success) throw new Error(res.error || 'Gagal unduh');
      return res.data as MateriBelajar;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  });
}

export function useNotificationsQuery() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await NotificationsApi.list();
      if (!res.success) throw new Error(res.error || 'Gagal memuat notifikasi');
      return res.data!.data as Notifikasi[];
    },
  });
}

export function useSchedulesQuery() {
  return useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const res = await SchedulesApi.list();
      if (!res.success) throw new Error(res.error || 'Gagal memuat jadwal');
      return res.data!.data as Schedule[];
    },
  });
}
