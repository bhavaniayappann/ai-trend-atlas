"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { format, parseISO } from "date-fns";
import type { RiverDataPoint } from "@/lib/types";

interface TrendRiverProps {
  data: RiverDataPoint[];
}

const COLORS = [
  "#22d3ee", "#34d399", "#fbbf24", "#a78bfa",
  "#f472b6", "#fb923c", "#60a5fa", "#4ade80",
];

export function TrendRiver({ data }: TrendRiverProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrubDate, setScrubDate] = useState<string | null>(null);

  const { dates, topics, series } = useMemo(() => {
    const dateSet = new Set<string>();
    const topicSet = new Set<string>();
    for (const d of data) {
      dateSet.add(d.date);
      topicSet.add(d.topic);
    }
    const dates = Array.from(dateSet).sort();
    const topics = Array.from(topicSet);

    const byDateTopic = new Map<string, number>();
    for (const d of data) {
      byDateTopic.set(`${d.date}:${d.topic}`, d.value);
    }

    const series = topics.map((topic) => ({
      topic,
      values: dates.map((date) => ({
        date: parseISO(date),
        value: byDateTopic.get(`${date}:${topic}`) ?? 0,
      })),
    }));

    return { dates, topics, series };
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !series.length) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 120, bottom: 40, left: 50 };
    const { width, height } = container.getBoundingClientRect();
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr("width", width).attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const allDates = series[0].values.map((d) => d.date);
    const x = d3.scaleTime().domain(d3.extent(allDates) as [Date, Date]).range([0, innerW]);

    const stack = d3
      .stack<{ date: Date; [key: string]: number | Date }>()
      .keys(topics)
      .value((d, key) => (d[key] as number) ?? 0)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetWiggle);

    const stackedData = stack(
      allDates.map((date, i) => {
        const row: { date: Date; [key: string]: number | Date } = { date };
        for (const s of series) {
          row[s.topic] = s.values[i]?.value ?? 0;
        }
        return row;
      })
    );

    const yExtent = d3.extent(stackedData.flat(2)) as [number, number];
    const y = d3.scaleLinear().domain(yExtent).range([innerH, 0]);

    const color = d3.scaleOrdinal<string>().domain(topics).range(COLORS);

    const area = d3
      .area<d3.SeriesPoint<{ date: Date; [key: string]: number | Date }>>()
      .x((d) => x(d.data.date))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]))
      .curve(d3.curveBasis);

    type StackSeries = d3.Series<{ date: Date; [key: string]: number | Date }, string>;

    g.selectAll("path.layer")
      .data(stackedData)
      .join("path")
      .attr("class", "layer")
      .attr("fill", (d: StackSeries) => color(d.key) + "88")
      .attr("stroke", (d: StackSeries) => color(d.key))
      .attr("stroke-width", 1)
      .attr("d", area)
      .on("mouseenter", function (_event, d: StackSeries) {
        d3.select(this).attr("fill", color(d.key) + "cc");
      })
      .on("mouseleave", function (_event, d: StackSeries) {
        d3.select(this).attr("fill", color(d.key) + "88");
      });

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(6)
          .tickFormat((d) => format(d as Date, "MMM d"))
      )
      .selectAll("text")
      .attr("fill", "#64748b")
      .attr("font-size", "11px");

    g.selectAll(".domain, .tick line").attr("stroke", "#1e293b");

    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);

    topics.forEach((topic, i) => {
      const lg = legend.append("g").attr("transform", `translate(0, ${i * 22})`);
      lg.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 2)
        .attr("fill", color(topic));
      lg.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .text(topic)
        .attr("fill", "#94a3b8")
        .attr("font-size", "11px");
    });

    if (scrubDate) {
      const scrubX = x(parseISO(scrubDate));
      g.append("line")
        .attr("x1", scrubX)
        .attr("x2", scrubX)
        .attr("y1", 0)
        .attr("y2", innerH)
        .attr("stroke", "#22d3ee")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,4");
    }
  }, [series, topics, scrubDate]);

  return (
    <div className="flex h-full flex-col">
      <div ref={containerRef} className="flex-1">
        <svg ref={svgRef} className="h-full w-full" />
      </div>

      <div className="border-t border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted">Timeline</span>
          <input
            type="range"
            min={0}
            max={dates.length - 1}
            defaultValue={dates.length - 1}
            className="flex-1 accent-accent"
            onChange={(e) => setScrubDate(dates[Number(e.target.value)] ?? null)}
          />
          <span className="font-mono text-xs text-accent">
            {scrubDate ? format(parseISO(scrubDate), "MMM d, yyyy") : format(parseISO(dates[dates.length - 1]), "MMM d, yyyy")}
          </span>
        </div>
      </div>
    </div>
  );
}
