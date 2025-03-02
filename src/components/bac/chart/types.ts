
export interface BacDataPoint {
  time: Date;
  bac: number;
}

export interface ChartCoordinates {
  getXCoordinate: (time: Date) => number;
  getYCoordinate: (bac: number) => number;
}
