import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@medidor/prefs/v1';

export type PrefsMotorista = {
  custoPorKm: string;
  minKmMeta: string;
  minHoraMeta: string;
};

const defaultPrefs: PrefsMotorista = {
  custoPorKm: '',
  minKmMeta: '',
  minHoraMeta: '',
};

export async function loadPrefsMotorista(): Promise<PrefsMotorista> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...defaultPrefs };
    const j = JSON.parse(raw) as Partial<PrefsMotorista>;
    return {
      custoPorKm: typeof j.custoPorKm === 'string' ? j.custoPorKm : '',
      minKmMeta: typeof j.minKmMeta === 'string' ? j.minKmMeta : '',
      minHoraMeta: typeof j.minHoraMeta === 'string' ? j.minHoraMeta : '',
    };
  } catch {
    return { ...defaultPrefs };
  }
}

export async function savePrefsMotorista(p: PrefsMotorista): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
