import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  calcularCorrida,
  formatarBRL,
  formatarDuracaoCurta,
  vereditoCorrida,
  type CorridaInput,
} from './logic/calculoCorrida';
import { clearStoredToken } from './lib/subscriptionWeb';
import { limparHistorico, listarHistorico, registrarHistorico, type HistoricoCorridaItem } from './lib/historicoCorrida';
import { loadPrefsMotorista, savePrefsMotorista } from './lib/prefsMotorista';
import OfferCard from './OfferCard';

function parseDecimal(raw: string): number {
  const t = raw.trim().replace(/\s/g, '');
  if (!t) return NaN;
  const normalized = t.replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

function LabeledInput(props: {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      {props.hint ? <Text style={styles.hint}>{props.hint}</Text> : null}
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholderTextColor="#6b7280"
        placeholder="0"
        keyboardType={props.keyboardType ?? 'decimal-pad'}
        style={styles.input}
      />
    </View>
  );
}

type Props = {
  onLogout?: () => void;
};

export default function MedidorScreen({ onLogout }: Props) {
  const [valor, setValor] = useState('');
  const [kmCorrida, setKmCorrida] = useState('');
  const [minCorrida, setMinCorrida] = useState('');
  const [kmVazio, setKmVazio] = useState('');
  const [minVazio, setMinVazio] = useState('');
  const [minKmMeta, setMinKmMeta] = useState('');
  const [minHoraMeta, setMinHoraMeta] = useState('');
  const [custoPorKm, setCustoPorKm] = useState('');
  const [showOpcional, setShowOpcional] = useState(false);
  const [showMetas, setShowMetas] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [historico, setHistorico] = useState<HistoricoCorridaItem[]>([]);

  useEffect(() => {
    let alive = true;
    void loadPrefsMotorista().then((p) => {
      if (!alive) return;
      setCustoPorKm(p.custoPorKm);
      setMinKmMeta(p.minKmMeta);
      setMinHoraMeta(p.minHoraMeta);
      setPrefsLoaded(true);
    });
    void listarHistorico().then((h) => {
      if (alive) setHistorico(h);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    const t = setTimeout(() => {
      void savePrefsMotorista({ custoPorKm, minKmMeta, minHoraMeta });
    }, 500);
    return () => clearTimeout(t);
  }, [custoPorKm, minKmMeta, minHoraMeta, prefsLoaded]);

  const input: CorridaInput | null = useMemo(() => {
    const v = parseDecimal(valor);
    const km = parseDecimal(kmCorrida);
    const mc = parseDecimal(minCorrida);
    if (!Number.isFinite(v) || !Number.isFinite(km) || !Number.isFinite(mc)) return null;
    if (v < 0 || km < 0 || mc < 0) return null;

    const kmE = parseDecimal(kmVazio);
    const minE = parseDecimal(minVazio);
    const out: CorridaInput = {
      valorReais: v,
      kmCorrida: km,
      minutosCorrida: mc,
    };
    if (Number.isFinite(kmE) && kmE > 0) out.kmAteEmbarque = kmE;
    if (Number.isFinite(minE) && minE > 0) out.minutosAteEmbarque = minE;

    const ck = parseDecimal(custoPorKm);
    if (Number.isFinite(ck) && ck >= 0) out.custoPorKmOperacional = ck;

    return out;
  }, [valor, kmCorrida, minCorrida, kmVazio, minVazio, custoPorKm]);

  const resultado = useMemo(() => {
    if (!input) return null;
    return calcularCorrida(input);
  }, [input]);

  const minKm = useMemo(() => {
    const n = parseDecimal(minKmMeta);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [minKmMeta]);

  const minHora = useMemo(() => {
    const n = parseDecimal(minHoraMeta);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [minHoraMeta]);

  const veredito = useMemo(() => {
    if (!resultado) return 'indefinido' as const;
    return vereditoCorrida(resultado, minKm, minHora);
  }, [resultado, minKm, minHora]);

  const temDeslocamento =
    (parseDecimal(kmVazio) > 0 && Number.isFinite(parseDecimal(kmVazio))) ||
    (parseDecimal(minVazio) > 0 && Number.isFinite(parseDecimal(minVazio)));

  const salvarHistorico = useCallback(async () => {
    if (!input || !resultado) return;
    await registrarHistorico({
      resumoLinha: `${formatarDuracaoCurta(input.minutosCorrida)} · ${input.kmCorrida.toFixed(1)} km`,
      valorFmt: formatarBRL(input.valorReais),
      reaisPorKm: formatarBRL(resultado.reaisPorKmCorrida),
      reaisPorHora: formatarBRL(resultado.reaisPorHoraCorrida),
      lucroFmt: formatarBRL(resultado.lucroLiquido),
      semaforo: veredito,
    });
    setHistorico(await listarHistorico());
  }, [input, resultado, veredito]);

  const limparHist = useCallback(async () => {
    await limparHistorico();
    setHistorico([]);
  }, []);

  function handleLogout() {
    clearStoredToken();
    onLogout?.();
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Medidor de ganho</Text>
          {onLogout ? (
            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Sair</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>Uso rápido (oferta Uber / 99)</Text>
          <Text style={styles.calloutBody}>
            Digite o que aparece na chamada. Este app é independente; a ideia de cartão com R$/km, R$/h, lucro e
            semáforo por meta é comum em ferramentas para motoristas (conceito parecido com o divulgado no site GigU).
            Não lemos a tela de outros apps — isso exige app Android nativo e permissões especiais.
          </Text>
        </View>

        {resultado && input ? (
          <OfferCard
            resultado={resultado}
            veredito={veredito}
            minutosViagem={input.minutosCorrida}
            kmViagem={input.kmCorrida}
          />
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados da oferta</Text>
          <LabeledInput label="Valor (R$)" value={valor} onChangeText={setValor} />
          <LabeledInput
            label="Km da viagem"
            hint="Quilometragem mostrada na chamada."
            value={kmCorrida}
            onChangeText={setKmCorrida}
          />
          <LabeledInput
            label="Minutos estimados"
            hint="Tempo da viagem na chamada."
            value={minCorrida}
            onChangeText={setMinCorrida}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Custo (salvo no aparelho)</Text>
          <LabeledInput
            label="Seu custo médio (R$/km)"
            hint="Combustível, desgaste, etc. Usamos km total (viagem + ida, se informar ida) para estimar lucro."
            value={custoPorKm}
            onChangeText={setCustoPorKm}
          />
        </View>

        <Pressable
          onPress={() => setShowOpcional((s) => !s)}
          style={styles.toggleBtn}
          accessibilityRole="button"
        >
          <Text style={styles.toggleText}>
            {showOpcional ? '▼ Ocultar' : '▶ Incluir'} ida até embarcar (opcional)
          </Text>
        </Pressable>

        {showOpcional ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Até pegar o passageiro</Text>
            <LabeledInput label="Km até embarcar" value={kmVazio} onChangeText={setKmVazio} />
            <LabeledInput label="Minutos até embarcar" value={minVazio} onChangeText={setMinVazio} />
          </View>
        ) : null}

        <Pressable onPress={() => setShowMetas((s) => !s)} style={styles.toggleBtn} accessibilityRole="button">
          <Text style={styles.toggleText}>{showMetas ? '▼ Ocultar' : '▶'} Metas mínimas (semáforo)</Text>
        </Pressable>

        {showMetas ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Suas metas (R$/km e R$/h efetivos)</Text>
            <LabeledInput
              label="Mínimo R$/km efetivo"
              hint="Compara com valor ÷ km total (viagem + ida)."
              value={minKmMeta}
              onChangeText={setMinKmMeta}
            />
            <LabeledInput
              label="Mínimo R$/hora efetiva"
              hint="Compara com valor ÷ horas totais."
              value={minHoraMeta}
              onChangeText={setMinHoraMeta}
            />
          </View>
        ) : null}

        {resultado && input ? (
          <Pressable style={styles.saveBtn} onPress={salvarHistorico} accessibilityRole="button">
            <Text style={styles.saveBtnText}>Registrar esta oferta no histórico</Text>
          </Pressable>
        ) : null}

        {resultado && temDeslocamento ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Com deslocamento (efetivo)</Text>
            <View style={styles.row}>
              <Text style={styles.metricLabel}>R$/km efetivo</Text>
              <Text style={styles.metricValue}>{formatarBRL(resultado.reaisPorKmEfetivo)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.metricLabel}>R$/hora efetiva</Text>
              <Text style={styles.metricValue}>{formatarBRL(resultado.reaisPorHoraEfetivo)}</Text>
            </View>
            <Text style={styles.footerNote}>
              Totais: {resultado.kmTotal.toFixed(1)} km · {resultado.minutosTotal.toFixed(0)} min
            </Text>
          </View>
        ) : null}

        {!resultado ? (
          <Text style={styles.placeholder}>Preencha valor, km e minutos para ver o cartão da oferta.</Text>
        ) : null}

        {historico.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.histHeader}>
              <Text style={styles.cardTitle}>Histórico (neste aparelho)</Text>
              <Pressable onPress={limparHist} accessibilityRole="button">
                <Text style={styles.linkMuted}>Limpar</Text>
              </Pressable>
            </View>
            {historico.map((h) => (
              <View key={h.id} style={styles.histRow}>
                <Text style={styles.histLinha}>{h.resumoLinha}</Text>
                <Text style={styles.histSub}>
                  {h.valorFmt} · {h.reaisPorKm}/km · {h.reaisPorHora}/h · lucro {h.lucroFmt}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#f8fafc',
    flex: 1,
  },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  logoutText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  callout: {
    backgroundColor: '#1e3a5f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  calloutTitle: {
    color: '#7dd3fc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  calloutBody: {
    color: '#bae6fd',
    fontSize: 13,
    lineHeight: 19,
  },
  toggleBtn: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  toggleText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 18,
    color: '#f1f5f9',
    backgroundColor: '#0f172a',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 15,
    color: '#94a3b8',
    flex: 1,
    paddingRight: 12,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#38bdf8',
  },
  footerNote: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
  },
  placeholder: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: '#0369a1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  saveBtnText: {
    color: '#f0f9ff',
    fontSize: 15,
    fontWeight: '700',
  },
  histHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkMuted: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  histRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  histLinha: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  histSub: {
    color: '#94a3b8',
    fontSize: 12,
  },
});
