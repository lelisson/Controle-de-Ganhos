import { StyleSheet, Text, View } from 'react-native';
import {
  formatarBRL,
  formatarDuracaoCurta,
  labelSemáforoMeta,
  type CorridaResultado,
  type Veredito,
} from './logic/calculoCorrida';

type Props = {
  resultado: CorridaResultado;
  veredito: Veredito;
  minutosViagem: number;
  kmViagem: number;
};

function corBorda(v: Veredito): string {
  switch (v) {
    case 'ok':
      return '#22c55e';
    case 'atencao':
      return '#eab308';
    case 'ruim':
      return '#ef4444';
    default:
      return '#475569';
  }
}

function fundoBadge(v: Veredito): string {
  switch (v) {
    case 'ok':
      return '#14532d';
    case 'atencao':
      return '#713f12';
    case 'ruim':
      return '#7f1d1d';
    default:
      return '#334155';
  }
}

export default function OfferCard({ resultado, veredito, minutosViagem, kmViagem }: Props) {
  const linha = `${formatarDuracaoCurta(minutosViagem)} · ${kmViagem.toFixed(1)} km`;
  const borda = corBorda(veredito);

  return (
    <View style={[styles.wrap, { borderColor: borda }]}>
      <View style={[styles.badge, { backgroundColor: fundoBadge(veredito) }]}>
        <Text style={styles.badgeText}>{labelSemáforoMeta(veredito)}</Text>
      </View>
      <Text style={styles.linha}>{linha}</Text>

      <View style={styles.grid}>
        <View style={styles.cel}>
          <Text style={styles.k}>R$/km</Text>
          <Text style={styles.v}>{formatarBRL(resultado.reaisPorKmCorrida)}</Text>
        </View>
        <View style={styles.cel}>
          <Text style={styles.k}>R$/hora</Text>
          <Text style={styles.v}>{formatarBRL(resultado.reaisPorHoraCorrida)}</Text>
        </View>
        <View style={styles.cel}>
          <Text style={styles.k}>Lucro est.</Text>
          <Text style={styles.v}>{formatarBRL(resultado.lucroLiquido)}</Text>
        </View>
      </View>
      <Text style={styles.legenda}>
        Lucro = valor da corrida − (km total × seu custo R$/km). Sem custo/km, lucro fica em traço.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#0f172a',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  badgeText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  linha: {
    color: '#94a3b8',
    fontSize: 15,
    marginBottom: 14,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cel: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  k: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  v: {
    color: '#38bdf8',
    fontSize: 17,
    fontWeight: '800',
  },
  legenda: {
    marginTop: 12,
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
});
