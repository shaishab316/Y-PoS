import { latLngToCell, gridDisk, cellToLatLng } from 'h3-js';

const H3_RESOLUTION = 7; // ~1.2km per cell, food delivery sweet spot

const encodeH3 = (lat: number, lng: number): string =>
  latLngToCell(lat, lng, H3_RESOLUTION);

const getSearchCells = (h3Index: string, radius = 1): string[] =>
  gridDisk(h3Index, radius); // radius 1 = center + 6 neighbors = 7 cells

const decodeH3 = (h3Index: string) => {
  const [lat, lng] = cellToLatLng(h3Index);
  return { lat, lng };
};

export const H3IndexUtil = { encodeH3, getSearchCells, decodeH3 };
