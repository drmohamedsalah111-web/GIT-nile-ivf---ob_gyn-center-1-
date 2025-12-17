import {
  addDays,
  differenceInCalendarDays,
  isValid,
  parseISO,
  startOfDay
} from 'date-fns';

export type Trimester = 1 | 2 | 3;

export type MilestoneStatus = 'completed' | 'active' | 'upcoming';

export interface PregnancyMilestone {
  id: string;
  titleAr: string;
  noteAr?: string;
  isCritical?: boolean;
  startDate: Date;
  endDate?: Date;
  status: MilestoneStatus;
}

export interface PregnancySnapshot {
  lmp: Date;
  edd: Date;
  gaDays: number;
  gaWeeks: number;
  gaDaysRemainder: number;
  trimester: Trimester;
  daysRemaining: number;
  progressPct: number;
  milestones: PregnancyMilestone[];
}

const GESTATION_DAYS = 280;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const parseDateInput = (value?: string | null): Date | null => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;
  const date = parseISO(trimmed);
  if (!isValid(date)) return null;
  return startOfDay(date);
};

export const calculateEDDFromLmp = (lmp: Date) => addDays(startOfDay(lmp), GESTATION_DAYS);

export const calculateLmpFromEdd = (edd: Date) => addDays(startOfDay(edd), -GESTATION_DAYS);

export const getTrimesterByGaDays = (gaDays: number): Trimester => {
  const gaWeeks = Math.floor(gaDays / 7);
  if (gaWeeks < 14) return 1;
  if (gaWeeks < 28) return 2;
  return 3;
};

const makeMilestone = (params: {
  id: string;
  titleAr: string;
  lmp: Date;
  startWeek: number;
  endWeek?: number;
  noteAr?: string;
  isCritical?: boolean;
  now: Date;
}): PregnancyMilestone => {
  const startDate = addDays(startOfDay(params.lmp), params.startWeek * 7);
  const endDate = addDays(startOfDay(params.lmp), (params.endWeek ?? params.startWeek) * 7);
  const now = startOfDay(params.now);

  const status: MilestoneStatus =
    now > endDate ? 'completed' : now >= startDate ? 'active' : 'upcoming';

  return {
    id: params.id,
    titleAr: params.titleAr,
    noteAr: params.noteAr,
    isCritical: params.isCritical,
    startDate,
    endDate: params.endWeek ? endDate : undefined,
    status
  };
};

export const buildPregnancyMilestones = (lmp: Date, now = new Date()): PregnancyMilestone[] => {
  const milestones: PregnancyMilestone[] = [
    makeMilestone({
      id: 'viability',
      titleAr: 'سونار الحيوية (6-8 أسابيع)',
      lmp,
      startWeek: 6,
      endWeek: 8,
      now
    }),
    makeMilestone({
      id: 'nt',
      titleAr: 'سونار الشفافية القفوية NT (11-13 أسبوع)',
      lmp,
      startWeek: 11,
      endWeek: 13,
      now
    }),
    makeMilestone({
      id: 'cerclage',
      titleAr: 'ربط عنق الرحم (12-14 أسبوع)',
      noteAr: 'عند اللزوم (If indicated)',
      lmp,
      startWeek: 12,
      endWeek: 14,
      now
    }),
    makeMilestone({
      id: 'anomaly',
      titleAr: 'سونار التشوهات (4D) (18-22 أسبوع)',
      noteAr: 'هام جدًا',
      isCritical: true,
      lmp,
      startWeek: 18,
      endWeek: 22,
      now
    }),
    makeMilestone({
      id: 'gct',
      titleAr: 'اختبار سكر الحمل (24-28 أسبوع)',
      lmp,
      startWeek: 24,
      endWeek: 28,
      now
    }),
    makeMilestone({
      id: 'anti_d',
      titleAr: 'حقنة Anti‑D (28 أسبوع)',
      noteAr: 'إذا كانت الأم Rh سالب',
      lmp,
      startWeek: 28,
      now
    }),
    makeMilestone({
      id: 'term',
      titleAr: 'تمام الحمل (37 أسبوع)',
      lmp,
      startWeek: 37,
      now
    })
  ];

  return milestones.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
};

export const calculatePregnancySnapshotFromLmp = (lmp: Date, now = new Date()): PregnancySnapshot => {
  const lmpDay = startOfDay(lmp);
  const today = startOfDay(now);
  const gaDaysRaw = differenceInCalendarDays(today, lmpDay);
  const gaDays = clamp(gaDaysRaw, 0, GESTATION_DAYS);
  const gaWeeks = Math.floor(gaDays / 7);
  const gaDaysRemainder = gaDays % 7;
  const edd = calculateEDDFromLmp(lmpDay);
  const daysRemaining = clamp(GESTATION_DAYS - gaDays, 0, GESTATION_DAYS);
  const progressPct = clamp((gaDays / GESTATION_DAYS) * 100, 0, 100);
  const trimester = getTrimesterByGaDays(gaDays);
  const milestones = buildPregnancyMilestones(lmpDay, today);

  return {
    lmp: lmpDay,
    edd,
    gaDays,
    gaWeeks,
    gaDaysRemainder,
    trimester,
    daysRemaining,
    progressPct,
    milestones
  };
};

export const calculatePregnancySnapshotFromEdd = (edd: Date, now = new Date()): PregnancySnapshot => {
  const lmp = calculateLmpFromEdd(edd);
  return calculatePregnancySnapshotFromLmp(lmp, now);
};

