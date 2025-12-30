// src/contexts/ThemeContext.js
import { createContext, useContext } from "react";

const OrbitContext = createContext(); // Default value

export default OrbitContext;

// Optional: Create a custom hook to consume the context easily
export const useOrbit = () => useContext(OrbitContext);
