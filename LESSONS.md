# Accident Lab: lessons

> Educational project. In a real emergency, call 911 / 112 / 999 first. Surgical sections explain what trained hospital teams do; they are not instructions.

## The trauma surgeon's first 10 minutes: X-ABCDE

Every scenario below lands in the same primary survey, done in this order because this is the order things kill you:

- **X**: eXsanguinating haemorrhage: stop massive bleeding first (pressure, tourniquet)
- **A**: Airway with cervical-spine protection
- **B**: Breathing: look, listen, feel. Tension pneumothorax? Flail chest?
- **C**: Circulation: pulse, BP, bleeding sources (chest, abdomen, pelvis, long bones, floor)
- **D**: Disability: GCS, pupils, glucose
- **E**: Exposure: undress fully, look everywhere, then keep the patient WARM

## Pedestrian struck by a car

### Assumptions

- `speed_kmh` = 50
- `car_mass_kg` = 1500
- `ped_mass_kg` = 75
- `brake_friction` = 0.8
- `body_road_friction` = 0.7
- `reaction_time_s` = 1.5

### Physics and engineering

| Quantity | Value | How |
|---|---|---|
| Car speed | **13.89 m/s** | 50 km/h / 3.6 |
| Car kinetic energy | **145 kJ** | KE = ½mv². Energy goes up with the square of speed |
| Pedestrian speed after impact | **13.23 m/s** | Momentum conservation: v = m_car·v0 / (m_car + m_ped) |
| Bumper force on lower leg | **9.26 kN** | F = mΔv/Δt with 10 kg leg, 15 ms. Tibia breaks at ~4 kN |
| Head vs windscreen: deceleration | **96.35 g** | a = v²/2d, head at 0.7·v0, 5 cm glass deflection |
| Head vs windscreen: HIC | **937 ** | HIC > 1000 means a high risk of serious brain injury |
| Head vs road: HIC | **598 ** | 1 cm stopping distance on asphalt. The secondary impact often kills |
| Throw distance | **12.59 m** | air 7.0 m + slide 5.6 m (μ = 0.7) |
| Stopping distance if seen 1.5 s earlier | **33.12 m** | d = v·t_react + v²/(2μg) |
| Fatality risk at this speed | **8.32 %** | Logistic fit to real crash data (Rosén & Sander 2009) |

**Speed matters**

| km/h | Car KE (kJ) | Stopping dist (m) | Windscreen HIC | Fatality risk |
|---|---|---|---|---|
| 20 | 23.1 | 10.3 | 24 | 1% |
| 30 | 52.1 | 16.9 | 121 | 1% |
| 40 | 92.6 | 24.5 | 384 | 4% |
| 50 | 144.7 | 33.1 | 937 | 8% |
| 60 | 208.3 | 42.7 | 1944 | 18% |
| 70 | 283.6 | 53.3 | 3601 | 35% |
| 80 | 370.4 | 64.8 | 6143 | 57% |

### How the body gets hurt

- Bumper hits the leg at knee height: tibia/fibula fractures, knee ligament tears (the 'bumper fracture').
- Bonnet hits the hip and pelvis: pelvic ring fractures can bleed 2–3 litres, unseen.
- Head and chest wrap onto the bonnet and windscreen: traumatic brain injury, rib fractures, lung contusion.
- Secondary impact on the road: often the worst head injury, plus spine injury.
- Adults often show 'Waddell's triad': femur/tibia fracture + chest/abdominal injury + head injury.

### Prevention

- Speed is the biggest lever: fatality risk climbs steeply above 40 km/h (see the table).
- Cross at signals. Make eye contact with drivers. Put the phone away at the curb.
- Wear light or reflective clothing at night: drivers see dark clothing at ~25 m, reflective at ~150 m.
- Drivers: the reaction-time part of stopping distance is set by attention, not brakes.

### Urgent help (bystander)

1. Make the scene safe: hazard lights, warning triangle, stop traffic if you safely can.
2. Call emergency services. Say 'pedestrian hit by car at about X km/h'. Speed tells them how bad it is.
3. Do not move the person unless they are in danger (fire, traffic). Assume a spinal injury.
4. If they are unresponsive and not breathing normally: start CPR, 100–120 compressions/min, 5–6 cm deep.
5. Major bleeding: firm direct pressure with a cloth. Limb bleeding that won't stop: tourniquet 5–7 cm above the wound, note the time.
6. Keep them warm (jacket or blanket). Cold blood doesn't clot: the 'lethal triad' is hypothermia + acidosis + coagulopathy.
7. Do not give food or water. They may need surgery.

### In the emergency department

- Trauma team activation. Primary survey X-ABCDE (below), with a pelvic binder put on early.
- FAST ultrasound looks for blood around the heart, liver, spleen and in the pelvis within ~2 minutes.
- Whole-body CT if haemodynamically stable. Unstable plus positive FAST goes straight to theatre.
- Massive transfusion protocol: red cells, plasma and platelets ~1:1:1, plus tranexamic acid within 3 h of injury.

### The surgeon's view

- **Damage-control laparotomy**: Midline incision. Pack all four quadrants to tamponade bleeding, then control the source (splenectomy or splenorrhaphy, liver packing). Close temporarily and resuscitate in ICU. Definitive repair at 24–48 h. Philosophy: stop the bleeding, stop the contamination, get out.
- **Pelvic fracture bleeding**: Pelvic binder first. Then pre-peritoneal packing, angio-embolisation of arterial bleeders by interventional radiology, and external fixation.
- **Epidural haematoma**: Classic 'lucid interval' then rapid decline with a dilated pupil. Craniotomy to evacuate the clot and tie off the middle meningeal artery. Minutes matter.
- **Tibia shaft fracture**: Intramedullary nail: a titanium rod down the hollow bone, locked with screws. Open fractures get antibiotics within 1 h and debridement.
- **Compartment syndrome**: Swelling in a closed muscle compartment chokes its own blood supply. Pain out of proportion is the warning. Fasciotomy: long incisions to release the fascia.

## Drowning in a rip current

### Assumptions

- `rip_speed_ms` = 1.5
- `swim_speed_ms` = 1.0
- `rip_width_m` = 30
- `start_offshore_m` = 40
- `hard_swim_endurance_s` = 150
- `water_temp_c` = 15

### Physics and engineering

| Quantity | Value | How |
|---|---|---|
| Net speed swimming straight at the beach | **-0.50 m/s** | v_net = v_swim − v_rip. A negative number means you go backwards |
| Metabolic power to swim at 1 m/s | **269 W** | P = ½ρCdAv³ / efficiency (~8%) |
| Time to escape sideways | **17.00 s** | Rip width / 2 ÷ swim speed |
| Buoyant force with full lungs | **50.35 N** | (ρ_water − ρ_body)·V·g. Positive means you float |
| Body density with full lungs | **955 kg/m³** | Sea water is 1025. Below that you float |
| Body density after exhaling | **1,017 kg/m³** | Closer to water: panic and lost air make you sink |
| Strategy A (fight) | exhausted at t = 150 s, then submerges |  |
| Strategy B (swim parallel) | reaches the beach at t = 72 s |  |
| Strategy C (float) | still afloat at 240 s, waving for rescue |  |
| Expected survival time in water | **1.14 h** | Rough cold-water curve at 15 °C |

**Hypoxia timeline after going under**

| Time | What happens in the body |
|---|---|
| 0–60 s | Breath-hold. CO₂ rises. Panic |
| 60–90 s | Involuntary gasp: water enters the airway. Laryngospasm |
| ~2 min | Unconscious. SpO₂ < 60% |
| 3–4 min | Bradycardia, then cardiac arrest (PEA/asystole) |
| 4–6 min | Irreversible brain injury begins (warm water) |
| > 30 min | Survival rare, except in ice-cold water (hypothermia protects the brain) |

### How the body gets hurt

- Drowning is silent. Victims are upright, head back, mouth at water level, unable to call or wave (the 'instinctive drowning response').
- Rip currents cause ~80% of surf-beach rescues. Swimmers exhaust themselves fighting them.
- Aspirated water washes out surfactant: alveoli collapse, then hypoxaemia, then cardiac arrest.
- Cold shock (< 15 °C): an involuntary gasp and hyperventilation in the first minute can cause aspiration on its own.

### Prevention

- Swim at lifeguarded beaches, between the flags.
- Spot a rip: a calm, dark gap between breaking waves, foam or debris moving out to sea.
- Caught in one: FLIP onto your back, FLOAT, FOLLOW. Swim parallel to the shore, never against the rip.
- Never swim alone or after alcohol. Fence pools. Supervise children within arm's reach.
- Lifejackets in boats. Most boating deaths are people who weren't wearing one.

### Urgent help (bystander)

1. Reach or throw, don't go. Hold out a pole or throw something that floats. Untrained rescuers often drown too.
2. Call emergency services and a lifeguard.
3. Once on land and not breathing: drowning CPR starts with 5 rescue breaths, then 30:2. The problem is oxygen, not the heart.
4. Don't try to drain water from the lungs and don't do abdominal thrusts. It wastes time and causes vomiting.
5. Breathing but unconscious: recovery position, keep them warm, watch them continuously.
6. Everyone who inhaled water goes to hospital. Lung injury can worsen over 4–8 hours.

### In the emergency department

- Oxygen. CPAP or intubation with high PEEP to re-open collapsed alveoli.
- Core temperature. 'Nobody is dead until warm and dead': ice-water victims have survived over an hour of submersion.
- Chest X-ray and blood gas. Look for ARDS, aspiration pneumonia and associated injuries (diving = neck injury).

### The surgeon's view

- **Usually no operation**: Drowning is a medical/ICU disease. The 'operation' is ventilation strategy.
- **ECMO**: For hypothermic cardiac arrest or refractory hypoxaemia: cannulas in the femoral vessels and an external membrane lung oxygenates and rewarms the blood at the same time.
- **Diving injury**: Shallow-water dive leads to cervical fracture: surgical decompression and spinal fusion.

## Fall from height

### Assumptions

- `height_m` = 6.0
- `mass_kg` = 70

### Physics and engineering

| Quantity | Value | How |
|---|---|---|
| Impact speed | **10.85 m/s** | v = √(2gh). Air drag is negligible below ~20 m |
| Impact speed | **39.06 km/h** | Same as being hit by a car at this speed |
| Fall time | **1.11 s** | t = √(2h/g) |
| Energy at impact | **4.12 kJ** | E = mgh |
| Peak deceleration on concrete (2 cm) | **300 g** | a = v²/(2d). Stopping distance is everything |
| Peak deceleration with knees bent (30 cm) | **20.00 g** | Bending and rolling spread the stop over 15× the distance |

**Landing surface**

| Surface | Stop dist (m) | Peak g | Peak force (kN) | Likely |
|---|---|---|---|---|
| Concrete, stiff legs | 0.02 | 300 | 206.0 | fatal/critical |
| Concrete, bent knees + roll | 0.3 | 20 | 13.7 | survivable |
| Grass / soil | 0.1 | 60 | 41.2 | serious |
| Car roof | 0.25 | 24 | 16.5 | survivable |
| Foam pit | 1.0 | 6 | 4.1 | survivable |

**Height**

| Height (m) | ≈ Storeys | Impact (m/s) | Impact (km/h) | g on concrete |
|---|---|---|---|---|
| 2 | 1 | 6.3 | 23 | 100 |
| 3 | 1 | 7.7 | 28 | 150 |
| 6 | 2 | 10.8 | 39 | 300 |
| 10 | 3 | 14.0 | 50 | 500 |
| 15 | 5 | 17.2 | 62 | 750 |
| 20 | 7 | 19.8 | 71 | 1000 |
| 30 | 10 | 24.3 | 87 | 1500 |

### How the body gets hurt

- Feet-first landing: calcaneus (heel) fractures, tibial plateau, and axial load up the spine giving lumbar burst fractures. Together that is 'Don Juan / lover's fracture'.
- Wrist out to break the fall: distal radius (Colles) fracture.
- Head-first or backwards: skull fracture, subdural haematoma, cervical spine injury.
- Internal organs keep moving when the body stops: aortic tear at the ligamentum arteriosum, liver/spleen lacerations.
- LD50 (height at which half die) is about 4 storeys, ~12–15 m. Landing surface and position change it hugely.

### Prevention

- Guardrails at > 1 m height. Harness + anchor for work above 1.8 m (OSHA rule).
- Ladders: 4:1 angle, three points of contact, never the top two rungs.
- Window guards for children. Falls are the leading cause of non-fatal injury in kids and in people over 65.
- Elderly: remove trip hazards, add grab bars and lighting, review sedating medications, and do strength/balance training.
- Falling anyway: bend knees, land on balls of feet, and roll to spread the stop over a longer distance.

### Urgent help (bystander)

1. Call emergency services. Report the height. Over 6 m is a major trauma criterion.
2. Don't move them. Hold the head still in line with the body (manual in-line stabilisation).
3. Unresponsive and not breathing normally: CPR. Breathing is more important than the spine.
4. Control bleeding. Splint obvious deformities only as they lie.
5. Check whether they can feel and move hands and feet, and tell paramedics.

### In the emergency department

- Primary survey. Spine immobilisation until cleared by CT.
- CT angiography of the chest if there is a high deceleration. A widened mediastinum suggests aortic injury.
- Calcaneus fracture found? Image the whole spine: 10% have a spinal fracture too.

### The surgeon's view

- **Aortic transection**: Endovascular (TEVAR): a stent graft is passed up from the femoral artery and deployed across the tear. This has largely replaced open thoracotomy.
- **Lumbar burst fracture**: Unstable or neurological deficit: posterior spinal fusion with pedicle screws and rods, plus decompression of the canal.
- **Calcaneus fracture**: Often waits 7–14 days for swelling to settle (the 'wrinkle sign'), then plate fixation or a minimally invasive sinus-tarsi approach.
- **Acute subdural haematoma**: Decompressive craniotomy. Sometimes the bone flap is left off (craniectomy) so the swollen brain has room.

## Electrocution

### Assumptions

- `voltage_V` = 120
- `skin` = wet
- `contact_time_s` = 1.0

### Physics and engineering

| Quantity | Value | How |
|---|---|---|
| Body resistance (hand to hand) | **1000 Ω** | Skin is most of it. Water lowers it 100× |
| Current through body | **120 mA** | Ohm's law: I = V/R |
| Effect | ventricular fibrillation (VF) |  |
| Heat deposited | **14.40 J** | Q = I²Rt (Joule heating, most of it at the entry/exit points) |
| Heart in the current path? | Hand to hand or hand to foot both cross the chest. That is why it kills |  |

**Voltage × skin**

| Volts | Skin | R (Ω) | Current (mA) | Effect |
|---|---|---|---|---|
| 12 | dry | 100000 | 0.1 | not felt |
| 12 | wet | 1000 | 12.0 | painful, can still let go |
| 120 | dry | 100000 | 1.2 | tingle |
| 120 | wet | 1000 | 120.0 | ventricular fibrillation (VF) |
| 240 | dry | 100000 | 2.4 | tingle |
| 240 | wet | 1000 | 240.0 | ventricular fibrillation (VF) |
| 480 | dry | 100000 | 4.8 | tingle |
| 480 | wet | 1000 | 480.0 | ventricular fibrillation (VF) |
| 7200 | dry | 500 | 14400.0 | cardiac standstill + deep burns |
| 7200 | wet | 500 | 14400.0 | cardiac standstill + deep burns |

### How the body gets hurt

- AC at 50–60 Hz causes tetany. Flexors are stronger, so the hand clamps onto the wire: 'can't let go' above ~15 mA.
- Current crossing the chest during the T-wave triggers ventricular fibrillation.
- Heat (I²R) cooks deep tissue along the path, worst in muscle and bone. The skin can look minor while muscle beneath is dead: an 'iceberg' injury.
- Dead muscle releases myoglobin (rhabdomyolysis), causing kidney failure and high potassium.
- Lightning: a huge, ultra-short pulse. Cardiac AND respiratory arrest; the heart often restarts on its own but breathing does not.

### Prevention

- GFCI / RCD outlets near water: they trip at 5–30 mA in < 40 ms, well before VF.
- Switch off at the breaker and test before working. Lock-out/tag-out at work.
- Downed power lines: stay 10 m away. The ground around them is live ('step potential'). Shuffle away with feet together.
- Keep ladders and kites far from overhead lines. Cover outlets for toddlers.

### Urgent help (bystander)

1. DON'T TOUCH THEM while they're in contact. Kill the power first (breaker, plug, switch).
2. Low voltage only: if you can't cut the power, push them away with dry wood or plastic while standing on something dry.
3. High voltage: stay away and call the power company and emergency services.
4. Once safe and not breathing: CPR + AED immediately. Electrical-injury VF responds well to early defibrillation.
5. Cool burns with running water for 20 min. Look for both an entry AND an exit wound.
6. Everyone with a significant shock goes to hospital. Arrhythmias and internal damage can show up late.

### In the emergency department

- ECG and cardiac monitoring. Bloods: CK (muscle damage), potassium, kidney function, urine myoglobin.
- Aggressive IV fluids targeting urine output of 1–1.5 mL/kg/h if the urine is dark (myoglobin).
- Repeated limb checks for compartment syndrome.

### The surgeon's view

- **Fasciotomy**: Swollen dead muscle within the forearm or leg compartments needs release. Often done early in high-voltage injury, and the carpal tunnel is released too.
- **Serial debridement**: Return to theatre every 48–72 h to cut away tissue that has 'declared' itself dead until only living tissue remains.
- **Amputation**: High-voltage injury has one of the highest amputation rates of any trauma. Then reconstruction with flaps and grafts.

## Burns in a house fire

### Assumptions

- `mass_kg` = 70
- `burned_areas` = ['front_torso', 'right_arm', 'left_arm']
- `heat_flux_kW_m2` = 20

### Physics and engineering

| Quantity | Value | How |
|---|---|---|
| Total body surface area burned | **36 %** | Rule of nines (adult) |
| Parkland fluid, 24 h | **10080 mL** | 4 mL × kg × %TBSA of Ringer's lactate |
| Of which in first 8 h | **5,040 mL** | Half of it, timed from the burn, not from arrival |
| Time to full-thickness skin damage | **1.91 s** | Semi-infinite solid conduction at 20 kW/m² |
| Smoke at head height | CO and cyanide kill more fire victims than flames. Crawl low |  |

**Radiant heat**

| kW/m² | Source | Seconds to burn |
|---|---|---|
| 1 | Midday sun | 762.6 |
| 2.5 | Pain limit for firefighters | 122.0 |
| 10 | Near a burning sofa | 7.6 |
| 20 | Flashover threshold | 1.9 |
| 80 | Inside a flashed-over room | 0.1 |

### How the body gets hurt

- Depth: superficial (red, painful, like sunburn), partial thickness (blisters, very painful), full thickness (white/leathery, painless because nerves are destroyed).
- Large burns (> 20% TBSA) cause body-wide capillary leak and 'burn shock' from massive fluid loss.
- Circumferential full-thickness burns form a rigid eschar that strangles a limb or stops the chest moving.
- Inhalation injury: soot in the mouth, singed nostrils, hoarse voice. The airway swells shut over hours.
- Carbon monoxide binds haemoglobin 240× more strongly than oxygen. Pulse oximeters read it as NORMAL.

### Prevention

- Smoke alarms on every level and test them monthly. A working alarm halves the risk of dying in a house fire.
- Plan and practise two ways out of every room. Close doors behind you: a closed door holds off fire for minutes.
- Never leave cooking unattended. Pan fire: lid on, heat off, NEVER water on burning oil.
- Hot water heater at ≤ 49 °C (120 °F). At 60 °C a child's skin burns in 1 second.

### Urgent help (bystander)

1. Clothes on fire: STOP, DROP, ROLL. Running feeds the flames oxygen (see the animation).
2. Get out, stay out, call emergency services. Crawl under smoke.
3. Cool the burn with cool running water for 20 minutes, effective up to 3 h after the burn. Not ice.
4. Remove rings, watches and clothing near the burn before swelling starts (unless stuck to skin).
5. Cover loosely with cling film or a clean non-fluffy cloth. No butter, toothpaste or creams.
6. Keep the rest of the person warm. Big burns lose heat fast.

### In the emergency department

- Airway first. Early intubation if inhalation injury, before swelling makes it impossible.
- 100% oxygen for CO. Hyperbaric oxygen in selected cases. Hydroxocobalamin for cyanide.
- Parkland formula fluids (calculated above), then titrated to urine output 0.5 mL/kg/h in adults.
- Transfer to a burn centre: > 10% TBSA, full thickness, face/hands/genitals/joints, electrical, chemical, inhalation.

### The surgeon's view

- **Escharotomy**: Incisions through the burned eschar (painless, the nerves are gone) down the sides of a limb or across the chest so blood flows and the chest can expand.
- **Early excision**: Within ~72 h, the dead burned tissue is shaved off layer by layer (tangential excision) until bleeding, living tissue appears.
- **Split-thickness skin graft**: A dermatome harvests a thin sheet of healthy skin. It is often meshed to expand it and stapled over the excised wound. The donor site heals like a graze.
- **When there isn't enough skin**: Cadaver allograft, dermal substitutes, or lab-cultured skin (CEA) as temporary or permanent cover.
- **Reconstruction**: Months later: contracture release, Z-plasty, laser for scars, physiotherapy and pressure garments.
