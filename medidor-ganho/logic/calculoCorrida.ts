/**
 * Cálculos de rentabilidade por corrida (Uber, 99, etc.).
 * Lógica pura — sem dependência de UI.
 */

export type CorridaInput = {
  /** Valor que você recebe na corrida (líquido ou bruto, como preferir comparar). */
  valorReais: number;
  /** Km com passageiro (km da viagem no app). */
  kmCorrida: number;
  /** Tempo com passageiro em minutos (estimativa do app). */
  minutosCorrida: number;
  /** Km até embarcar (opcional). */
  kmAteEmbarque?: number;
  /** Minutos até embarcar (opcional). */
  minutosAteEmbarque?: number;
  /** Custo operacional médio por km (combustível, desgaste, etc.) — desconta sobre km total (viagem + ida). */
  custoPorKmOperacional?: number;
};

export type CorridaResultado = {
  reaisPorKmCorrida: number | null;
  reaisPorHoraCorrida: number | null;
  kmTotal: number;
  minutosTotal: number;
  reaisPorKmEfetivo: number | null;
  reaisPorHoraEfetivo: number | null;
  /** Valor da corrida − (km total × custo/km), se custo informado. */
  lucroLiquido: number | null;
};

const EPS = 1e-9;

export function calcularCorrida(input: CorridaInput): CorridaResultado {
  const kmExtra = Math.max(0, input.kmAteEmbarque ?? 0);
  const minExtra = Math.max(0, input.minutosAteEmbarque ?? 0);

  const kmTotal = Math.max(0, input.kmCorrida) + kmExtra;
  const minutosTotal = Math.max(0, input.minutosCorrida) + minExtra;

  const v = input.valorReais;
  const kmC = Math.max(0, input.kmCorrida);
  const minC = Math.max(0, input.minutosCorrida);

  const reaisPorKmCorrida = kmC > EPS ? v / kmC : null;
  const reaisPorHoraCorrida = minC > EPS ? (v * 60) / minC : null;

  const reaisPorKmEfetivo = kmTotal > EPS ? v / kmTotal : null;
  const reaisPorHoraEfetivo = minutosTotal > EPS ? (v * 60) / minutosTotal : null;

  const custoKm = input.custoPorKmOperacional;
  let lucroLiquido: number | null = null;
  if (
    custoKm != null &&
    Number.isFinite(custoKm) &&
    custoKm >= 0 &&
    kmTotal > EPS
  ) {
    lucroLiquido = v - kmTotal * custoKm;
  }

  return {
    reaisPorKmCorrida,
    reaisPorHoraCorrida,
    kmTotal,
    minutosTotal,
    reaisPorKmEfetivo,
    reaisPorHoraEfetivo,
    lucroLiquido,
  };
}

export type Veredito = 'ok' | 'atencao' | 'ruim' | 'indefinido';

export function vereditoCorrida(
  resultado: CorridaResultado,
  minReaisPorKm: number | null,
  minReaisPorHora: number | null
): Veredito {
  if (minReaisPorKm == null && minReaisPorHora == null) return 'indefinido';

  const kmOk =
    minReaisPorKm == null ||
    (resultado.reaisPorKmEfetivo != null && resultado.reaisPorKmEfetivo >= minReaisPorKm);
  const hOk =
    minReaisPorHora == null ||
    (resultado.reaisPorHoraEfetivo != null && resultado.reaisPorHoraEfetivo >= minReaisPorHora);

  if (kmOk && hOk) return 'ok';
  if (!kmOk && !hOk) return 'ruim';
  return 'atencao';
}

export function formatarBRL(n: number | null, casas: number = 2): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/** Ex.: 35 min → "0h35m" (estilo resumo de oferta). */
export function formatarDuracaoCurta(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos < 0) return '—';
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  return `${h}h${m}m`;
}

export function labelSemáforoMeta(v: Veredito): string {
  switch (v) {
    case 'ok':
      return 'Boa para suas metas';
    case 'atencao':
      return 'Atenção — avalie bem';
    case 'ruim':
      return 'Fraca para suas metas';
    default:
      return 'Defina metas de R$/km e/ou R$/h para o semáforo';
  }
}
