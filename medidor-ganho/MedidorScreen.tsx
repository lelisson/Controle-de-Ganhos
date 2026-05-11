import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
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
  vereditoCorrida,
  type CorridaInput,
} from './logic/calculoCorrida';
import { clearStoredToken } from './lib/subscriptionWeb';

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
  const [showOpcional, setShowOpcional] = useState(false);
  const [showMetas, setShowMetas] = useState(false);

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
    return out;
  }, [valor, kmCorrida, minCorrida, kmVazio, minVazio]);

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
    if (!resultado) return null;
    return vereditoCorrida(resultado, minKm, minHora);
  }, [resultado, minKm, minHora]);

  const banner = useMemo(() => {
    if (!resultado || (!minKm && !minHora)) return null;
    switch (veredito) {
      case 'ok':
        return { text: 'Dentro da sua meta (km e hora).', color: '#166534', bg: '#bbf7d0' };
      case 'atencao':
        return {
          text: 'Parcial: uma métrica ficou abaixo da meta. Avalie o contexto.',
          color: '#92400e',
          bg: '#fde68a',
        };
      case 'ruim':
        return { text: 'Abaixo da meta em km/hora efetivos.', color: '#991b1b', bg: '#fecaca' };
      default:
        return null;
    }
  }, [resultado, veredito, minKm, minHora]);

  const temDeslocamento =
    (parseDecimal(kmVazio) > 0 && Number.isFinite(parseDecimal(kmVazio))) ||
    (parseDecimal(minVazio) > 0 && Number.isFinite(parseDecimal(minVazio)));

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
          <Text style={styles.calloutTitle}>Como usar (estilo oferta Uber / 99)</Text>
          <Text style={styles.calloutBody}>
            Olhe a chamada no app, digite aqui o valor, km e minutos que aparecem na tela. O cálculo atualiza na
            hora. Um site no celular não pode ler a tela do Uber automaticamente; apps como o Gigu costumam ser
            nativos no Android por isso.
          </Text>
        </View>

        {resultado ? (
          <View style={styles.heroRow}>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>R$ por km</Text>
              <Text style={styles.heroValue}>{formatarBRL(resultado.reaisPorKmCorrida)}</Text>
              <Text style={styles.heroFormula}>valor da corrida ÷ km</Text>
            </View>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>R$ por hora</Text>
              <Text style={styles.heroValue}>{formatarBRL(resultado.reaisPorHoraCorrida)}</Text>
              <Text style={styles.heroFormula}>valor ÷ (minutos ÷ 60)</Text>
            </View>
          </View>
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
          <Text style={styles.toggleText}>{showMetas ? '▼ Ocultar' : '▶'} Metas mínimas (opcional)</Text>
        </Pressable>

        {showMetas ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Suas metas</Text>
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
          <Text style={styles.placeholder}>Preencha valor, km e minutos para ver R$/km e R$/hora.</Text>
        ) : null}

        {banner ? (
          <View style={[styles.banner, { backgroundColor: banner.bg }]}>
            <Text style={[styles.bannerText, { color: banner.color }]}>{banner.text}</Text>
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
  heroRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  heroCard: {
    flex: 1,
    backgroundColor: '#0c4a6e',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#0369a1',
  },
  heroLabel: {
    color: '#bae6fd',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  heroValue: {
    color: '#f0f9ff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroFormula: {
    color: '#7dd3fc',
    fontSize: 11,
    opacity: 0.95,
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
  banner: {
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
