// Geographic anchors use the existing NASA equirectangular Earth map.
// Continent centers and broad-region stops are representative, not political boundaries.
export const continents = [
  { id: 'asia', name: 'Asia', lat: 30, lon: 100, available: true },
  { id: 'africa', name: 'Africa', lat: 3, lon: 20 },
  { id: 'europe', name: 'Europe', lat: 51, lon: 15 },
  { id: 'north-america', name: 'North America', lat: 42, lon: -105 },
  { id: 'south-america', name: 'South America', lat: -15, lon: -60 },
  { id: 'australia', name: 'Australia', lat: -25, lon: 134 },
  { id: 'antarctica', name: 'Antarctica', lat: -82, lon: 0 },
];
export const earthRegions = {
  asia: { title: 'Asia', lat: 22, lon: 105, zoom: .7, sites: ['merapi', 'himalayas', 'borneo'] },
};
export const earthSites = {
  merapi: { title: 'Mount Merapi', region: 'asia', lat: -7.54, lon: 110.446, zoom: .65 },
  himalayas: { title: 'The Himalayas', region: 'asia', lat: 28, lon: 86.9, zoom: .65 },
  borneo: { title: 'Borneo’s rainforests', region: 'asia', lat: 5.4, lon: 117.9, zoom: .65 },
};
export const globePose = { lat: 15, lon: 85, zoom: 1 };
