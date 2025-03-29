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
import sanFranciscoElevationData from "../data/elevationData/sanFranciscoElevationData.js";

export const HomepageUI = ({ onLocationSubmit }) => {
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

  const [showHomepage, setShowHomepage] = useState(true);
  const [selectedLocationUrl, setSelectedLocationUrl] = useState(
    suggestedLocations[0].mapUrl
  );
  const [error, setError] = useState(null);

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

  const handleFormSubmit = (data, isPreview = false) => {
    const url = data.mapUrl.trim();
    if (url) {
      const location = GoogleMapsUrlParser.parseUrl(url);
      if (location) {
        // Add name to the location if it was passed
        if (data.name) {
          location.name = data.name;
        }
        if (!isPreview) {
          setShowHomepage(false);
        }

        setSelectedLocationUrl(url);

        onLocationSubmit(location, isPreview);
      } else {
        setError(
          "Invalid Google Maps URL. Please check the format and try again."
        );
      }
    }
  };

  if (!showHomepage) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 fixed inset-0 z-50 transition-opacity duration-300 opacity-100">
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
              onSubmit={form.handleSubmit((data) =>
                handleFormSubmit(data, false)
              )}
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
          {suggestedLocations.map((location, index) => (
            <SuggestedLocation
              key={location.name}
              name={location.name}
              mapUrl={location.mapUrl}
              isSelected={selectedLocationUrl === location.mapUrl}
              onSelect={(url, isPreview) => {
                if (!isPreview) {
                  // Only set opacity to 0 if not in preview mode
                  const parentElement = document.querySelector(
                    ".min-h-screen.w-full.flex"
                  );
                  if (parentElement) {
                    parentElement.style.opacity = "0";
                  }

                  // Small delay to allow opacity transition to complete
                  setTimeout(() => {
                    handleFormSubmit(
                      { mapUrl: url, name: location.name },
                      isPreview
                    );
                  }, 300); // Match the duration-300 transition time
                } else {
                  // If in preview mode, immediately handle form submission without hiding UI
                  handleFormSubmit(
                    { mapUrl: url, name: location.name },
                    isPreview
                  );
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomepageUI;
