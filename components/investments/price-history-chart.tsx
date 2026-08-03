"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
  ResponsiveContainer,
} from "recharts";
import { formatBRL, formatDate } from "@/lib/format";

interface PricePoint {
  date: string;
  price: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { payload: PricePoint }[];
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-semibold tabular-nums">{formatBRL(point.price)}</p>
      <p className="text-xs text-muted-foreground">{formatDate(point.date)}</p>
    </div>
  );
}

export function PriceHistoryChart({
  data,
  ticker,
}: {
  data: PricePoint[];
  ticker: string;
}) {
  if (data.length < 2) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Ainda não há histórico de preço suficiente para {ticker}. O gráfico se
        enriquece conforme o app acompanha as cotações.
      </p>
    );
  }

  const last = data[data.length - 1];

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-end gap-2">
        <span className="text-2xl font-semibold tabular-nums">{formatBRL(last.price)}</span>
        <span className="text-xs text-muted-foreground">{formatDate(last.date)}</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => formatDate(value).slice(0, 5)}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            tickFormatter={(value: number) => formatBRL(value)}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={80}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="var(--chart-1)"
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 5, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <ReferenceDot
            x={last.date}
            y={last.price}
            r={5}
            fill="var(--chart-1)"
            stroke="var(--card)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Ver dados em tabela
        </summary>
        <div className="mt-2 max-h-56 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Data</th>
                <th className="px-3 py-1.5 text-right font-medium">Preço</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((point) => (
                <tr key={point.date} className="border-t">
                  <td className="px-3 py-1.5">{formatDate(point.date)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {formatBRL(point.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
