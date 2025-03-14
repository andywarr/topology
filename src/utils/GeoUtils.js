export class GeoUtils {
  // Convert degrees to radians
  static toRad(degrees) {
    return (degrees * Math.PI) / 180;
  }

  // Convert radians to degrees
  static toDeg(radians) {
    return (radians * 180) / Math.PI;
  }

  // Calculate distance between coordinates in kilometers using Haversine formula
  static distance(coord1, coord2) {
    const lng1 = this.toRad(coord1.lng);
    const lng2 = this.toRad(coord2.lng);
    const lat1 = this.toRad(coord1.lat);
    const lat2 = this.toRad(coord2.lat);

    const dlng = lng2 - lng1;
    const dlat = lat2 - lat1;
    const a =
      Math.pow(Math.sin(dlat / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlng / 2), 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const r = 6371; // Earth radius in kilometers

    return c * r;
  }

  // Get new coordinate by moving latitude by distance
  static newLat(coord, distance) {
    const r = 6371; // Earth radius in kilometers

    return {
      lat: coord.lat - (distance / r) * (180 / Math.PI),
      lng: coord.lng,
    };
  }

  // Get new coordinate by moving longitude by distance
  static newLng(coord, distance) {
    const r = 6371; // Earth radius in kilometers

    return {
      lat: coord.lat,
      lng:
        coord.lng -
        ((distance / r) * this.toDeg(1)) / Math.cos(this.toRad(coord.lat)),
    };
  }

  // Convert kilometers to meters
  static kmToM(distance) {
    return distance * 1000;
  }
}
