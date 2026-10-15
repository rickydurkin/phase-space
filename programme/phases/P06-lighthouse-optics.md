# P06 - Light: The Lighthouse

Programme v1.0.0. Prerequisite: P05 gate closed. Typical length: 4 to 7 sessions.

## Goal

Add gameplay optics: beams that reflect, refract, disperse and get absorbed, heat what they hit, and drive photocells and solar panels. Then make light the visual star of the game: caustics, spectral colour, volumetric beams and a path-traced photo mode. With this phase, six of the seven core domains are coupled; sound joins as an energy carrier in P8.

## What Ricky can do at the end

Light a fuse with a lens and the sun, carry a laser through a curved acrylic rod by total internal reflection, make a rainbow at the right angle, cook in a solar oven, measure the speed of light with Fizeau's toothed wheel, and take a path-traced photo of the result.

## Read first

- MASTER Part A; sections 6.7, 9 and 10.1.
- RESEARCH-SNAPSHOT section 6 (rendering and path tracing).
- MISSION-CATALOGUE.md R5.

## Work packages

### WP6.1 Optics engine

CPU beam tracing for sun, lamps, lasers and torches with exact intersections against analytic optical parts (spherical lens surfaces, planes, prisms, parabolic mirrors) and Rapier ray casts for other surfaces. The sun is an extended source 0.53° across, so focused spots have a real size; time of flight, where an instrument needs it (Fizeau's wheel, the rangefinder), comes from optical path length in closed form. Snell refraction, Fresnel reflectance, total internal reflection, dispersion with Cauchy or Sellmeier coefficients per material, Beer-Lambert absorption, coloured filters and Lambertian surfaces. Beam bundles carry power per wavelength. Deterministic and in the AS.

### WP6.2 Couplings

Absorbed power heats bodies (thermal), irradiance drives solar cells and photodiodes (circuits), lamps and lasers are powered by circuits, hot bodies emit light (incandescence feeds optics), and moving mirrors and lenses follow mechanics.

### WP6.3 Optical parts

Convex and concave lenses (focal length from radius and material), plane, concave and parabolic mirrors, prisms, beam splitters, filters, fibres and light pipes, lasers by wavelength, lamps, solar panels and light meters. Stretch goal: polarisers and Brewster's angle with Malus's law (bench O8, Malus within 0.5%; O9, Brewster angle within 0.1°).

### WP6.4 Light visuals

Volumetric beams; GPU caustics (photon splatting seeded from the AS beam set plus rendering-only extra rays); spectral colour for dispersion; the cardioid caustic in a mug as a test scene; heat shimmer bending beams visually where the air is hot.

### WP6.5 Photo mode

three-gpu-pathtracer's WebGPU path tracer with denoising: pause, frame, accumulate, denoise, save PNG at up to 8K, with physical camera settings (exposure, aperture, focal length). The scene state is the paused AS state, so a photo can be retaken from a replay.

### WP6.6 Instruments

Spectrometer, light meter, laser rangefinder, and a beam-path view showing every bounce with angles and power.

### WP6.7 The Lighthouse realm

A coastal lighthouse with a lamp room, a cliff-top solar field, an optics lab and a harbour at night. Ten missions, R5-01 to R5-10. Three Daily templates (DT-R5-a to DT-R5-c). Codex entries for optical phenomena.

## Benches

O1 to O7 (MASTER 6.7) and, if the stretch goal is done, O8 and O9. Coupling bench: absorbed optical power equals the heating rate within 2% (O7).

## Missions and content

R5-01 to R5-10 (R5-08b Corner Cube replaces R5-08 if the polarisation stretch goal is not built), DT-R5-a to DT-R5-c, at least 12 codex entries. Lab presets: burning glass, rainbow drop, fibre, solar oven, Fizeau wheel, mug caustic.

## Gate

- [ ] Benches O1 to O7 (and O8, O9 if built) pass.
- [ ] missions:verify passes for R5, and the Daily manifest covers the R5 templates.
- [ ] All six domains built so far (mechanics, thermal and air, fluids, circuits, fields, optics) appear together in one golden replay (a Chain Reaction prototype scene) with a clean ledger.
- [ ] RS5 Lighthouse meets the Ultra budget on the M4 Max; photo mode produces a denoised 4K still within 60 s.
- [ ] Regression (automated items of earlier gates) and zero console errors.

## Ricky's playtest (25 minutes)

1. Play Burning Glass, Laser Lock and Rainbow Machine.
2. Build a Chain Reaction prototype in The Lab using all six domains built so far.
3. Take three photo-mode shots you would be happy to share.

## Out of scope

Wave optics (interference, diffraction) beyond a codex illustration; relativistic optics (P12).

## Risks and mitigations

- Beam explosion with many surfaces: cap bounces and split depth per scene, report clipped power in the ledger as "light not traced", never silently.
- Caustic noise: temporal accumulation tied to sim time; reduce at lower tiers.

## Stop and ask Ricky if

Photo mode needs a different renderer to reach the quality he wants.
