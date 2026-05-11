import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Veredito } from '../logic/calculoCorrida';

const KEY = '@medidor/historico/v1';
const MAX = 40;

export type HistoricoCorridaItem = {
  id: string;
  createdAt: number;
  resumoLinha: string;
  valorFmt: string;
  reaisPorKm: string;
  reaisPorHora: string;
  lucroFmt: string;
  semaforo: Veredito;
};

async function readAll(): Promise<HistoricoCorridaItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as HistoricoCorridaItem[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function writeAll(items: HistoricoCorridaItem[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
}

export async function listarHistorico(): Promise<HistoricoCorridaItem[]> {
  const all = await readAll();
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function registrarHistorico(item: Omit<HistoricoCorridaItem, 'id' | 'createdAt'>): Promise<void> {
  const all = await readAll();
  const novo: HistoricoCorridaItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  };
  await writeAll([novo, ...all]);
}

export async function limparHistorico(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
