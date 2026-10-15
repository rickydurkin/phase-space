// Branded SI unit types for module boundaries (MASTER 2.4). At runtime these
// are plain numbers; the brands exist only in the type system, so there is no
// cost and no risk to determinism.

declare const unitBrand: unique symbol;
type Unit<Name extends string> = number & { readonly [unitBrand]: Name };

export type Seconds = Unit<'s'>;
export type Metres = Unit<'m'>;
export type Kilograms = Unit<'kg'>;
export type Kelvin = Unit<'K'>;
export type Newtons = Unit<'N'>;
export type Joules = Unit<'J'>;
export type Watts = Unit<'W'>;
export type MetresPerSecond = Unit<'m/s'>;
export type MetresPerSecondSquared = Unit<'m/s^2'>;
export type RadiansPerSecond = Unit<'rad/s'>;
export type Radians = Unit<'rad'>;
export type Pascals = Unit<'Pa'>;
export type KilogramsPerCubicMetre = Unit<'kg/m^3'>;

export const seconds = (x: number): Seconds => x as Seconds;
export const metres = (x: number): Metres => x as Metres;
export const kilograms = (x: number): Kilograms => x as Kilograms;
export const kelvin = (x: number): Kelvin => x as Kelvin;
export const newtons = (x: number): Newtons => x as Newtons;
export const joules = (x: number): Joules => x as Joules;
export const watts = (x: number): Watts => x as Watts;
export const metresPerSecond = (x: number): MetresPerSecond => x as MetresPerSecond;
export const metresPerSecondSquared = (x: number): MetresPerSecondSquared =>
  x as MetresPerSecondSquared;
export const radiansPerSecond = (x: number): RadiansPerSecond => x as RadiansPerSecond;
export const radians = (x: number): Radians => x as Radians;
export const pascals = (x: number): Pascals => x as Pascals;
export const kilogramsPerCubicMetre = (x: number): KilogramsPerCubicMetre =>
  x as KilogramsPerCubicMetre;

/** Celsius to kelvin (display helper; the simulation stores kelvin). */
export const celsiusToKelvin = (c: number): Kelvin => (c + 273.15) as Kelvin;
export const kelvinToCelsius = (k: Kelvin): number => k - 273.15;
