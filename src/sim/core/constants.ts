// The one constants module (MASTER 2.4). Values are CODATA 2022 recommended
// values unless noted; the 2019 SI redefinition fixed several exactly.
// Source: CODATA Internationally recommended 2022 values of the fundamental
// physical constants, NIST SP 961 (2024), https://physics.nist.gov/cuu/Constants/
// Each entry: value, unit, source.

export const CONSTANTS = {
  /** Speed of light in vacuum, m/s. Exact (SI definition). */
  c: 299792458,
  /** Newtonian constant of gravitation, m^3 kg^-1 s^-2. CODATA 2022, u_r = 2.2e-5. */
  G: 6.6743e-11,
  /** Planck constant, J s. Exact (SI 2019). */
  h: 6.62607015e-34,
  /** Elementary charge, C. Exact (SI 2019). */
  e: 1.602176634e-19,
  /** Boltzmann constant, J/K. Exact (SI 2019). */
  kB: 1.380649e-23,
  /** Avogadro constant, mol^-1. Exact (SI 2019). */
  NA: 6.02214076e23,
  /** Molar gas constant, J mol^-1 K^-1. Exact (NA * kB). */
  R: 8.31446261815324,
  /** Stefan-Boltzmann constant, W m^-2 K^-4. Exact in SI 2019 (derived), CODATA 2022: 5.670374419e-8. */
  sigmaSB: 5.670374419e-8,
  /** Vacuum magnetic permeability, N A^-2. CODATA 2022, u_r = 1.6e-10. */
  mu0: 1.25663706127e-6,
  /** Vacuum electric permittivity, F/m. CODATA 2022, u_r = 1.6e-10. */
  epsilon0: 8.8541878188e-12,
  /** Standard acceleration of gravity, m/s^2. Exact by convention (CGPM 1901, ISO 80000-3). */
  g0: 9.80665,
  /** Standard atmosphere, Pa. Exact by definition (ISO 2533). */
  atm: 101325,
  /** Zero of the Celsius scale in kelvin. Exact by definition. */
  T0C: 273.15,
  /** Scene reference temperature for the energy ledger, K (MASTER 5.7). 20 degrees C. */
  TRef: 293.15,
} as const;

export type ConstantName = keyof typeof CONSTANTS;
