import { DSVRowString } from "d3";

export interface MovieData {
    adult: boolean | string;
    belongs_to_collection: string | { id: string; name: string; poster_path: string; backdrop_path: string; }[];
    budget: string | number;
    genres: { id: string; name: string; }[];
    homepage: string;
    id: string;
    imdb_id: string;
    original_language: string;
    original_title: string;
    overview: string;
    popularity: number;
    poster_path: string;
    production_companies: string | { name: string; id: string; }[];
    production_countries: string | { [key: string]: string; }[];
    release_date: string | Date;
    revenue: number | string;
    runtime: string | number;
    spoken_languages: string | { [key: string]: string; }[];
    status: string;
    tagline: string;
    title: string;
    video: boolean | string;
    vote_average: string | number;
    vote_count: string | number;
};

export const movieDataParser = (mov: unknown): MovieData =>  {
    const movie = mov as unknown as MovieData;
    return {
        ...movie,
        adult: !!movie.adult,
        budget: +movie.budget,
        genres: movie.genres ? JSON.parse(JSON.stringify(movie.genres)) : '',
        production_companies: movie.production_companies ? JSON.parse(JSON.stringify(movie.production_companies)) : '',
        production_countries: movie.production_countries ? JSON.parse(JSON.stringify(movie.production_countries)) : '',
        revenue: +movie.revenue,
        runtime: +movie.runtime,
        spoken_languages: JSON.parse(JSON.stringify(movie.spoken_languages)),
        video: !!movie.video,
        vote_average: +movie.vote_average,
        vote_count: +movie.vote_count
    };
};