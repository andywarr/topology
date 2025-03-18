import React, { useState, useEffect } from "react";
import { GoogleMapsUrlParser } from "../utils/GoogleMapsUrlParser.js";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { useForm } from "react-hook-form";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

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

  const handleFormSubmit = (data) => {
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

  if (!showHomepage) return null;

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <Card className="border shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Topology Viewer</CardTitle>
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
    </div>
  );
};

export default HomepageUI;
