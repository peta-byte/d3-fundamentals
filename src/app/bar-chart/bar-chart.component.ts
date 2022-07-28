import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from "@angular/core";
import { format, transition } from "d3";
import { max, rollup, sum } from "d3-array";
import { Axis, axisLeft, axisTop } from "d3-axis";
import {
  NumberValue,
  ScaleBand,
  scaleBand,
  ScaleLinear,
  scaleLinear
} from "d3-scale";
import { select } from "d3-selection";
import { MovieData } from "../data.interface";

interface BarChartData {
  title: string;
  budget?: number;
  popularity?: number;
  revenue?: number;
}

@Component({
  selector: "app-bar-chart",
  templateUrl: "./bar-chart.component.html",
  styleUrls: ["./bar-chart.component.css"]
})
export class BarChartComponent implements OnInit, OnChanges {
  @Input() rawData: MovieData[] = [];
  barChartData: BarChartData[] = [];
  margin = { top: 90, right: 40, bottom: 40, left: 40 };
  width = 800 - this.margin.left - this.margin.right;
  height = 700 - this.margin.top - this.margin.bottom;

  yScale: ScaleBand<string>;
  xScale: ScaleLinear<number, number>;

  xAxis: Axis<NumberValue>;
  yAxis: Axis<string>;

  xAxisDraw;
  yAxisDraw;

  svg;
  bars;

  header = "Total Budget by Title in $US";

  ngOnInit(): void {
    this.svg = select(".bar-chart-container")
      .attr("width", this.width + this.margin.right + this.margin.left)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.top}, ${this.margin.left})`);

    this.bars = this.svg.append("g").attr("class", "bars");
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.svg) {
      this.setUpLinearScales();
      this.setUpBandScales();
      this.drawAxes();
      this.updateChartData("budget");
      this.addHeader();
    }
  }

  setUpLinearScales() {
    // const xExtent = extent(this.barChartData, (group) => group.budget); // loops through the data and finds the lowest and the highest amounts
    const xMax = max(this.barChartData, (group) => group.budget); // loops through the data and finds the max value

    this.xScale = scaleLinear([0, xMax], [0, this.width]);
    // xScale.domain(xExtent); //data domain - scale from lowest to highest value (so we can chart budget values that are much larger)
    // xScale.range([0, 300]); // output range - scale 0 to 300
  }

  setUpBandScales() {
    this.yScale = scaleBand();
    this.yScale.domain(
      this.barChartData.map((group) => this.cutText(group.title))
    );
    this.yScale
      .rangeRound([0, this.height]) // gives rounded values
      .paddingInner(0.25); // so lines are not blurred from one data point to the next one
  }

  drawBars(chartData: BarChartData[], metric?: string) {
    this.xScale.domain([0, max(chartData, (d) => d[metric])]);
    this.yScale.domain(chartData.map((d) => this.cutText(d.title)));

    const dur = 1000;
    const t = transition().duration(dur);

    this.bars
      .selectAll(".bar")
      .data(
        chartData,
        (datum: { budget: number; title: string }) => datum.title
      ) // creates placeholders (you can't see) with the nonexistent "bar" class, waiting to be told what to be, and binds the data in the array to the placeholders - selectAll gets multiple elements
      // tell the placeholders what they are
      .join(
        (enter) => {
          return (
            enter
              .append("rect")
              .attr("class", "bar")
              // position the rectangles vertically
              .attr("y", (group) => this.yScale(this.cutText(group.title))) // use accessor function to access data from the array
              .attr("height", (group) => this.yScale.bandwidth()) // gets distance between the starting positions
              .style("fill", "lightcyan")
              .transition(t)
              .attr("width", (d) => this.xScale(d[metric]))
              .style("fill", "dodgerblue")
          );
        },
        (update) => {
          return update
            .transition(t)
            .delay((d, i) => i * 20)
            .attr("y", (group) => this.yScale(this.cutText(group.title))) // use accessor function to access data from the array
            .attr("width", (group) => this.xScale(group[metric])); // use accessor function to access data from the array and set the width of each rectangle
        },
        (exit) => {
          return exit
            .transition()
            .duration(dur / 2)
            .style("fill-opacity", 0)
            .remove();
        }
      );

    this.xAxisDraw.transition(t).call(this.xAxis);
    this.yAxisDraw.transition(t).call(this.yAxis);

    this.yAxisDraw.selectAll("text").attr("dx", "-0.6em");
  }

  drawAxes() {
    // know position of the axis and scale it represents
    this.xAxis = axisTop(this.xScale); // returns a function that takes 1 arg - a parent element it can mount itself on
    this.xAxis.tickFormat((tickLabel) => this.formatTick(tickLabel)); // loops through each tick and formarts it (adding spacing between ticks)
    this.xAxis.tickSizeInner(-this.height); // negative height so the lines go down

    // the parent
    this.xAxisDraw = this.svg.append("g").attr("class", "x axis");

    //xAxis(xAxisDraw); // give it the parent

    this.yAxis = axisLeft(this.yScale);
    this.yAxis.tickSize(0); // no tick lines

    // the parent
    this.yAxisDraw = this.svg.append("g").attr("class", "y axis");
  }

  addHeader() {
    const header = this.svg
      .append("g")
      .attr("class", "bar-header")
      .attr("transform", `translate(0, ${-this.margin.top / 2})`)
      .append("text");

    header.append("tspan").text("Total Budget by Title in $US"); // headline
  }

  formatTick(tickLabel) {
    return format("~s")(tickLabel)
      .replace("M", " mil")
      .replace("G", " bil")
      .replace("T", " tril");
  }

  cutText(text: string): string {
    return text?.length < 35 ? text : text.substring(0, 35) + "...";
  }

  onRevenueClick(event: PointerEvent): void {
    this.updateChartData("revenue");
    this.header = "Revenue by Title in $US";
  }

  onBudgetClick(event: PointerEvent): void {
    this.updateChartData("budget");
    this.header = "Budget by Title in $US";
  }

  onPopularityClick(event: PointerEvent): void {
    this.updateChartData("popularity");
    this.header = "Popularity by Title in $US";
  }

  updateChartData(metric: string): void {
    const groupedData: d3.InternMap<string, number> = rollup(
      this.rawData,
      (group) =>
        sum(
          group,
          (movie: MovieData, idx: number, arr: MovieData[]) => +movie[metric]
        ),
      (movie: MovieData) => movie.title
    );

    this.barChartData = Array.from(groupedData)
      .sort((a, b) => b[metric] - a[metric])
      .filter((d, i) => i < 15)
      .map((value) => {
        const result: BarChartData = { title: value[0] };
        result[metric] = value[1];
        return result;
      });

    this.drawBars(this.barChartData, metric);
  }
}
