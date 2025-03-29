import React, { useState, useEffect } from "react";
import { GoogleMapsUrlParser } from "../utils/GoogleMapsUrlParser.js";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { useForm } from "react-hook-form";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import SuggestedLocation from "./SuggestedLocation";

export const HomepageUI = ({ onLocationSubmit }) => {
  const [showHomepage, setShowHomepage] = useState(true);
  const mapContainer = document.getElementById("map");
  const originalMapDisplay = mapContainer
    ? mapContainer.style.display
    : "block";

  useEffect(() => {
    if (mapContainer) {
      mapContainer.style.display = showHomepage ? "none" : originalMapDisplay;
    }

    return () => {
      if (mapContainer) {
        mapContainer.style.display = originalMapDisplay;
      }
    };
  }, [showHomepage, mapContainer, originalMapDisplay]);

  const form = useForm({
    defaultValues: {
      mapUrl: "",
    },
  });

  const [error, setError] = useState(null);
  const [selectedLocationUrl, setSelectedLocationUrl] = useState(null);
  const [hoveredLocationUrl, setHoveredLocationUrl] = useState(null);

  const handleFormSubmit = (data) => {
    const url = data.mapUrl.trim();
    if (url) {
      const location = GoogleMapsUrlParser.parseUrl(url);
      if (location) {
        // Add name to the location if it was passed
        if (data.name) {
          location.name = data.name;
        }
        setShowHomepage(false);
        onLocationSubmit(location);
      } else {
        setError(
          "Invalid Google Maps URL. Please check the format and try again."
        );
      }
    }
  };

  const handleSuggestionClick = (data) => {
    const url = data.mapUrl.trim();
    if (url) {
      const location = GoogleMapsUrlParser.parseUrl(url);
      if (location) {
        setShowHomepage(false);
        onLocationSubmit(location);
      } else {
        setError(
          "Invalid Google Maps URL. Please check the format and try again."
        );
      }
    }
  };

  // Add a preview function that doesn't hide the homepage
  const handleLocationHover = (url, name) => {
    setHoveredLocationUrl(url);
    // Here you could add additional preview functionality
  };

  const handleLocationHoverEnd = () => {
    setHoveredLocationUrl(null);
  };

  const suggestedLocations = [
    {
      name: "San Francisco",
      mapUrl: "https://www.google.com/maps/@37.7749,-122.4194,12z",
    },
    {
      name: "Tahoe",
      mapUrl: "https://www.google.com/maps/@39.0968,-120.0324,12z",
    },
    {
      name: "Everest",
      mapUrl: "https://www.google.com/maps/@27.9881,86.9250,12z",
    },
  ];

  if (!showHomepage) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 fixed inset-0 z-50">
      <Card className="border shadow-lg w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Topology Renderer
          </CardTitle>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="mapUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Paste Google Maps URL (e.g., https://www.google.com/maps/@37.7709704,-122.4118542,12z)"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Generate
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-6 w-full max-w-md">
        <h3 className="text-center text-lg font-medium mb-3 text-white">
          Suggested Locations
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {suggestedLocations.map((location) => (
            <SuggestedLocation
              key={location.name}
              name={location.name}
              mapUrl={location.mapUrl}
              isSelected={selectedLocationUrl === location.mapUrl}
              isHovered={hoveredLocationUrl === location.mapUrl}
              onSelect={(url) => {
                handleFormSubmit({ mapUrl: url, name: location.name });
              }}
              onHover={() =>
                handleLocationHover(location.mapUrl, location.name)
              }
              onHoverEnd={handleLocationHoverEnd}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomepageUI;
