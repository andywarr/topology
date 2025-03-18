import React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";
import "./styles/style.css";

// Create a root container and render the React component
const container = document.createElement("div");
container.id = "react-root";
document.body.insertBefore(container, document.body.firstChild);

const root = createRoot(container);
root.render(React.createElement(App));
