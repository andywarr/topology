import React from "react";
import { Card, CardContent } from "./ui/card";

const SuggestedLocation = ({ name, mapUrl, onSelect, isSelected = false }) => {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected
          ? "shadow-md border-2 border-zinc-50"
          : "hover:shadow-lg border-zinc-100"
      }`}
      onClick={() => {
        if (!isSelected) {
          onSelect(mapUrl, false);
        }
      }}
      onMouseOver={() => {
        if (!isSelected) {
          onSelect(mapUrl, true);
        }
      }}
    >
      <CardContent className="p-3 text-center">
        <p className={`font-medium ${isSelected ? "text-primary" : ""}`}>
          {name}
        </p>
      </CardContent>
    </Card>
  );
};

export default SuggestedLocation;
