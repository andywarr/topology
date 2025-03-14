export class GoogleMapsUrlParser {
  static parseUrl(url) {
    try {
      // Parse the URL for the @ format: @lat,lng,zoom
      const regex = /@(-?\d+\.\d+),(-?\d+\.\d+),(\d+\.?\d*)z/;
      const match = url.match(regex);

      if (match && match.length >= 4) {
        return {
          center: { lat: parseFloat(match[1]), lng: parseFloat(match[2]) },
          zoom: parseInt(match[3], 10),
        };
      }

      throw new Error("Invalid Google Maps URL format");
    } catch (error) {
      console.error("Error parsing Google Maps URL:", error);
      return null;
    }
  }
}
