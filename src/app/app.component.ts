import { Component, OnInit } from "@angular/core";
import * as d3 from "d3";
import { MovieData, movieDataParser } from "./data.interface";
import { DataService } from "./data.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  title = "d3-js";
  data: MovieData[] = [];
  barChartData: { title: string; budget: number }[] = [];

  constructor(private readonly dataService: DataService) {}

  ngOnInit(): void {
    this.getMovieData();
  }

  getMovieData(): void {
    this.dataService.getCSVData().then((data: d3.DSVRowArray<string>) => {
      const rawData: d3.DSVRowString<string>[] = data.slice(0, 100);
      this.data = rawData.map((movie) => {
        return movieDataParser(movie);
      });
    });
  }
}

/**
 * General update pattern
 *
 * A recipe to deal with changing data - sync data with visual changes
 *
 * 3 update states:
 * enter - new data rows NOT in the DOM but in the data
 * update - remaining rows in the DOM and in the data
 * exit - leaving data rows in the DOM but NOT in the data
 *
 * d3 data join:
 * compares new data set with any elements not already in the DOM
 *
 * update function should:
 *
 * compare data and existing DOM elements - does the data join
 * fill enter, update, and exit selections
 * update the DOM based on selections
 *
 */
