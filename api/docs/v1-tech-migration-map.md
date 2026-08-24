# V1 production tech-element audit → ai@2026-08-24-beta collection/manifestation mapping

Audited 2026-08-24 against `hp_admin_api_production` (Render, Frankfurt). Read-only queries on
`datachain_elements`.

## Production shape

- 236 device datachains (`datachainable_type = Inventory::Device`), 3,181 datachain elements.
- 504 tech-category rows, **48 distinct elements, all with dtpr_ids — zero custom tech elements.**
- Of 228 chains with tech elements: 157 capture-only, 28 capture + interface, 26 interface-only,
  17 connectivity/meta-only. The 54 interface-carrying chains are the evidence for the
  `manifestation` category split.

## Mapping table (uses in production → target in ai@2026-08-24-beta)

### → collection

| V1 element | uses | target | note |
| --- | --- | --- | --- |
| tech__air_quality | 48 | environmental_sensor | |
| tech__cellular | 39 | network_connection | added during this audit |
| tech__gps | 29 | positioning_location | |
| tech__person_detection | 26 | camera | V1 desc is image-based; pair with computer_vision processing |
| tech__weather_station | 25 | environmental_sensor | |
| tech__personal_device | 24 | user_input | SPLIT: manifest side → mobile_notification; decide per chain |
| tech__wireless_access_point | 21 | network_connection | added during this audit |
| tech__non_identifiable_video | 20 | camera | identifiability → pii context on input_dataset |
| tech__identifiable_video | 17 | camera | pii: identifiable |
| tech__passive_infrared_sensor | 17 | presence_motion_sensor | |
| tech__thermometer | 15 | environmental_sensor | |
| tech__de_identified_video | 12 | camera | pii: de_identified |
| tech__de_identified_image | 12 | camera | pii: de_identified |
| tech__sound_level_meter | 12 | environmental_sensor | |
| tech__identifiable_image | 11 | camera | pii: identifiable |
| tech__image | 10 | camera | |
| tech__microphone | 9 | microphone | |
| tech__unmanned_aircraft_system | 9 | camera | drone = platform; flag if also encountered as moving machine |
| tech__li_dar | 8 | vehicle_detection | if crowd/space sensing → presence_motion_sensor |
| tech__radar | 7 | vehicle_detection | |
| tech__voice | 7 | microphone | pii: identifiable per V1 desc |
| tech__video_camera | 7 | camera | |
| tech__location_beacon | 6 | positioning_location | |
| tech__hands_free | 5 | user_input | voice/gesture interaction |
| tech__identifiable_rfid | 4 | wireless_signal_sensing | pii: identifiable |
| tech__image_infrared | 4 | camera | |
| tech__induction_loop | 4 | vehicle_detection | |
| tech__facial_characterization | 4 | camera | pair with affect/biometric processing element |
| tech__biometrics | 4 | biometric_scanner | |
| tech__ultrasonic_level_sensor | 3 | environmental_sensor | |
| tech__motion_detector | 3 | presence_motion_sensor | |
| tech__nfc | 3 | wireless_signal_sensing | |
| tech__inclinometer | 3 | environmental_sensor | stretch: measures structure tilt, not environment |
| tech__video_camera_infrared | 3 | camera | |
| tech__rfid | 2 | wireless_signal_sensing | |
| tech__piezoelectric_sensor | 2 | vehicle_detection | |
| tech__soil_moisture_sensor | 1 | environmental_sensor | |
| tech__de_identified_voice | 1 | microphone | pii: de_identified |

### → manifestation

| V1 element | uses | target | note |
| --- | --- | --- | --- |
| tech__system_screen | 20 | screen_or_sign | |
| tech__contactless_payments | 13 | automatic_transaction | the tap itself is arguably user_input |
| tech__assistance_station | 9 | screen_or_sign | or chatbot_voice_reply; decide per chain |
| tech__electric_vehicle_charger | 8 | gate_barrier_machine | weak fit; see gaps |
| tech__augmented_reality | 6 | screen_or_sign | weak fit; see gaps |
| tech__chatbot | 2 | chatbot_voice_reply | + user_input on the collection side |
| tech__intercom | 2 | spoken_announcement | two-way: + microphone on the collection side |

### No clean home (decide before migration)

| V1 element | uses | issue |
| --- | --- | --- |
| tech__technology_switch | 4 | no longer in V1 content (orphaned dtpr_id); likely a physical off-switch → rights/access territory |
| tech__dtpr_api | 2 | the disclosure channel itself, not capture or manifestation; re-home under access or drop |
| tech__wireless_charging_roadway | 1 | energy-delivery infrastructure, like the EV charger |

## Gaps and follow-ups

1. **network_connection** — RESOLVED: added to collection during this audit (covers 60 uses).
2. **Service/energy appliances** (EV charger 8, wireless charging roadway 1): the appliance is the
   system's own identity, not a capture or encounter channel. Mapped to gate_barrier_machine as a
   stopgap; consider a future `service_equipment` manifestation element if this class grows.
3. **AR** (6 uses): mapped to screen_or_sign; consider a future `immersive_overlay` element.
4. **personal_device** (24 uses) is the biggest per-chain judgment call: it can mean the app
   collects (→ user_input / positioning_location / connected_device_telemetry) or the app displays
   (→ mobile_notification), usually both.
5. **Identifiability variants collapse as designed**: the 8 identifiable/de-identified/
   non-identifiable video-image-voice-rfid variants (~87 uses) all map to plain instruments +
   the pii element_context on input_dataset. This was the core design bet and production data
   confirms it covers the real usage.
6. Elements with zero production use exist in V1 (e.g. tech__solar_panel-class oddities) — not
   blocking; migration only needs the 48 used ones.
