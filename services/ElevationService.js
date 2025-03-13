import { GeoUtils } from "../utils/GeoUtils.js";

export class ElevationService {
  constructor(google, sampleLength) {
    this.google = google;
    this.sampleLength = sampleLength;
    this.elevator = new google.maps.ElevationService();
    this.maxSamples = 500;
  }

  // Get elevation data for an area defined by corners
  async getElevationData(coordinates) {
    const { southWest, northEast, southEast, northWest } = coordinates;
    let elevationData = [];

    let i = northWest;
    let j = northEast;

    const totalDistance = GeoUtils.distance(northWest, southWest);
    let processedDistance = 0;
    let samples = Math.floor(GeoUtils.distance(i, j) / this.sampleLength);

    try {
      // Process rows of elevation data
      while (i.lat >= southWest.lat) {
        let currentPoint = i;
        let remainingSamples = samples;
        let pathElevation = [];

        console.log(
          `Downloading elevation data (${Math.round(
            (processedDistance / totalDistance) * 100
          )}%)`
        );

        // Process columns within a row
        while (remainingSamples > 0) {
          let path;
          let samplesInBatch;

          if (remainingSamples > this.maxSamples) {
            const endPoint = GeoUtils.newLng(
              currentPoint,
              this.maxSamples * this.sampleLength
            );
            path = [currentPoint, endPoint];
            samplesInBatch = this.maxSamples;
          } else {
            path = [currentPoint, j];
            samplesInBatch = remainingSamples;
          }

          const data = await this.elevator.getElevationAlongPath({
            path: path,
            samples: samplesInBatch,
          });

          pathElevation.push(this._cleanElevationData(data.results));
          remainingSamples -= this.maxSamples;

          // Respect API rate limits
          await this._delay(1000);

          // Update current point for next batch
          if (remainingSamples > 0) {
            currentPoint = GeoUtils.newLng(
              currentPoint,
              this.maxSamples * this.sampleLength
            );
          }
        }

        elevationData.push(pathElevation.flat());

        // Move to next row
        i = GeoUtils.newLat(i, this.sampleLength);
        j = GeoUtils.newLat(j, this.sampleLength);
        processedDistance += this.sampleLength;
      }

      console.log(`Downloading elevation data (100%)`);
      return elevationData;
    } catch (error) {
      console.error("Error fetching elevation data:", error);
      throw error;
    }
  }

  // Clean elevation data from API response
  _cleanElevationData(results) {
    return results.map((item) => item.elevation);
  }

  // Utility to create delays between API requests
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
