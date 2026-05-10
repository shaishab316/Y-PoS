import { calculateDistanceInKm } from './calculateDistance';

describe('calculateDistanceInKm', () => {
  it('should return 0 when the start and end coordinates are exactly the same', () => {
    const point = { lat: 40.7128, lon: -74.006 };
    const distance = calculateDistanceInKm(point, point);

    expect(distance).toBe(0);
  });

  it('should accurately calculate the distance between New York and London', () => {
    const newYork = { lat: 40.7128, lon: -74.006 };
    const london = { lat: 51.5074, lon: -0.1278 };

    const distance = calculateDistanceInKm(newYork, london);

    // Formula yields ~5570.22 km
    expect(distance).toBeCloseTo(5570.22, 1); // 1 means accurate to 1 decimal place
  });

  it('should accurately calculate the distance between Paris and Berlin', () => {
    const paris = { lat: 48.8566, lon: 2.3522 };
    const berlin = { lat: 52.52, lon: 13.405 };

    const distance = calculateDistanceInKm(paris, berlin);

    // Formula yields ~877.46 km
    expect(distance).toBeCloseTo(877.46, 1);
  });

  it('should calculate the distance from the North Pole to the South Pole', () => {
    const northPole = { lat: 90, lon: 0 };
    const southPole = { lat: -90, lon: 0 };

    const distance = calculateDistanceInKm(northPole, southPole);

    // Half of the Earth's circumference (PI * Earth Radius 6371)
    // Math.PI * 6371 ≈ 20015.08 km
    expect(distance).toBeCloseTo(20015.08, 1);
  });

  it('should calculate distance correctly when crossing the equator', () => {
    const point1 = { lat: 10, lon: 0 };
    const point2 = { lat: -10, lon: 0 };

    const distance = calculateDistanceInKm(point1, point2);

    // Formula yields ~2223.90 km
    expect(distance).toBeCloseTo(2223.9, 1);
  });

  it('should calculate distance correctly when crossing the prime meridian (lon 0)', () => {
    const point1 = { lat: 50, lon: -5 };
    const point2 = { lat: 50, lon: 5 };

    const distance = calculateDistanceInKm(point1, point2);

    // Formula yields ~714.21 km
    expect(distance).toBeCloseTo(714.21, 1);
  });
});
