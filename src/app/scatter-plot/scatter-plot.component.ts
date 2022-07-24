import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from "@angular/core";
import { format } from "d3";
import { extent } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleLinear, ScaleLinear } from "d3-scale";
import { select } from "d3-selection";
import { MovieData } from "../data.interface";

@Component({
  selector: "app-scatter-plot",
  templateUrl: "./scatter-plot.component.html",
  styleUrls: ["./scatter-plot.component.css"]
})
export class ScatterPlotComponent implements OnInit, OnChanges {
  scatterPlotData: MovieData[] = [];
  @Input() rawData: MovieData[] = [];
  margin = { top: 40, right: 40, bottom: 40, left: 40 };
  width = 700 - this.margin.right - this.margin.left;
  height = 700 - this.margin.top - this.margin.bottom;

  yScale: ScaleLinear<number, number>;
  xScale: ScaleLinear<number, number>;

  svg;

  constructor() {}

  ngOnInit(): void {
    this.svg = select(".scatter-plot-container")
      .attr("width", this.width + this.margin.right + this.margin.left)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.top}, ${this.margin.left})`);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.prepareScatterData();
    this.prepareScales();
    if (this.svg) {
      this.drawPlot();
      this.drawAxes();
      this.addHeader();
    }
  }

  prepareScatterData(): void {
    this.scatterPlotData = this.rawData.sort((a, b) => {
      return +b.budget - +a.budget;
    });
  }

  prepareScales(): void {
    const xExtent = extent(this.scatterPlotData, (movie) => +movie.budget).map(
      (movie, idx, arr) => {
        return idx === 0 ? movie * 0.95 : movie * 1.05;
      }
    ); // so the first values don't fall on the axis

    this.xScale = scaleLinear().domain(xExtent).range([0, this.width]);

    const yExtent = extent(this.scatterPlotData, (movie) => +movie.revenue).map(
      (movie, idx, arr) => {
        return idx === 0 ? movie * 0.1 : movie * 1.1;
      }
    ); // so the first values don't fall on the axis

    this.yScale = scaleLinear().domain(yExtent).range([this.height, 0]);
  }

  drawPlot(): void {
    this.svg
      .attr("class", "scatter-points")
      .selectAll(".scatter")
      .data(this.scatterPlotData)
      .enter()
      .append("circle")
      .attr("class", "scatter")
      .attr("cx", (movie) => this.xScale(+movie.budget))
      .attr("cy", (movie) => this.yScale(+movie.revenue))
      .attr("r", 3)
      .style("fill", "dodgerblue")
      .style("fill-opacity", 0.7); // make overlapping circles/dots more visible
  }

  drawAxes(): void {
    const xAxis = axisBottom(this.xScale)
      .ticks(5)
      .tickFormat(this.formatTick)
      .tickSizeInner(-this.height)
      .tickSizeOuter(0);

    const xAxisDraw = this.svg
      .append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${this.height})`)
      .call(xAxis)
      .call(this.addLabel, "Budget", 25);

    xAxisDraw.selectAll("text").attr("dy", "lem");

    const yAxis = axisLeft(this.yScale)
      .ticks(5)
      .tickFormat(this.formatTick)
      .tickSizeInner(-this.height)
      .tickSizeOuter(0);

    const yAxisDraw = this.svg
      .append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .call(this.addLabel, "Revenue", 5);
  }

  addHeader(): void {
    const header = this.svg
      .append("g")
      .attr("class", "scatter-header")
      .attr("transform", `translate(0, ${-this.margin.top * 0.6})`)
      .append("text");

    header.append("tspan").text("Budget vs. Revenue in $US");

    header
      .append("tspan")
      .attr("x", 0)
      .attr("dy", "1.5em")
      .style("font-size", "0.8em")
      .style("fill", "#555")
      .text("Films w/ budget and revenue figures");
  }

  addLabel(axis, label, x): void {
    axis
      .selectAll(".tick:last-of-type text")
      .clone()
      .text(label)
      .attr("x", x)
      .style("text-anchor", "start")
      .style("font-weight", "bold")
      .style("fill", "#555");
  }

  formatTick(tickLabel) {
    return format("~s")(tickLabel)
      .replace("M", " mil")
      .replace("G", " bil")
      .replace("T", " tril");
  }
}

/* 
svg origin - top left
chart/data origin - bottom left

domain - refers to the data dimensions
range - refers to the svg dimensions

*/
