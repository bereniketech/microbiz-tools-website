"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface ProposalFunnelChartProps {
  steps: Array<{ label: string; count: number }>;
}

export function ProposalFunnelChart({ steps }: ProposalFunnelChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={steps} layout="vertical" margin={{ top: 8, right: 16, left: 12, bottom: 8 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            width={70}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
            formatter={(value) => Number(value ?? 0)}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
