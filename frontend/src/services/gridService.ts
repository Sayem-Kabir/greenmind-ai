import { generateGrid } from "../utils/generateGrid";

export const cityGrid = generateGrid(
  47.43, // South
  47.61, // North
  21.47, // West
  21.83, // East
  0.01,  // ≈ 1 km
);