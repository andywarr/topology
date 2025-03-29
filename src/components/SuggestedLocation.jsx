import React from "react";
import { Card, CardContent } from "./ui/card";

const SuggestedLocation = ({ name, mapUrl, onSelect, isSelected = false }) => {
  return (
    <Card
      className={`border-2 cursor-pointer transition-all ${
        isSelected ? "shadow-md bg-zinc-50" : "bg-zinc-200"
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
