"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import type { AccuracyPoint, ActivityDay } from "@/app/actions/progress"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const accuracyConfig = {
  accuracy: { label: "Accuracy", color: "var(--chart-2)" },
} satisfies ChartConfig

const activityConfig = {
  questions: { label: "Questions", color: "var(--chart-3)" },
} satisfies ChartConfig

export function AccuracyTrendChart({
  data,
  average,
}: {
  data: AccuracyPoint[]
  average: number
}) {
  return (
    <ChartContainer config={accuracyConfig} className="h-64 w-full">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="accuracyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accuracy)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-accuracy)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          fontSize={11}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          fontSize={11}
          width={48}
        />
        <ReferenceLine
          y={average}
          stroke="var(--muted-foreground)"
          strokeDasharray="4 4"
          label={{
            value: `avg ${average}%`,
            position: "insideTopRight",
            fill: "var(--muted-foreground)",
            fontSize: 11,
          }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const point = payload?.[0]?.payload as AccuracyPoint | undefined
                return point?.lectureTitle ?? ""
              }}
              formatter={(value, _name, item) => {
                const point = item?.payload as AccuracyPoint | undefined
                return `${value}% — ${point?.score ?? 0}/${point?.total ?? 0} correct`
              }}
            />
          }
        />
        <Area
          dataKey="accuracy"
          type="monotone"
          stroke="var(--color-accuracy)"
          strokeWidth={2}
          fill="url(#accuracyFill)"
          dot={{ r: 2.5, fill: "var(--color-accuracy)", strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

export function ActivityChart({ data }: { data: ActivityDay[] }) {
  return (
    <ChartContainer config={activityConfig} className="h-56 w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={16}
          fontSize={11}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          fontSize={11}
          width={48}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => {
                const day = item?.payload as ActivityDay | undefined
                return `${value} questions across ${day?.attempts ?? 0} ${
                  day?.attempts === 1 ? "quiz" : "quizzes"
                }`
              }}
            />
          }
        />
        <Bar dataKey="questions" fill="var(--color-questions)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
