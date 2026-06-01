import {
  draw,
  drawRoundedRectangle,
  makeSolid,
  assembleWire,
  makeFace,
  EdgeFinder,
  type Shape3D,
  type Sketch,
  type Plane,
  type Point,
} from 'replicad';
import { HEIGHT_UNIT_MM } from '../core/sizing';
import { assertPositive } from '../core/guards';

/**
 * Parametric Gridfinity bin modelled in replicad.
 *
 * The foot/socket and stacking-lip profiles are adapted from the official replicad
 * Gridfinity example (https://replicad.xyz/docs/examples/gridfinity/, MIT), parametrised
 * by pitch and with magnets/screws removed. The profiles are pitch-independent (the
 * stacking interface is constant); only the footprint and grid spacing scale with pitch.
 */

/** Supported grid pitch range, in mm (below ~20 the foot tapers overlap). */
export const PITCH_MIN_MM = 20;
export const PITCH_MAX_MM = 84;
export const DEFAULT_PITCH_MM = 42;

const CLEARANCE = 0.5;
const AXIS_CLEARANCE = (CLEARANCE * Math.sqrt(2)) / 4;
const CORNER_RADIUS = 4;
const TOP_FILLET = 0.6;
const SOCKET_HEIGHT = 5;
const SOCKET_SMALL_TAPER = 0.8;
const SOCKET_BIG_TAPER = 2.4;
const SOCKET_VERTICAL_PART = SOCKET_HEIGHT - SOCKET_SMALL_TAPER - SOCKET_BIG_TAPER;
const SOCKET_TAPER_WIDTH = SOCKET_SMALL_TAPER + SOCKET_BIG_TAPER;
const WALL = 1.2;
/** Height the swept top profile adds above the box body (measured; pitch/lip independent). */
const TOP_RISE = 3.63;

export interface BinParams {
  cols: number;
  rows: number;
  heightUnits: number;
  /** Grid pitch in mm (default 42; valid range PITCH_MIN_MM..PITCH_MAX_MM). */
  pitchMm?: number;
  /** Include the stacking lip (default true). */
  includeLip?: boolean;
}

export interface BinDimensions {
  width: number;
  depth: number;
  height: number;
}

function assertPitch(pitchMm: number): void {
  assertPositive('pitchMm', pitchMm);
  if (pitchMm < PITCH_MIN_MM || pitchMm > PITCH_MAX_MM) {
    throw new Error(`pitchMm must be within ${PITCH_MIN_MM}..${PITCH_MAX_MM} mm, got ${pitchMm}`);
  }
}

/** Outer dimensions of the bin, in mm (foot + body + top profile). */
export function binDimensions({
  cols,
  rows,
  heightUnits,
  pitchMm = DEFAULT_PITCH_MM,
}: BinParams): BinDimensions {
  assertPitch(pitchMm);
  return {
    width: cols * pitchMm - CLEARANCE,
    depth: rows * pitchMm - CLEARANCE,
    height: SOCKET_HEIGHT + heightUnits * HEIGHT_UNIT_MM + TOP_RISE,
  };
}

const socketProfile = (_plane: Plane, startPoint: Point): Sketch => {
  const full = draw([-CLEARANCE / 2, 0])
    .vLine(-CLEARANCE / 2)
    .lineTo([-SOCKET_BIG_TAPER, -SOCKET_BIG_TAPER])
    .vLine(-SOCKET_VERTICAL_PART)
    .line(-SOCKET_SMALL_TAPER, -SOCKET_SMALL_TAPER)
    .done()
    .translate(CLEARANCE / 2, 0);
  return full.sketchOnPlane('XZ', startPoint) as Sketch;
};

function buildSocket(pitchMm: number): Shape3D {
  const baseSocket = drawRoundedRectangle(
    pitchMm - CLEARANCE,
    pitchMm - CLEARANCE,
    CORNER_RADIUS,
  ).sketchOnPlane() as Sketch;
  const slotSide = baseSocket.sweepSketch(socketProfile, { withContact: true });
  return makeSolid([
    slotSide,
    makeFace(assembleWire(new EdgeFinder().inPlane('XY', -SOCKET_HEIGHT).find(slotSide))),
    makeFace(assembleWire(new EdgeFinder().inPlane('XY', 0).find(slotSide))),
  ]);
}

const range = (i: number): number[] => [...Array(i).keys()];

function cloneOnGrid(socket: Shape3D, pitchMm: number, cols: number, rows: number): Shape3D[] {
  const xCorr = ((cols - 1) * pitchMm) / 2;
  const yCorr = ((rows - 1) * pitchMm) / 2;
  return range(cols).flatMap((i) =>
    range(rows).map((j) =>
      socket.clone().translate([i * pitchMm - xCorr, j * pitchMm - yCorr, 0]),
    ),
  );
}

function buildTopShape(
  pitchMm: number,
  cols: number,
  rows: number,
  includeLip: boolean,
): Shape3D {
  const topShape = (basePlane: Plane): Sketch => {
    const sketcher = draw([-SOCKET_TAPER_WIDTH, 0])
      .line(SOCKET_SMALL_TAPER, SOCKET_SMALL_TAPER)
      .vLine(SOCKET_VERTICAL_PART)
      .line(SOCKET_BIG_TAPER, SOCKET_BIG_TAPER);
    if (includeLip) {
      sketcher.vLineTo(-(SOCKET_TAPER_WIDTH + WALL)).lineTo([-SOCKET_TAPER_WIDTH, -WALL]);
    } else {
      sketcher.vLineTo(0);
    }
    const basicShape = sketcher.close();
    const shiftedShape = basicShape
      .translate(AXIS_CLEARANCE, -AXIS_CLEARANCE)
      .intersect(drawRoundedRectangle(10, 10).translate(-5, includeLip ? 0 : 5));
    let topProfile = shiftedShape
      .translate(CLEARANCE / 2, 0)
      .intersect(drawRoundedRectangle(10, 10).translate(-5, 0));
    if (includeLip) {
      topProfile = topProfile.cut(drawRoundedRectangle(1.2, 10).translate(-0.6, -5));
    }
    return topProfile.sketchOnPlane(basePlane) as Sketch;
  };
  const boxSketch = drawRoundedRectangle(
    cols * pitchMm - CLEARANCE,
    rows * pitchMm - CLEARANCE,
    CORNER_RADIUS,
  ).sketchOnPlane() as Sketch;
  return boxSketch.sweepSketch(topShape, { withContact: true }).fillet(TOP_FILLET, (e) =>
    e.inBox(
      [-cols * pitchMm, -rows * pitchMm, SOCKET_HEIGHT],
      [cols * pitchMm, rows * pitchMm, SOCKET_HEIGHT - 1],
    ),
  );
}

/** Build the Gridfinity bin solid (tiled feet + body + stacking lip). */
export function makeBin(params: BinParams): Shape3D {
  const { cols, rows, heightUnits, pitchMm = DEFAULT_PITCH_MM, includeLip = true } = params;
  assertPitch(pitchMm);

  const stdHeight = heightUnits * HEIGHT_UNIT_MM;
  let box = drawRoundedRectangle(cols * pitchMm - CLEARANCE, rows * pitchMm - CLEARANCE, CORNER_RADIUS)
    .sketchOnPlane()
    .extrude(stdHeight) as Shape3D;
  box = box.shell(WALL, (f) => f.inPlane('XY', stdHeight));

  const top = buildTopShape(pitchMm, cols, rows, includeLip).translateZ(stdHeight);

  let base: Shape3D | null = null;
  for (const socket of cloneOnGrid(buildSocket(pitchMm), pitchMm, cols, rows)) {
    base = base ? base.fuse(socket, { optimisation: 'commonFace' }) : socket;
  }
  if (!base) throw new Error('bin must have at least one cell');

  return base.fuse(box, { optimisation: 'commonFace' }).fuse(top, { optimisation: 'commonFace' });
}
