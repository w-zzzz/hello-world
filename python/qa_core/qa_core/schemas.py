from __future__ import annotations

from datetime import date, datetime
from enum import StrEnum
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, populate_by_name=True)


# --- indicators ---


class ParamKind(StrEnum):
    INT = "int"
    FLOAT = "float"
    ENUM = "enum"


class ParamSpec(StrictModel):
    kind: ParamKind
    default: float | int | str
    min: float | int | None = None
    max: float | int | None = None
    step: float | int | None = None
    options: list[str] | None = None


class IndicatorOutput(StrictModel):
    name: str
    range: tuple[float, float] | None = None
    kind: Literal["overlay", "panel"]


class IndicatorReference(StrictModel):
    type: Literal["paper", "book", "url"]
    cite: str


class IndicatorMeta(StrictModel):
    id: str
    name_zh: str
    name_en: str
    category: Literal["overlay", "oscillator", "trend", "volatility", "volume"]
    formula_tex: str
    params: dict[str, ParamSpec]
    outputs: list[IndicatorOutput]
    use_cases_keys: list[str] = Field(default_factory=list)
    pitfalls_keys: list[str] = Field(default_factory=list)
    references: list[IndicatorReference] = Field(default_factory=list)


# --- market data ---


Interval = Literal["1m", "5m", "15m", "1h", "1d", "1w"]


class Bar(StrictModel):
    t: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


class BarsResponse(StrictModel):
    symbol: str
    interval: Interval
    bars: list[Bar]


# --- backtest result ---


class EquityPoint(StrictModel):
    t: datetime
    equity: float
    cash: float
    position_value: float


class Trade(StrictModel):
    entry_t: datetime
    exit_t: datetime
    side: Literal["long", "short"]
    qty: float
    entry: float
    exit: float
    pnl: float
    mae: float
    mfe: float
    bars_held: int


class Metrics(StrictModel):
    sharpe: float
    sortino: float
    calmar: float
    max_drawdown: float
    profit_factor: float
    win_rate: float
    expectancy: float
    turnover: float
    exposure: float
    trade_count: int


class DrawdownPeriod(StrictModel):
    start: datetime
    trough: datetime
    recovery: datetime | None
    depth: float


class Artifact(StrictModel):
    kind: Literal["plotly_json", "tearsheet_pdf", "csv"]
    url: str


class Warning_(StrictModel):
    code: str
    message: str


class DateRange(StrictModel):
    start: date
    end: date


class RollingStats(StrictModel):
    window: int
    sharpe: list[float]
    volatility: list[float]
    drawdown: list[float]


class BacktestResult(StrictModel):
    run_id: UUID = Field(default_factory=uuid4)
    config_hash: str
    universe: list[str]
    period: DateRange
    equity_curve: list[EquityPoint]
    trades: list[Trade]
    metrics: Metrics
    drawdown_periods: list[DrawdownPeriod]
    benchmark: "BacktestResult | None" = None
    rolling: RollingStats | None = None
    artifacts: list[Artifact] = Field(default_factory=list)
    warnings: list[Warning_] = Field(default_factory=list)


BacktestResult.model_rebuild()
