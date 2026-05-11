"""
Espelho da lógica em TypeScript (`medidor-ganho/logic/calculoCorrida.ts`).
Útil para testes, scripts ou backend — não é usado pelo app móvel em runtime.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional, Tuple

EPS = 1e-9


@dataclass
class CorridaInput:
    valor_reais: float
    km_corrida: float
    minutos_corrida: float
    km_ate_embarque: float = 0.0
    minutos_ate_embarque: float = 0.0


@dataclass
class CorridaResultado:
    reais_por_km_corrida: Optional[float]
    reais_por_hora_corrida: Optional[float]
    km_total: float
    minutos_total: float
    reais_por_km_efetivo: Optional[float]
    reais_por_hora_efetivo: Optional[float]


def calcular_corrida(inp: CorridaInput) -> CorridaResultado:
    km_extra = max(0.0, inp.km_ate_embarque or 0.0)
    min_extra = max(0.0, inp.minutos_ate_embarque or 0.0)

    km_total = max(0.0, inp.km_corrida) + km_extra
    minutos_total = max(0.0, inp.minutos_corrida) + min_extra

    v = inp.valor_reais
    km_c = max(0.0, inp.km_corrida)
    min_c = max(0.0, inp.minutos_corrida)

    reais_por_km_corrida = v / km_c if km_c > EPS else None
    reais_por_hora_corrida = (v * 60) / min_c if min_c > EPS else None

    reais_por_km_efetivo = v / km_total if km_total > EPS else None
    reais_por_hora_efetivo = (v * 60) / minutos_total if minutos_total > EPS else None

    return CorridaResultado(
        reais_por_km_corrida=reais_por_km_corrida,
        reais_por_hora_corrida=reais_por_hora_corrida,
        km_total=km_total,
        minutos_total=minutos_total,
        reais_por_km_efetivo=reais_por_km_efetivo,
        reais_por_hora_efetivo=reais_por_hora_efetivo,
    )


Veredito = Literal["ok", "atencao", "ruim", "indefinido"]


def veredito_corrida(
    r: CorridaResultado,
    min_reais_por_km: Optional[float],
    min_reais_por_hora: Optional[float],
) -> Veredito:
    if min_reais_por_km is None and min_reais_por_hora is None:
        return "indefinido"

    km_ok = min_reais_por_km is None or (
        r.reais_por_km_efetivo is not None and r.reais_por_km_efetivo >= min_reais_por_km
    )
    h_ok = min_reais_por_hora is None or (
        r.reais_por_hora_efetivo is not None and r.reais_por_hora_efetivo >= min_reais_por_hora
    )

    if km_ok and h_ok:
        return "ok"
    if not km_ok and not h_ok:
        return "ruim"
    return "atencao"


if __name__ == "__main__":
    ex = CorridaInput(valor_reais=18.5, km_corrida=7.2, minutos_corrida=22, km_ate_embarque=3, minutos_ate_embarque=8)
    res = calcular_corrida(ex)
    print("Exemplo:", res)
    print("Veredito (mín 2,50/km e 35/h):", veredito_corrida(res, 2.5, 35.0))
