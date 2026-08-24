---
source: https://www.iotsecurityprivacy.org/downloads/Privacy_and_Security_Specifications.pdf
date_accessed: 2026-08-24
authority_tier: peer-reviewed
applicability_tags: [concept:public-space-ai, concept:citizen-facing-disclosure, concept:sensing-layer-disclosure, concept:actuation-layer-disclosure, pattern:sense-process-actuate, pattern:sensor-register, standard:ieee-7001, standard:iso-iec-30141, framework:cmu-iot-label, framework:eu-ai-act, jurisdiction:nl]
recheck_after: 2027-08-24
schema_content_hash: sha256-961cd7b54d3e1b915e32310eb4c37dfe61f20fbdd1b4e35d5e97eacaf933b00a
---

# Sensing and actuation as separable disclosure layers (precedent survey)

Survey run while proposing two new categories for the `ai` datachain-type — an upstream capture/collection category and a downstream output-manifestation category — extending the `data_flow` subchain (input → processing → output) to the full sense→process→actuate loop. Question: do existing transparency frameworks disclose (a) the capture hardware and (b) the output/actuation surface as layers separate from data and algorithm?

## Findings by source (accessed 2026-08-24)

1. **DTPR classic "device" taxonomy** (Sidewalk Labs → Helpful Places, https://dtpr.io/taxonomy/device, industry-report). Technology category (~51 elements) is overwhelmingly capture hardware (Video camera, LiDAR, Radar, Microphone, Induction Loop, Air Quality…) kept separate from Data Type and Processing. Output/interface elements are nearly absent — only System Screen, Intercom, Chatbot — mixed into the same category with no sensors-vs-interfaces split. Strong precedent for a distinct capture layer; weak/implicit for an output layer.
2. **Amsterdam Sensorenregister + NL/Helsinki algorithm registers** (https://sensorenregister.amsterdam.nl/, https://algoritmes.overheid.nl/en, https://ai.hel.fi/en/ai-register/, regulatory-text). Amsterdam's meldingsplicht (since 2021-12-01) requires professional sensors in public space on a public map (sensor type, owner, personal-data flag) — a capture-only register, institutionally separate from the algorithm register. The Dutch algorithm-register publication standard has no sensor-hardware field and no output-channel field. Output surfaces are undisclosed everywhere.
3. **CMU IoT Security & Privacy Label, CISPL 1.0** (https://www.iotsecurityprivacy.org/downloads/Privacy_and_Security_Specifications.pdf, peer-reviewed). Clearest two-sided precedent: "Sensor Data Collection" (3.1) and "Sensor Type" (3.2 — Camera, Microphone, Motion sensor) are fields distinct from purpose/storage/retention/sharing, AND a dedicated actuation field "Physical Actuations and Triggers" (4.5, e.g. "Device blinks when motion is detected").
4. **EU AI Act Art. 50 + Annex III** (Reg. (EU) 2024/1689, regulatory-text). Pegs disclosure to the encounter moment ("at the time of the first interaction or exposure") for chatbots, emotion recognition, biometric categorisation, synthetic content — but never requires naming the capture device or the surface where outputs appear. Annex III names capture-adjacent systems and consequential output contexts only as risk triggers.
5. **IEEE 7001-2021 Transparency of Autonomous Systems + ISO/IEC 30141 IoT RA** (https://www.frontiersin.org/articles/10.3389/frobt.2021.665729/full, peer-reviewed/consensus-standard). IEEE 7001 logs "sensor inputs, user commands, and actuator outputs" as distinct objects and requires "physical cues showing the location of sensors" at bystander level. ISO/IEC 30141 models sensing and actuating as the two physical-world interaction modes of the device layer. Standards precedent for sense→process→actuate as separable layers, applied to logging/architecture rather than public signage.

## Synthesis

Capture-layer-as-separate-disclosure has strong precedent (DTPR Technology, Amsterdam sensor register, CMU Sensor Type). Output/actuation-layer disclosure has one explicit field precedent (CMU 4.5) plus IEEE 7001 actuator logging; registers and Art. 50 leave the output surface implicit. A DTPR category naming the output surface would be genuinely novel among citizen-facing frameworks, while the capture category follows well-trodden ground.
