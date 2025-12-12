import { dbService } from './dbService';
import { Patient, IvfCycle, Visit, StimulationLog } from '../types';

export const calculateBMI = (weightKg: number, heightCm: number): { bmi: number; alert: boolean } => {
  if (!weightKg || !heightCm) return { bmi: 0, alert: false };
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  return { bmi, alert: bmi > 30 };
};

export const calculateTMSC = (volume: number, concentration: number, motility: number): number => {
  if (!volume || !concentration || !motility) return 0;
  return parseFloat(((volume * concentration * motility) / 100).toFixed(2));
};

export const analyzeSemenAnalysis = (vol: number, conc: number, motility: number, morph: number): string => {
  const findings: string[] = [];
  if (vol < 1.5) findings.push("Hypospermia");
  if (conc < 15) findings.push("Oligozoospermia");
  if (motility < 40) findings.push("Asthenozoospermia");
  if (morph < 4) findings.push("Teratozoospermia");
  
  if (findings.length === 0) return "Normozoospermia (WHO 2021)";
  return findings.join(" + ");
};

export const classifyOvarianReserve = (amh?: number, afc?: number): 'Poor Responder' | 'Normal' | 'High Responder' => {
  if (!amh && !afc) return 'Normal';
  
  if ((amh && amh < 0.4) || (afc && afc < 5)) {
    return 'Poor Responder';
  }
  if ((amh && amh > 4.5) || (afc && afc > 25)) {
    return 'High Responder';
  }
  return 'Normal';
};

export const calculateMaturationRate = (totalOocytes: number, mii: number): number => {
  if (!totalOocytes || totalOocytes === 0) return 0;
  return parseFloat(((mii / totalOocytes) * 100).toFixed(1));
};

export const calculateFertilizationRate = (fertilized: number, mii: number): number => {
  if (!mii || mii === 0) return 0;
  return parseFloat(((fertilized / mii) * 100).toFixed(1));
};

export const db = dbService;
