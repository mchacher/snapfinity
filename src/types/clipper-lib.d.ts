// Minimal ambient types for `clipper-lib` (no bundled types / @types). Covers only the
// polygon-offset API we use.
declare module 'clipper-lib' {
  interface IntPoint {
    X: number;
    Y: number;
  }

  interface ClipperOffsetInstance {
    AddPath(path: IntPoint[], joinType: number, endType: number): void;
    AddPaths(paths: IntPoint[][], joinType: number, endType: number): void;
    Execute(solution: IntPoint[][], delta: number): void;
    Clear(): void;
  }

  interface ClipperLibStatic {
    JoinType: { jtSquare: number; jtRound: number; jtMiter: number };
    EndType: {
      etOpenSquare: number;
      etOpenRound: number;
      etOpenButt: number;
      etClosedLine: number;
      etClosedPolygon: number;
    };
    ClipperOffset: new (miterLimit?: number, roundPrecision?: number) => ClipperOffsetInstance;
  }

  const ClipperLib: ClipperLibStatic;
  export default ClipperLib;
}
