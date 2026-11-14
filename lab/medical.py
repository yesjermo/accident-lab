"""
Accident Lab - medical teaching content.

Written from a trauma-surgery point of view for EDUCATION ONLY.
Bystanders: call your emergency number (911 / 112 / 999) first, every time.
The "surgery" sections describe what a trained team does in hospital so you
understand the reasoning. They are not instructions to perform anything.
"""

PRIMARY_SURVEY = [
    ("X", "eXsanguinating haemorrhage: stop massive bleeding first (pressure, tourniquet)"),
    ("A", "Airway with cervical-spine protection"),
    ("B", "Breathing: look, listen, feel. Tension pneumothorax? Flail chest?"),
    ("C", "Circulation: pulse, BP, bleeding sources (chest, abdomen, pelvis, long bones, floor)"),
    ("D", "Disability: GCS, pupils, glucose"),
    ("E", "Exposure: undress fully, look everywhere, then keep the patient WARM"),
]

CONTENT = {
    "pedestrian": {
        "mechanism": [
            "Bumper hits the leg at knee height: tibia/fibula fractures, knee ligament tears (the 'bumper fracture').",
            "Bonnet hits the hip and pelvis: pelvic ring fractures can bleed 2–3 litres, unseen.",
            "Head and chest wrap onto the bonnet and windscreen: traumatic brain injury, rib fractures, lung contusion.",
            "Secondary impact on the road: often the worst head injury, plus spine injury.",
            "Adults often show 'Waddell's triad': femur/tibia fracture + chest/abdominal injury + head injury.",
        ],
        "prevention": [
            "Speed is the biggest lever: fatality risk climbs steeply above 40 km/h (see the table).",
            "Cross at signals. Make eye contact with drivers. Put the phone away at the curb.",
            "Wear light or reflective clothing at night: drivers see dark clothing at ~25 m, reflective at ~150 m.",
            "Drivers: the reaction-time part of stopping distance is set by attention, not brakes.",
        ],
        "first_aid": [
            "Make the scene safe: hazard lights, warning triangle, stop traffic if you safely can.",
            "Call emergency services. Say 'pedestrian hit by car at about X km/h'. Speed tells them how bad it is.",
            "Do not move the person unless they are in danger (fire, traffic). Assume a spinal injury.",
            "If they are unresponsive and not breathing normally: start CPR, 100–120 compressions/min, 5–6 cm deep.",
            "Major bleeding: firm direct pressure with a cloth. Limb bleeding that won't stop: tourniquet 5–7 cm above the wound, note the time.",
            "Keep them warm (jacket or blanket). Cold blood doesn't clot: the 'lethal triad' is hypothermia + acidosis + coagulopathy.",
            "Do not give food or water. They may need surgery.",
        ],
        "hospital": [
            "Trauma team activation. Primary survey X-ABCDE (below), with a pelvic binder put on early.",
            "FAST ultrasound looks for blood around the heart, liver, spleen and in the pelvis within ~2 minutes.",
            "Whole-body CT if haemodynamically stable. Unstable plus positive FAST goes straight to theatre.",
            "Massive transfusion protocol: red cells, plasma and platelets ~1:1:1, plus tranexamic acid within 3 h of injury.",
        ],
        "surgery": [
            ("Damage-control laparotomy", "Midline incision. Pack all four quadrants to tamponade bleeding, then control the source (splenectomy or splenorrhaphy, liver packing). Close temporarily and resuscitate in ICU. Definitive repair at 24–48 h. Philosophy: stop the bleeding, stop the contamination, get out."),
            ("Pelvic fracture bleeding", "Pelvic binder first. Then pre-peritoneal packing, angio-embolisation of arterial bleeders by interventional radiology, and external fixation."),
            ("Epidural haematoma", "Classic 'lucid interval' then rapid decline with a dilated pupil. Craniotomy to evacuate the clot and tie off the middle meningeal artery. Minutes matter."),
            ("Tibia shaft fracture", "Intramedullary nail: a titanium rod down the hollow bone, locked with screws. Open fractures get antibiotics within 1 h and debridement."),
            ("Compartment syndrome", "Swelling in a closed muscle compartment chokes its own blood supply. Pain out of proportion is the warning. Fasciotomy: long incisions to release the fascia."),
        ],
    },
    "drowning": {
        "mechanism": [
            "Drowning is silent. Victims are upright, head back, mouth at water level, unable to call or wave (the 'instinctive drowning response').",
            "Rip currents cause ~80% of surf-beach rescues. Swimmers exhaust themselves fighting them.",
            "Underwater, the breath-hold holds until CO₂ forces an involuntary gasp. Water hits the larynx and it clamps shut (laryngospasm), then relaxes as oxygen runs out and water floods in.",
            "Aspirated water washes out surfactant: alveoli collapse, then hypoxaemia, then cardiac arrest.",
            "Cold shock (< 15 °C): an involuntary gasp and hyperventilation in the first minute can cause aspiration on its own.",
        ],
        "prevention": [
            "Swim at lifeguarded beaches, between the flags.",
            "Spot a rip: a calm, dark gap between breaking waves, foam or debris moving out to sea.",
            "Caught in one: FLIP onto your back, FLOAT, FOLLOW. Swim parallel to the shore, never against the rip.",
            "Floating on your back needs almost no effort: with only your face out, your lungs still give ~5 N of spare lift. Holding your whole head up costs ~25 N more than they give.",
            "Raise an arm and shout while you still can. Once the instinctive drowning response starts, you can do neither.",
            "Never swim alone or after alcohol. Fence pools. Supervise children within arm's reach.",
            "Lifejackets in boats. Most boating deaths are people who weren't wearing one.",
        ],
        "first_aid": [
            "Reach or throw, don't go. Hold out a pole or throw something that floats. Untrained rescuers often drown too.",
            "Call emergency services and a lifeguard.",
            "Once on land and not breathing: drowning CPR starts with 5 rescue breaths, then 30:2. The problem is oxygen, not the heart.",
            "Trained lifeguards start rescue breaths in the water during a long tow: every minute without oxygen counts.",
            "Don't try to drain water from the lungs and don't do abdominal thrusts. It wastes time and causes vomiting.",
            "Breathing but unconscious: recovery position, keep them warm, watch them continuously.",
            "Everyone who inhaled water goes to hospital. Lung injury can worsen over 4–8 hours.",
        ],
        "hospital": [
            "Oxygen. CPAP or intubation with high PEEP to re-open collapsed alveoli.",
            "Core temperature. 'Nobody is dead until warm and dead': ice-water victims have survived over an hour of submersion.",
            "Chest X-ray and blood gas. Look for ARDS, aspiration pneumonia and associated injuries (diving = neck injury).",
        ],
        "surgery": [
            ("Usually no operation", "Drowning is a medical/ICU disease. The 'operation' is ventilation strategy."),
            ("ECMO", "For hypothermic cardiac arrest or refractory hypoxaemia: cannulas in the femoral vessels and an external membrane lung oxygenates and rewarms the blood at the same time."),
            ("Diving injury", "Shallow-water dive leads to cervical fracture: surgical decompression and spinal fusion."),
        ],
    },
    "choking": {
        "mechanism": [
            "Food is pulled into the airway with a sudden breath in: laughing, talking or gasping while eating. Large, firm pieces (meat, hot dogs, grapes, nuts in children) wedge at the larynx, the narrowest point.",
            "Complete obstruction: no air in or out. You can't speak, cough or breathe, and you go blue. Partial obstruction: you can still cough and make sounds.",
            "With no air moving, oxygen in the lungs and blood runs down: unconscious in about 1–2 minutes, then the heart stops from lack of oxygen.",
            "Risk factors: alcohol, dentures, dementia, stroke or Parkinson's (poor swallowing), and young children (small airways).",
        ],
        "prevention": [
            "Cut food small, chew it well, and don't talk or laugh with your mouth full.",
            "Children under 5: quarter grapes and cherry tomatoes lengthways, no whole nuts or hard sweets, and sit them down to eat.",
            "Older adults with swallowing problems: a speech and language assessment and texture-modified food.",
            "Learn back blows, abdominal thrusts and CPR: most choking happens in front of family or friends.",
        ],
        "first_aid": [
            "Ask \u201cAre you choking?\u201d. If they can cough, encourage coughing and stay with them.",
            "If they can't cough, speak or breathe: up to 5 back blows. Lean them forward, support the chest, and strike between the shoulder blades with the heel of your hand.",
            "Then up to 5 abdominal thrusts: stand behind, a fist just above the navel, pull sharply in and up. Alternate 5 and 5.",
            "Pregnant or very large: chest thrusts instead. Infants under 1: 5 back blows face-down along your forearm, then 5 chest thrusts with two fingers; never abdominal thrusts.",
            "If they become unresponsive: lower them to the floor, call 911, and start CPR. Compressions also push air against the blockage.",
            "Anyone given abdominal thrusts should see a doctor: thrusts can injure the stomach, liver or spleen.",
        ],
        "hospital": [
            "Still obstructed: direct laryngoscopy, and the object is pulled out with Magill forceps.",
            "Pieces that went past the larynx: chest X-ray (many foods don't show), then bronchoscopy.",
            "After abdominal thrusts: check the abdomen for injury; after a long obstruction, look for aspiration pneumonia and hypoxic brain injury.",
        ],
        "surgery": [
            ("Rigid bronchoscopy", "Under general anaesthetic a metal tube is passed through the mouth into the windpipe; forceps or a basket retrieve the food from the bronchus while the patient is ventilated through the scope."),
            ("Emergency cricothyrotomy", "When nothing can be seen or removed and oxygen can't be delivered: a cut through the cricothyroid membrane just below the Adam's apple, and a tube into the windpipe below the blockage."),
            ("Tracheostomy", "If the larynx is badly swollen or injured, a planned opening lower in the neck for a longer-term airway."),
        ],
    },
    "fall": {
        "mechanism": [
            "Feet-first landing: calcaneus (heel) fractures, tibial plateau, and axial load up the spine giving lumbar burst fractures. Together that is 'Don Juan / lover's fracture'.",
            "Wrist out to break the fall: distal radius (Colles) fracture.",
            "Head-first or backwards: skull fracture, subdural haematoma, cervical spine injury.",
            "Internal organs keep moving when the body stops: aortic tear at the ligamentum arteriosum, liver/spleen lacerations.",
            "LD50 (height at which half die) is about 4 storeys, ~12–15 m. Landing surface and position change it hugely.",
        ],
        "prevention": [
            "Guardrails at > 1 m height. Harness + anchor for work above 1.8 m (OSHA rule).",
            "Ladders: 4:1 angle, three points of contact, never the top two rungs.",
            "Window guards for children. Falls are the leading cause of non-fatal injury in kids and in people over 65.",
            "Elderly: remove trip hazards, add grab bars and lighting, review sedating medications, and do strength/balance training.",
            "Falling anyway: bend knees, land on balls of feet, and roll to spread the stop over a longer distance.",
        ],
        "first_aid": [
            "Call emergency services. Report the height. Over 6 m is a major trauma criterion.",
            "Don't move them. Hold the head still in line with the body (manual in-line stabilisation).",
            "Unresponsive and not breathing normally: CPR. Breathing is more important than the spine.",
            "Control bleeding. Splint obvious deformities only as they lie.",
            "Check whether they can feel and move hands and feet, and tell paramedics.",
        ],
        "hospital": [
            "Primary survey. Spine immobilisation until cleared by CT.",
            "CT angiography of the chest if there is a high deceleration. A widened mediastinum suggests aortic injury.",
            "Calcaneus fracture found? Image the whole spine: 10% have a spinal fracture too.",
        ],
        "surgery": [
            ("Aortic transection", "Endovascular (TEVAR): a stent graft is passed up from the femoral artery and deployed across the tear. This has largely replaced open thoracotomy."),
            ("Lumbar burst fracture", "Unstable or neurological deficit: posterior spinal fusion with pedicle screws and rods, plus decompression of the canal."),
            ("Calcaneus fracture", "Often waits 7–14 days for swelling to settle (the 'wrinkle sign'), then plate fixation or a minimally invasive sinus-tarsi approach."),
            ("Acute subdural haematoma", "Decompressive craniotomy. Sometimes the bone flap is left off (craniectomy) so the swollen brain has room."),
        ],
    },
    "electrocution": {
        "mechanism": [
            "AC at 50–60 Hz causes tetany. Flexors are stronger, so the hand clamps onto the wire: 'can't let go' above ~15 mA.",
            "Current crossing the chest during the T-wave triggers ventricular fibrillation.",
            "Heat (I²R) cooks deep tissue along the path, worst in muscle and bone. The skin can look minor while muscle beneath is dead: an 'iceberg' injury.",
            "Dead muscle releases myoglobin (rhabdomyolysis), causing kidney failure and high potassium.",
            "Lightning: a huge, ultra-short pulse. Cardiac AND respiratory arrest; the heart often restarts on its own but breathing does not.",
        ],
        "prevention": [
            "GFCI / RCD outlets near water: they trip at 5–30 mA in < 40 ms, well before VF.",
            "Switch off at the breaker and test before working. Lock-out/tag-out at work.",
            "Downed power lines: stay 10 m away. The ground around them is live ('step potential'). Shuffle away with feet together.",
            "Keep ladders and kites far from overhead lines. Cover outlets for toddlers.",
        ],
        "first_aid": [
            "DON'T TOUCH THEM while they're in contact. Kill the power first (breaker, plug, switch).",
            "Low voltage only: if you can't cut the power, push them away with dry wood or plastic while standing on something dry.",
            "High voltage: stay away and call the power company and emergency services.",
            "Once safe and not breathing: CPR + AED immediately. Electrical-injury VF responds well to early defibrillation.",
            "Cool burns with running water for 20 min. Look for both an entry AND an exit wound.",
            "Everyone with a significant shock goes to hospital. Arrhythmias and internal damage can show up late.",
        ],
        "hospital": [
            "ECG and cardiac monitoring. Bloods: CK (muscle damage), potassium, kidney function, urine myoglobin.",
            "Aggressive IV fluids targeting urine output of 1–1.5 mL/kg/h if the urine is dark (myoglobin).",
            "Repeated limb checks for compartment syndrome.",
        ],
        "surgery": [
            ("Fasciotomy", "Swollen dead muscle within the forearm or leg compartments needs release. Often done early in high-voltage injury, and the carpal tunnel is released too."),
            ("Serial debridement", "Return to theatre every 48–72 h to cut away tissue that has 'declared' itself dead until only living tissue remains."),
            ("Amputation", "High-voltage injury has one of the highest amputation rates of any trauma. Then reconstruction with flaps and grafts."),
        ],
    },
    "burns": {
        "mechanism": [
            "Depth: superficial (red, painful, like sunburn), partial thickness (blisters, very painful), full thickness (white/leathery, painless because nerves are destroyed).",
            "Large burns (> 20% TBSA) cause body-wide capillary leak and 'burn shock' from massive fluid loss.",
            "Circumferential full-thickness burns form a rigid eschar that strangles a limb or stops the chest moving.",
            "Inhalation injury: soot in the mouth, singed nostrils, hoarse voice. The airway swells shut over hours.",
            "Carbon monoxide binds haemoglobin 240× more strongly than oxygen. Pulse oximeters read it as NORMAL.",
        ],
        "prevention": [
            "Smoke alarms on every level and test them monthly. A working alarm halves the risk of dying in a house fire.",
            "Plan and practise two ways out of every room. Close doors behind you: a closed door holds off fire for minutes.",
            "Never leave cooking unattended. Pan fire: lid on, heat off, NEVER water on burning oil.",
            "Hot water heater at ≤ 49 °C (120 °F). At 60 °C a child's skin burns in 1 second.",
        ],
        "first_aid": [
            "Clothes on fire: STOP, DROP, ROLL. Running feeds the flames oxygen (see the animation).",
            "Get out, stay out, call emergency services. Crawl under smoke.",
            "Cool the burn with cool running water for 20 minutes, effective up to 3 h after the burn. Not ice.",
            "Remove rings, watches and clothing near the burn before swelling starts (unless stuck to skin).",
            "Cover loosely with cling film or a clean non-fluffy cloth. No butter, toothpaste or creams.",
            "Keep the rest of the person warm. Big burns lose heat fast.",
        ],
        "hospital": [
            "Airway first. Early intubation if inhalation injury, before swelling makes it impossible.",
            "100% oxygen for CO. Hyperbaric oxygen in selected cases. Hydroxocobalamin for cyanide.",
            "Parkland formula fluids (calculated above), then titrated to urine output 0.5 mL/kg/h in adults.",
            "Transfer to a burn centre: > 10% TBSA, full thickness, face/hands/genitals/joints, electrical, chemical, inhalation.",
        ],
        "surgery": [
            ("Escharotomy", "Incisions through the burned eschar (painless, the nerves are gone) down the sides of a limb or across the chest so blood flows and the chest can expand."),
            ("Early excision", "Within ~72 h, the dead burned tissue is shaved off layer by layer (tangential excision) until bleeding, living tissue appears."),
            ("Split-thickness skin graft", "A dermatome harvests a thin sheet of healthy skin. It is often meshed to expand it and stapled over the excised wound. The donor site heals like a graze."),
            ("When there isn't enough skin", "Cadaver allograft, dermal substitutes, or lab-cultured skin (CEA) as temporary or permanent cover."),
            ("Reconstruction", "Months later: contracture release, Z-plasty, laser for scars, physiotherapy and pressure garments."),
        ],
    },
}
