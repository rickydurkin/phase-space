# Mission catalogue (seed list)

Programme v1.0.0, 14/10/2026. This is the seed list for First Principles, the Forensics Bureau, Chain Reaction, the Daily Experiment and Constants Run. Every mission names its principle, the approach that works and the trap (the misconception it is designed to catch). The builder turns each row into data, computes the numbers, records reference and trap replays, and proves necessity with missions:verify (MASTER section 7.6). Numbers given here are starting points: tune them until check 9 (signal at least five times the models' combined tolerance, with margins on every threshold) and the guessing-bot checks pass. Predict and One-Shot missions draw fresh inputs on every attempt (drop heights, densities, liquids, planets), so a remembered answer never carries over. Where a mission needs a model that arrives in a later phase, the row says which phase it ships in.

Modes: Build, Predict, One-Shot, Investigate, Control, Optimise, Futures, Discover (MASTER 7.2). Star 1 is always the objective; star 3 is always insight (MASTER 7.4); the table gives the star 2 metric.

## R1 The Workshop (mechanics)

A Victorian-style workshop with a ramp hall, a vacuum chamber, a zero-gravity bay and an outdoor yard for launches.

| ID | Title | Mode | Principle | Approach that works | Trap | Star 2 |
|---|---|---|---|---|---|---|
| R1-01 | Feather and Hammer | Predict | free fall does not depend on mass; drag does | In the vacuum chamber both land together; in air the feather lags | Heavier things fall faster in a vacuum | Fall time from a drop height drawn per attempt (1.5 to 4 m) within 3% |
| R1-02 | The Long Lever | Build | moments | Place the fulcrum so the counterweight's moment beats the anvil's, counting the plank's own weight | Fulcrum in the middle, or the longest plank always wins | Least plank mass |
| R1-03 | Galileo's Ramp | Predict | rotational inertia: a = g sin(theta) / (1 + I/(m r^2)) | Solid sphere, then hollow sphere, then hoop (about 9% apart in time), whatever their mass or size; ramp angle drawn per attempt | The heavier or bigger object wins, or all tie | Solid sphere's time within 3% |
| R1-04 | Egg Drop | Build | impulse and stopping distance | Crushable stroke of at least 15 cm with near-constant force (6 m drop, 40 g limit) | A rigid steel box is the strongest protection | Least package mass |
| R1-05 | Over the Wall | One-Shot | projectile motion has two angles for one range | At 20 m/s to a bay 30 m away, the low arc (23.7°) hits the 6 m wall at 20 m; the high arc (66.3°) clears it | 45° is always right (it lands 10.8 m long) | Within 0.3 m of the bay centre |
| R1-06 | Seconds Pendulum | Build | T = 2 pi sqrt(L/g), independent of mass; longer at large amplitude | Length 0.994 m and a small swing (objective: period within 1% of 2.000 s) | A heavier bob ticks slower; amplitude does not matter (at 40° the period is 3.1% long) | Period error under 0.4% |
| R1-07 | Newton's Debt | Investigate | conservation of momentum (elastic collision) | Time the balls through gates: m2 = m1 (u1 - v1) / v2 | Assume equal masses | Hidden mass within 2% |
| R1-08 | Loop the Loop | One-Shot | energy including rotation, centripetal condition | h_min = 2.7 R for a rolling solid ball; the rig demands a release no more than 4% above the true minimum | h = 2 R, or 2.5 R (ignores rolling energy) | Within 3% above minimum |
| R1-09 | Curling Stone | One-Shot (one test slide) | friction deceleration: d = v^2 / (2 mu g) | Find mu from the test slide, then scale speed with the square root of distance | Distance is proportional to speed | Stop within 0.25 m of the button |
| R1-10 | Pumpkin Trebuchet | Optimise | energy conversion and release timing | Arm ratio, sling length and release angle tuned together | Release as late as possible; more counterweight always wins | Least counterweight for 50 m |
| R1-11 | The Spinning Handle | Discover | intermediate-axis theorem (Dzhanibekov effect) | Spin a T-handle about its middle axis in zero gravity | Spin about any axis is stable | Five flips in 30 s |
| R1-12 | Domino Amplifier | Futures | stored potential energy; each domino can topple one about 1.5 times larger (Whitehead, 1983) | Grow by no more than about 1.5 times per step | Bigger jumps save dominoes | Fewest dominoes to topple a 1 m domino in 95% of 50 jittered runs |

## R2 The Foundry (heat, phase change, fire)

A foundry with a furnace, crucibles, moulds, a quench tank, a kiln, a canteen and winter sun through tall windows.

| ID | Title | Mode | Principle | Approach that works | Trap | Star 2 |
|---|---|---|---|---|---|---|
| R2-01 | Milk First? | Predict | Newton's law of cooling: hotter objects lose heat faster | Add the milk at the end; the hotter tea loses more heat first, so it ends cooler (tune volumes so the gap is at least 3 °C) | The order does not matter | Final difference within 0.5 °C |
| R2-02 | The Shiny Kettle | Investigate | emissivity and apparent temperature | Put high-emissivity tape on each kettle, or use a thermocouple, before trusting the camera | Trust the camera on polished metal | Hotter kettle and its temperature within 2 °C |
| R2-03 | Bimetal Alarm | Build | differential thermal expansion | Choose strip length and contact gap so it closes at 60 °C | Any heated metal strip bends | Trigger within 1 °C |
| R2-04 | Ice Bridge | Build | conduction, convection, radiation and latent heat | Low-conductivity layers with a reflective outer face and an air gap | Black cloth, or foil buried inside the insulation | Least insulation mass for 10 minutes |
| R2-05 | Cast It | Build and Predict | sensible plus latent heat, and losses | Fuel for m (c dT + L) plus losses; pour above the liquidus (0D mould-fill model in P3) | Ignore latent heat: the fuel runs out at the melting point | Under 10% fuel left over |
| R2-06 | Leidenfrost Drops (ships in P4) | Predict | a vapour layer insulates drops above the Leidenfrost point | The drop on the 250 °C pan outlives the one on the 150 °C pan | A hotter pan always boils water off faster | Survival ratio within 30% |
| R2-07 | Draught Dodger | Optimise | U-values, ventilation losses, convection | Insulate the loft, seal draughts, put the heater under the window | A bigger heater is the answer | Least kWh for a January night at 20 °C |
| R2-08 | Chip Pan Fire (ships in P4) | Control | the fire triangle; water sinks in oil and flashes to steam | Turn the heat off and cover the pan or use a fire blanket | Throw water on it | Out with least damage |
| R2-09 | Hot Air Balloon | One-Shot | buoyancy from density difference, ideal gas law in kelvin | Find the envelope temperature for the lift needed, then the burner time | Use Celsius in the gas law; ignore cooling with altitude | Clear the 300 m ridge with least fuel |
| R2-10 | The Glowing Bar | Investigate | blackbody radiation; colour temperature; Draper point near 525 °C | Read the bar's colour with the two-colour pyrometer (the spectrometer arrives in P6) and allow for emissivity | Red-hot is hotter than white-hot | Temperature within 50 °C |

## R3 The Harbour (fluids and granular matter)

An estuary with a sea quay, a river wharf, a canal lock, a dam and reservoir, a beach and a boatyard.

| ID | Title | Mode | Principle | Approach that works | Trap | Star 2 |
|---|---|---|---|---|---|---|
| R3-01 | What Floats? | Predict | average density against the liquid's density | Compare each object with fresh water, sea water and oil | Heavy things sink (the steel bowl floats) | All 18 calls right |
| R3-02 | Steel Boat | Optimise | Archimedes' principle | A wide, shallow hull with enough freeboard | A deeper hull always carries more | Most cargo per kg of steel |
| R3-03 | Siphon Drain | Build | atmospheric pressure drives a siphon; the outlet must be below the source surface | Outlet below the basin's level; crest under about 10 m | A siphon lifts water over any height; the outlet height does not matter | Drained in least time |
| R3-04 | Lock Keeper | Control | communicating vessels; hydrostatic force on gates | Equalise levels with the paddles before opening the gates | Force a gate against a head of water | Least water used, no hull contact |
| R3-05 | Plimsoll Line | One-Shot | Archimedes; fresh water is less dense than sea water | Measure both waters and the empty barge; load by river density (MASTER Appendix B) | Size the load by sea density: 1.1 to 2.4 t too much, under 0.192 m of freeboard at the wharf | Cargo at least 98.5% of the safe maximum |
| R3-06 | Dam Break | Predict | dam-break front speed 2 sqrt(g h0) on a dry bed (Ritter) | Predict arrival at the village from reservoir depth | The front moves at sqrt(g h0), or at free-fall speed | Arrival time within 10% |
| R3-07 | Water Clock | Build | Torricelli: outflow slows as the head falls | Shape the vessel or mark a non-linear scale | Constant flow and evenly spaced marks | Timing error under 1% over 5 minutes |
| R3-08 | Hydro Power | Build | P = rho g Q h eta, minus pipe friction (Darcy-Weisbach) | A wide penstock, maximum head, matched turbine | A thinner pipe makes faster water and more power | Most shaft power above 2 kW |
| R3-09 | Sea Wall | Futures | angle of repose, erosion, wave run-up | A wide bank below the angle of repose faced with stones | A tall, steep wall | Survives in 90% of 30 seeded tides with least material |
| R3-10 | Bernoulli's Ball | Discover | a fast jet holds a ball (pressure and flow attachment) | Hover the ball in the jet, then tilt the jet | The jet pushes the ball away | Greatest stable tilt |

## R4 The Power House (electricity and magnetism)

A Victorian power house with a modern control room, a generator hall, a switchyard, a recycling line and a particle-physics corner.

| ID | Title | Mode | Principle | Approach that works | Trap | Star 2 |
|---|---|---|---|---|---|---|
| R4-01 | Dark Bulbs | Predict | current is conserved; series and parallel | Rank brightness from P = I^2 R with Kirchhoff's laws | Bulbs use up the current, so the first is brightest | Bulb C's power within 5% |
| R4-02 | Long Lead | Build | R = rho L / A and voltage drop | Pick a cross-section so the 12 V lamp 50 m away keeps 11.5 V | The thinnest wire saves copper at no cost | Least copper mass |
| R4-03 | Electromagnet Crane | Build | field from N and I; force falls steeply with the air gap | Turns and current within the wire's limit, iron core, near-zero gap | More turns of thinner wire always help; the gap does not matter | Least energy per lift |
| R4-04 | Slow Fall | Predict | eddy currents and Lenz's law | Copper slows the magnet most, then aluminium; plastic does nothing | Copper is not magnetic, so nothing happens | Copper fall time within 10% |
| R4-05 | Pedal Power | Control | generator EMF follows speed; torque follows current; gearing | A gear that holds 60 W at a sustainable cadence | The biggest gear is best | Least rider work for 60 s of light |
| R4-06 | Eddy Separator | Build | a spinning magnet drum repels conductors | Rotor speed and position so aluminium jumps to the far bin | A static magnet (only steel responds) | Purity of the aluminium bin |
| R4-07 | Hidden Cable | Investigate | Ampere's law: B = mu0 I / (2 pi r) | Measure the field change at two heights with the cable on and off; solve for depth and current | Assume a 1/r^2 fall-off | Current within 3%, depth within 2 cm |
| R4-08 | Cyclotron | Build | cyclotron frequency qB / (2 pi m) does not depend on radius | Match the RF frequency to the field and keep it fixed (relativistic Boris pusher; target 2 MeV) | Raise the frequency as the protons speed up | Least time to 2 MeV |
| R4-09 | Eddy Brake | Build | eddy damping is proportional to speed, so on a slope it gives a terminal speed rather than a hold | Magnets shed most of the speed; a friction brake holds the car on the final down-slope | Eddy brakes alone can stop and hold the car | Held stationary for 5 s within 20 m, least friction work |
| R4-10 | Power the Village | Optimise | line losses I^2 R; transformers | Step up for transmission, step down at the village | Send 230 V straight down a thick cable | Least losses for the budget |

## R5 The Lighthouse (optics)

A coastal lighthouse with a lamp room, a cliff-top solar field, an optics lab and a harbour at night.

| ID | Title | Mode | Principle | Approach that works | Trap | Star 2 |
|---|---|---|---|---|---|---|
| R5-01 | Mirror Maze | Build | law of reflection | Plan the path with equal angles at each mirror | Point each mirror at the target | Fewest mirrors |
| R5-02 | Laser Lock | Predict (two parts) | refraction; light paths are reversible; apparent depth | Aim the laser straight at the sensor's image; aim the straight pole below it | Correct the laser for refraction like a spear-fisher | Both parts right first time |
| R5-03 | Burning Glass | One-Shot | focusing, irradiance and heat balance | Fuse at the focal point from the lensmaker's equation, before the clouds return | Fuse at the radius of curvature; a bigger lens is always faster | Ignite in the first sunny window |
| R5-04 | Light Pipe | Build | total internal reflection; critical angle about 42° in acrylic | Gentle bends that keep rays above the critical angle | Any clear rod carries light round any bend | Most light delivered |
| R5-05 | Rainbow Machine | Predict | dispersion and one internal reflection; the bow angle follows the drops' refractive index | Each attempt sprays a different liquid (n from 1.33 to 1.50, so the bow sits between 42° and 23° from the antisolar point); find it from minimum deviation | Look towards the sun, or assume 42° for every liquid | Angle within 1° |
| R5-06 | Lighthouse Lens | Build | a source at the focus makes a parallel beam | Lamp at the focus of the lens array | More lamps instead of focusing | Intensity at 20 km |
| R5-07 | Solar Oven | Optimise | concentration, absorption, glazing that blocks thermal infrared | Black pot, reflectors, glazing, insulation | A white or shiny pot | Fastest to 120 °C |
| R5-08 | Glare Filter | Build (needs the P6 polarisation stretch) | Malus's law; Brewster's angle | Polariser aligned to block glare reflected near Brewster's angle | Tinted glass | Most glare removed for least signal loss |
| R5-08b | Corner Cube (fallback for R5-08) | Build | three mutually perpendicular mirrors return light to its source from any angle | Build a corner reflector so the moving ship's laser always returns | A flat mirror facing the ship | Return signal held for the whole pass |
| R5-09 | Fizeau's Wheel | Investigate | speed of light by time of flight: c = 4 d N f at first eclipse (closed-form time of flight, MASTER 5.3) | Find the wheel speed where returning light is first blocked | Light is instantaneous | c within 1% |
| R5-10 | Heliograph | Control | reflection geometry; sun tracking | Keep the mirror normal halfway between the sun and the moving ship | Point the mirror at the ship | Message with fewest dropped signals |

## R6 The Proving Ground (projectiles, sound, shock)

A test range with a sports pitch, a historical siege-engine field, a supersonic corridor over the sea, a glassware acoustics lab and a space-debris chamber. No human or animal targets, no real firearms (rule 2.12).

| ID | Title | Mode | Principle | Approach that works | Trap | Star 2 |
|---|---|---|---|---|---|---|
| R6-01 | Supply Drop | One-Shot | projectile motion with drag and wind; leading a moving target | Measure wind and drag, solve or calibrate on the test range, lead the barge | The vacuum range formula | Within 1 m of the deck centre |
| R6-02 | Banana Kick | One-Shot | Magnus force; drag crisis | Spin axis and rate that bend the ball round the wall | Wrong spin sense, or aim at the post with no spin | Clears the wall by 1 m or more |
| R6-03 | Flash to Bang | Investigate | the speed of sound depends on temperature | Time the gap at two microphones and correct c for the cold night (325 m/s at -10 °C) | Always use 340 m/s | Distance within 2% |
| R6-04 | Boom Triangulation | Investigate | Mach cone geometry; arrival-time differences | Spread three microphones and solve for track and Mach number | The boom comes from where the jet is when you hear it | Track error under 100 m |
| R6-05 | Glass Harp | Control | resonance; frequency depends on size and fill | Sweep slowly and hold the red glass's frequency | Louder is better | Only the target glass breaks, least energy |
| R6-06 | Hailstorm | Futures | terminal velocity and impact energy of hail | Angled netting and layered glazing sized to the hail distribution | One thicker pane is enough | Survives 95% of 50 storms at least cost |
| R6-07 | Whipple Shield | Build | hypervelocity break-up; spaced shielding | A thin bumper well ahead of the wall turns debris into a spreading cloud | One thick plate beats two thin ones | Least areal mass that stops 7 km/s debris |
| R6-08 | Boom Corridor | Control | boom carpet width depends on altitude and Mach number | Choose altitude and speed so the carpet misses the village | Fly low to keep the boom small | On time, no boom over the village |

## R7 The Test Track (vehicles)

A UK-style test circuit with a skid pan, a braking straight, a wet section and a crash lab. Speeds in mph.

| ID | Title | Mode | Principle | Approach that works | Trap | Star 2 |
|---|---|---|---|---|---|---|
| R7-01 | Brake Bias | Optimise | weight transfer under braking | Bias forward to match each axle's dynamic load | 50/50, or more rear for stability | Shortest stop from 70 mph, ABS off |
| R7-02 | Skid Mark Inquest | Investigate | v = sqrt(2 mu g d) | Find mu with a test skid, measure the marks, compute the speed | Dry-road mu on a wet road | Speed within 3%, and the 30 mph verdict |
| R7-03 | Crumple Zone | Build | impulse; energy absorption over a stroke | Near-constant crush force over the available 60 cm | Stiffer is safer | Lowest HIC at 35 mph |
| R7-04 | Wet Line | Control | grip varies with surface and water depth | Leave the rubbered racing line and brake earlier | Use the dry line | Lap time |
| R7-05 | Downforce Dilemma | Build | drag against downforce | Wing angle balanced for this track's corners and straights | Maximum downforce everywhere | Lap time |
| R7-06 | Cold Tyres | Predict | tyre temperature and grip | Predict the first-lap time loss | No difference | Within 0.3 s |

## R8 The Warehouse (materials handling)

A racking warehouse with narrow aisles, a yard with ramps and a loading bank, a tilt table and a timber store. Trucks are generic, with no brands.

| ID | Title | Mode | Principle | Approach that works | Trap | Star 2 |
|---|---|---|---|---|---|---|
| R8-01 | Capacity Plate | Predict | load moment about the front axle | Moment balance including the axle-to-fork distance | Same capacity at any load centre (and a half-trap: capacity x load centre constant, which ignores the axle distance) | Capacity within 2% |
| R8-02 | Narrow Aisle Put-away | Control | dynamic stability with a raised load | Travel low, slow before turning, raise only when stopped | Full speed with the load up | Par time, no penalties |
| R8-03 | Over the Bank | Control | stability on gradients | Load facing uphill on the ramp, both ways | Drive down forwards with the load downhill | No wheel lift, par time |
| R8-04 | Long Loads | Build and Control | lateral stability and truck layout | Carry 12 m timber lengthways on a sideloader | Long loads sideways on a counterbalance truck | Par time, no strikes |
| R8-05 | Tilt Test | Investigate and Build | stability polygon; centre-of-gravity height | Measure the tipping angles, then add the least counterweight that passes all four tests | Add counterweight until it feels stable | Least counterweight that passes |
| R8-06 | Pipes in the Wind | Futures | wind load on a raised load; stability margin | Keep the load low, turn into the wind, plan the route | Ignore the wind | Delivered in 95% of 50 gust seeds |

## R9 Fault Line (structures and vibration)

A city block on a giant shake table, a footbridge over a river and a coastal tower in the wind.

| ID | Title | Mode | Principle | Approach that works | Trap | Star 2 |
|---|---|---|---|---|---|---|
| R9-01 | Resonance Trap | Predict | resonance between building period and ground motion | Estimate periods (about 0.1 s per storey) and compare with the 1 s motion | The tallest building suffers most | Peak drift within 15% |
| R9-02 | Tuned Mass Damper | Build | Den Hartog tuning | Tune frequency and damping to the first mode | The heaviest damper is best | 70% less sway with least damper mass |
| R9-03 | Base Isolation | Build | lengthening the period | Bearings of the right stiffness plus a moat | Make the building stiffer | Immediate occupancy at least cost |
| R9-04 | Soft Storey | Investigate | drift concentrates in a weak storey | Read the drift records, strengthen the weak storey | Strengthen the top floor, where sway is largest | Right storey, drift below the limit |
| R9-05 | Wobbly Bridge | Build | synchronous lateral excitation (London Millennium Bridge, 2000) | Dampers tuned to the lateral mode | Stiffen the deck vertically | Crowd crossing within the comfort limit |
| R9-06 | Flutter | Discover | aeroelastic flutter (model badged Plausible) | Raise the wind to flutter, then reshape the deck as an aerofoil or stiffen it in torsion | Add weight | Highest flutter speed per tonne |

## R10 Launch Complex and Orbit

A coastal launch site, a test stand, low orbit, the Moon's neighbourhood and a near-Earth asteroid.

| ID | Title | Mode | Principle | Approach that works | Trap | Star 2 |
|---|---|---|---|---|---|---|
| R10-01 | Nozzle Match | Build | expansion ratio; exit against ambient pressure; separation | The ratio with the best average thrust from 0 to 30 km without separating at sea level | The biggest bell is always best | Highest average thrust |
| R10-02 | Staging | Optimise | Tsiolkovsky rocket equation | Two or three stages with the right mass split | One huge stage | Least launch mass to orbit |
| R10-03 | Rendezvous | Control | to catch up in orbit, slow down | Burn retrograde to drop into a lower, faster orbit, then raise it | Burn towards the target | Within 10 m with least delta-v |
| R10-04 | Hohmann Ferry | One-Shot | Hohmann transfer | Two burns, at the right times and sizes | Point at the target orbit and burn | Arrive within 1 km with fuel left |
| R10-05 | Slingshot | One-Shot | gravity assist | Time the flyby so the planet's motion adds energy | Fly straight with more fuel | Reach the outer marker on the fuel given |
| R10-06 | Planetary Defence | Build | momentum transfer (DART's beta about 3.6); lead time | Hit early: a small change years ahead moves the arrival point far | Hit late with a bigger impactor | Miss by 3 Earth radii with least impactor mass |
| R10-07 | Re-entry Corridor | One-Shot | drag deceleration and heating | A flight-path angle inside the corridor | Steeper is safer | Peak g and heating within limits |
| R10-08 | Lagrange Parking | Control | L1 is unstable; station keeping | Small regular corrections | Park and wait | Within 1,000 km for 30 days, least fuel |
| R10-09 | Mercury's Secret | Investigate (Model Ladder) | perihelion precession; first post-Newtonian correction | Measure the precession and show which model explains the extra 43 arcseconds per century | Newtonian N-body explains it all | Cheapest adequate model |
| R10-10 | Stationary Orbit | Predict | Kepler's third law; the sidereal day | Each attempt picks a planet; use its sidereal day (Earth 23 h 56 min: 42,164 km; Mars 24 h 37 min: 20,428 km) | Use the solar day (77 km too high at Earth, 20 km at Mars) | Radius within 5 km |

## R11 Other Worlds

The same physics with real planetary data. Each mission is a familiar task made new.

| ID | Title | Mode | Principle | Approach that works | Trap | Star 2 |
|---|---|---|---|---|---|---|
| R11-01 | Moon Golf | One-Shot | projectile motion with no air, g = 1.62 m/s^2 | Vacuum range formula with lunar gravity; 45° is optimal here | Earth habits: a low drive with backspin lift | Fewest strokes |
| R11-02 | Titan Wings | Build and Control | lift scales with air density; Titan's air is about 4.4 times denser than Earth's and gravity is 0.14 g | Size wings for dense air and low gravity; human power is enough | Earth-sized wings and power | 1 km flight with least wing area |
| R11-03 | Mars Siphon | Predict | siphon height is limited by air pressure; below water's triple point (611.7 Pa) liquid water cannot persist | At about 600 Pa the water boils and freezes at once, so the siphon never primes | It works as on Earth, or lifts the 16 cm that 600 Pa would support | Correct outcome and reason |
| R11-04 | Venus Balloon | Build | buoyancy in a CO2 atmosphere | Breathable air lifts in CO2: float a habitat at 50 to 55 km | You need helium | Most payload |
| R11-05 | Europa Drill | Build | conduction and latent heat at 100 K | Insulate the probe's sides, heat the nose, budget for warming ice from 100 K | Melting only needs the latent heat | 20 m depth with least energy |
| R11-06 | Asteroid Hop | Control | escape velocity on a small body (about 1 m/s for a 1 km rock) | Push off below escape speed | A normal jump | Reach the far crater without leaving |
| R11-07 | Mars Parachute | One-Shot | drag needs air; terminal velocity | Size the parachute for thin air and add retro-rockets | An Earth-sized parachute | Land under 3 m/s with least mass |
| R11-08 | Heavy-World Clock | Build | pendulum period scales with 1/sqrt(g) | For the same period at 1.8 g, lengthen the pendulum 1.8 times (0.994 m becomes 1.789 m); objective within 1% | Keep Earth's length, shorten it, or change the bob mass | Period error under 0.4% |

## Forensics Bureau (P7)

Each case draws a hidden truth from a seeded distribution, simulates it in the AS to make the evidence, and grades the player's answer and method.

| ID | Case | Physics | Trap | Graded on |
|---|---|---|---|---|
| FB-01 | Junction Collision | 2D momentum conservation plus post-impact skids | Use kinetic-energy conservation in an inelastic crash; ignore one car | Both pre-impact speeds within 5% |
| FB-02 | Fallen Pallet | free fall, impact, friction | It fell straight down from a stationary truck | Drop height within 10 cm; was the truck moving |
| FB-03 | Workshop Fire | combustion, heat transfer, char rates, ventilation | The most burnt area is the origin | Origin within 1 m, and the fuel |
| FB-04 | Broken Greenhouse | projectile motion, fracture of glass | The football travelled in a straight line | Speed within 10%, launch point within 2 m |
| FB-05 | Flood Marks | open-channel flow (Manning), continuity | Use the normal water level | Peak flow within 10% |
| FB-06 | Blackout | Kirchhoff's laws | Replace the part nearest the fault light | Right component first time |
| FB-07 | The Swaying Bridge | modal analysis, resonance | Wind is always the cause | Source and frequency within 2% |
| FB-08 | Meteorite Field (ships in P10 with the entry models) | entry ballistics, ablation, crater scaling | The biggest crater marks the start of the strewn field (big fragments travel furthest) | Entry angle within 5°, energy within 30% |

## Chain Reaction (P7)

Score = base x 1.5^(k - 1) x efficiency, where k is the number of distinct domains the causal chain passes through and efficiency is the energy delivered to the goal over the energy released from the declared sources (MASTER section 8).

| ID | Puzzle | Trigger | Goal | Minimum domains |
|---|---|---|---|---|
| CR-01 | Ring the Bell | a marble drop | the bell rings | 3 |
| CR-02 | Sunrise Tea | first sunlight on a sensor | tea poured into the cup | 4 |
| CR-03 | Ice Age | a melting ice block | a paper glider launches | 4 |
| CR-04 | The Long Way Round (ships in P8, once sound can carry energy) | a pendulum release | the lighthouse lamp lights | 7 |
| CR-05 | Free Chain | any | any | scored by the formula |

## Daily Experiment templates

| ID | Template | Mode |
|---|---|---|
| DT-R1-a | Launch to target | One-Shot |
| DT-R1-b | Pendulum to time | Build |
| DT-R1-c | Momentum inquest | Investigate |
| DT-R2-a | Heat to threshold | One-Shot |
| DT-R2-b | Cooling race | Predict |
| DT-R2-c | Insulate to survive | Build |
| DT-R3-a | Float the load | One-Shot |
| DT-R3-b | Drain the tank | Build |
| DT-R3-c | Flood arrival time | Predict |
| DT-R4-a | Power the load | Build |
| DT-R4-b | Steer with a field | One-Shot |
| DT-R4-c | Find the fault | Investigate |
| DT-R5-a | Route the beam | Build |
| DT-R5-b | Focus to ignite | One-Shot |
| DT-R5-c | Predict the angle | Predict |
| DT-R6-a | Lob to target with wind | One-Shot |
| DT-R6-b | Range by sound | Investigate |
| DT-R6-c | Bend it | One-Shot |
| DT-R7-a | Stop in the box | One-Shot |
| DT-R7-b | Skid inquest | Investigate |
| DT-R8-a | Capacity at a load centre | Predict |
| DT-R8-b | Ramp route | Control |
| DT-R9-a | Tune the damper | Build |
| DT-R9-b | Rank the buildings | Predict |
| DT-R10-a | Transfer window | One-Shot |
| DT-R10-b | Re-entry angle | One-Shot |
| DT-R11-a | Same task, other world | any |
| DT-R11-b | Escape or stay | Control |

## Constants Run: Law cards (P7)

| ID | Card | Change | Badge |
|---|---|---|---|
| LC-01 | Moon Gravity | g = 1.62 m/s^2 | Real (a real place) |
| LC-02 | Super-Earth | g x 1.8 | Plausible |
| LC-03 | Thin Air | Mars surface air | Real |
| LC-04 | Thick Air | Titan surface air | Real |
| LC-05 | Slippery World | friction x 0.2 | Plausible |
| LC-06 | Sticky World | friction x 2 | Exaggerated |
| LC-07 | Slow Sound | speed of sound 34 m/s | Impossible |
| LC-08 | Weak Magnets | remanence x 0.3 | Exaggerated |
| LC-09 | Super Magnets | remanence x 5 | Impossible |
| LC-10 | Bitter Cold | ambient -60 °C | Real |
| LC-11 | Heatwave | ambient 45 °C | Real |
| LC-12 | Brittle Age | every material brittle | Exaggerated |
| LC-13 | Bouncy World | restitution 0.95 | Exaggerated |
| LC-14 | Dead Sea | water density 1,240 kg/m^3 | Real |
| LC-15 | Bright Sun | irradiance 2,600 W/m^2 (Venus's orbit) | Real |
| LC-16 | Dim Sun | irradiance 590 W/m^2 (Mars's orbit) | Real |
| LC-17 | Fast Spin | Coriolis x 100 | Impossible |
| LC-18 | Honey Water | water viscosity x 1,000 | Exaggerated |
| LC-19 | Perfect Copper | copper resistivity x 0.1 | Impossible |
| LC-20 | Tough Glass | glass strength x 10 | Exaggerated |

## Phenomena Codex seed list

Mechanics: free fall independent of mass; terminal velocity; the falling slinky (the bottom hangs still until the wave arrives); recoil on a trolley; the rolling race; Newton's cradle; conservation of angular momentum; the Dzhanibekov effect; gyroscopic precession; Euler's disk; domino amplification; centre of percussion (the sweet spot); simple harmonic motion; large-amplitude pendulum; Coriolis deflection; the Foucault pendulum; the Magnus effect; the drag crisis; the chain fountain; stick-slip; the safety parabola of projectiles.

Heat: Newton cooling; the latent-heat plateau; the Leidenfrost effect; the emissivity illusion; blackbody glow and the Draper point; convection cells; thermal-expansion buckling (the summer rail kink); bimetal bending; boiling point against pressure; the fire triangle; smoke layering; heat shimmer and mirages.

Fluids: Archimedes' principle; the hydrostatic paradox; the siphon; Torricelli's law; communicating vessels; the jet-held ball; the dam-break wave; the hydraulic jump; the angle of repose; the Cartesian diver; seiches.

Electricity and magnetism: Lenz's law; eddy-current braking; Faraday induction; the motor effect; Ampere's law at a compass; electromagnet saturation; the Curie point; cyclotron motion; the transformer; Joule heating; series against parallel.

Light: the law of reflection; Snell refraction; total internal reflection; dispersion and the 42° rainbow; apparent depth; the burning glass; the coffee-cup caustic; Brewster's angle; Malus's law; the speed of light by Fizeau's wheel.

Sound and shock: the Doppler shift; the sonic boom; the Mach cone; flash to bang; resonance shattering; beats; standing waves.

Orbits: Kepler's third law; the Hohmann transfer; the gravity assist; L4 and L5 stability; the Roche limit; perihelion precession; escape velocity; slowing down to catch up.

Across domains: the thermoelectric generator; the solar furnace; the steam engine; the hot-air balloon; induction heating; photovoltaic power; re-entry heating; the blast wave.
