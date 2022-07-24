import { Injectable } from "@angular/core";
import { DSVRowArray } from "d3";
import * as d3Fetch from 'd3-fetch';

@Injectable({
    providedIn: 'root'
})
export class DataService {
    async getCSVData(): Promise<DSVRowArray<string> | void> {
        try {
            return await d3Fetch.csv('../assets/movies_data/movies_metadata.csv').catch((err: unknown) => {
                console.error(err);
            });
        } catch(err) {
            console.error(err);
        }
    }
}