import { Component, Input, OnInit, SimpleChanges } from "@angular/core";
import { axisBottom, axisLeft, format, line } from "d3";
import { extent, max, rollup, sum } from "d3-array";
import { scaleLinear, ScaleLinear, ScaleTime, scaleTime } from "d3-scale";
import { select } from "d3-selection";
import { timeParse } from "d3-time-format";
import { MovieData } from "../data.interface";

@Component({
  selector: "app-line-chart",
  templateUrl: "./line-chart.component.html",
  styleUrls: ["./line-chart.component.css"]
})
export class LineChartComponent implements OnInit {
  @Input() rawData: MovieData[] = [];
  lineChartData: { dates: Date[]; series: unknown[]; yMax: number };
  margin = { top: 40, right: 40, bottom: 40, left: 40 };
  width = 700 - this.margin.right - this.margin.left;
  height = 700 - this.margin.top - this.margin.bottom;

  yScale: ScaleLinear<number, number>;
  xScale: ScaleTime<number, number>;

  svg;

  constructor() {}

  ngOnInit(): void {
    this.svg = select(".line-chart-container")
      .attr("width", this.width + this.margin.right + this.margin.left)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.top}, ${this.margin.left})`);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.prepareLineChartData();
    this.prepareScales();
    if (this.svg) {
      this.drawPlot();
      this.drawAxes();
      this.addHeader();
    }
  }

  prepareLineChartData() {
    // group by year and extract measures
    const groupBy = (movie: MovieData) => {
      const year = new Date(movie.release_date).getFullYear();
      return year;
    };
    const reduceRevenue = (values: MovieData[]) => {
      return sum(values, (value: MovieData) => +value.revenue);
    };
    const revenueMap = rollup(this.rawData, reduceRevenue, groupBy);

    const reduceBudget = (values: MovieData[]) => {
      return sum(values, (value: MovieData) => +value.budget);
    };
    const budgetMap = rollup(this.rawData, reduceBudget, groupBy);

    // convert to array
    const revenue = Array.from(revenueMap).sort((a, b) => {
      return a[0] - b[0];
    });
    const budget = Array.from(budgetMap).sort((a, b) => {
      return a[0] - b[0];
    });

    // parse years
    const parseYear = timeParse("%Y");
    const dates = revenue.map((d) => {
      return parseYear(d[0] + "");
    });

    // money maximum
    const yValues = [
      ...Array.from(revenueMap.values()),
      ...Array.from(budgetMap.values())
    ];
    const yMax = max(yValues);

    // produce final data
    this.lineChartData = {
      series: [
        {
          name: "Revenue",
          color: "dodgerblue",
          values: revenue.map((val) => {
            return { date: parseYear(val[0] + ""), value: val[1] };
          })
        },
        {
          name: "Budget",
          color: "darkorange",
          values: budget.map((val) => {
            return { date: parseYear(val[0] + ""), value: val[1] };
          })
        }
      ],
      dates: dates,
      yMax: yMax
    };
  }

  prepareScales() {
    this.xScale = scaleTime()
      .domain(extent(this.lineChartData.dates))
      .range([0, this.width]);

    this.yScale = scaleLinear()
      .domain([0, this.lineChartData.yMax])
      .range([this.height, 0]);
  }

  drawPlot() {
    // line generator
    const lineGen = line<{ date: Date; value: number }>()
      .x((value) => this.xScale(value.date))
      .y((value) => this.yScale(value.value));

    const chartGroup = this.svg.append("g").attr("class", "line-chart");

    chartGroup
      .selectAll(".line-series")
      .data(this.lineChartData.series)
      .enter()
      .append("path")
      .attr(
        "class",
        (d: {
          name: string;
          values: { date: Date; value: number }[];
          color: string;
        }) => `line-series ${d.name.toLowerCase()}`
      )
      .attr(
        "d",
        (d: {
          name: string;
          values: { date: Date; value: number }[];
          color: string;
        }) => lineGen(d.values)
      )
      .style("fill", "none")
      .style("stroke", (d) => d.color);

    // add series label
    chartGroup
      .append("g")
      .attr("class", "series-labels")
      .selectAll(".series-label")
      .data(this.lineChartData.series)
      .enter()
      .append("text")
      .attr("x", (d) => this.xScale(d.values[d.values.length - 1].date) + 5)
      .attr("y", (d) => this.yScale(d.values[d.values.length - 1].value))
      .text((d) => d.name)
      .style("dominant-baseline", "central")
      .style("font-size", "0.7em")
      .style("font-weight", "bold")
      .style("fill", (d) => d.color);
  }

  drawAxes() {
    const xAxis = axisBottom(this.xScale).tickSizeOuter(0);

    const xAxisDraw = this.svg
      .append("g")
      .attr("transform", `translate(0, ${this.height})`)
      .attr("class", "x axis")
      .call(xAxis);

    const yAxis = axisLeft(this.yScale)
      .ticks(5)
      .tickFormat(this.formatTick)
      .tickSizeOuter(0)
      .tickSizeInner(-this.width);

    const yAxisDraw = this.svg.append("g").attr("class", "y axis").call(yAxis);
  }

  formatTick(tickLabel) {
    return format("~s")(tickLabel)
      .replace("M", " mil")
      .replace("G", " bil")
      .replace("T", " tril");
  }

  addHeader() {
    const header = this.svg
      .append("g")
      .attr("class", "line-header")
      .attr("transform", `translate(0, ${-this.margin.top * 0.6})`)
      .append("text");

    header.append("tspan").text("Budget and Revenue over Time in $US");

    header
      .append("tspan")
      .attr("x", 0)
      .attr("dy", "1.5em")
      .style("font-size", "0.8em")
      .style("fill", "#555")
      .text("Films w/ budget and revenue figures");
  }
}

/**
 * Line chart - trends?
 *
 * Scatter plot - marks defined by cx, cy, and r attributes.
 *
 * Line chart - path defined by d (data) - path through points with co-ordinates. Lotsa points along the path.
 * d3.line() helps create these points so we don't have to manually map from point to point.
 *
 * 2 paths/lines = 2 arrays of data with multiple values (points) to describe the shape of the paths
 */
