import { prisma } from '../lib/prisma.js';

export class ScheduleService {
  async list() {
    return prisma.schedule.findMany({ orderBy: { startTime: 'asc' } });
  }
}
