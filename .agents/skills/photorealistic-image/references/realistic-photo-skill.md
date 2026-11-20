# Photorealistic Image Quality Reference

## Photorealism Guidelines

- Treat the scene as a photograph captured in a real place, not as concept art.
- Prioritize physical credibility over spectacle, exaggerated cinematic styling, or generic quality tags.
- Describe what is visible: subject, action, environment, camera position, light, and material behavior.
- Prefer documentary, editorial, or natural sports photography language when a style cue is useful.
- Avoid vague boosters such as `masterpiece`, `epic`, `8K`, `hyperreal`, and `award-winning`.

- Use one plausible dominant light source and consistent ambient fill from the environment.
- Match shadow direction, length, and softness to the stated sun, sky, or practical light.
- Include contact shadows where people and objects meet snow, ground, or other surfaces.
- Keep reflections consistent with the scene and surface roughness; not every material should be glossy.
- Let weather affect visibility, surfaces, clothing, and contrast rather than appearing as an overlay.
- Preserve natural exposure, restrained saturation, realistic highlight roll-off, and detail in bright snow.
- Avoid heavy HDR, orange-and-teal grading, excessive clarity, glow, or theatrical volumetric rays.

- Establish camera height, position, direction, pitch, and distance before adding lens language.
- Use believable perspective and scale cues; camera position controls perspective, while focal length controls framing.
- Use wide lenses carefully: 24–28 mm equivalent suits many environmental or POV views without extreme distortion.
- Keep horizon placement consistent with camera pitch and avoid unexplained curved horizons or stretched edges.
- Use moderate depth of field appropriate to subject distance; distant detail should soften naturally.
- Motion blur, flare, grain, and lens imperfections should be subtle and physically motivated.

- Describe important materials by their real response to light: matte fabric, scratched plastic, brushed metal, granular snow.
- Add selective evidence of use such as scuffs, folds, compressed snow, uneven tracks, or light weathering.
- Vary natural forms and repeated elements; avoid cloned trees, tracks, rocks, windows, or crowds.
- Respect gravity, contact, collision, occlusion, and cause-and-effect throughout the scene.
- Keep anatomy, object counts, mechanical connections, and relative scale coherent.
- Do not add text, logos, watermarks, UI, HUDs, holograms, or AR elements unless explicitly requested.

## Prompt Construction

Transform casual requests into a compact prompt organized by scene truth:

1. **Subject and action:** Identify what is present, what is happening, and the exact captured moment.
2. **Environment:** Place foreground, middle ground, and background elements with plausible spacing and scale.
3. **Camera:** State physical position, height, viewing direction, lens class, framing, and aspect or projection.
4. **Light and weather:** Define time, dominant light direction, shadow character, visibility, and atmosphere.
5. **Physical detail:** Name key materials, wear, contact points, deformation, anatomy, and equipment constraints.
6. **Treatment and constraints:** Request restrained photographic color and list only relevant failures to avoid.

Use this compact pattern:

```text
[Photographic intent, subject, and action].
Environment: [terrain, spatial layout, background, scale cues, evidence of use].
Camera: [position and height], [direction and pitch], [lens], [composition], [aspect or projection].
Light: [time and weather], [source direction and softness], [shadows, reflections, atmosphere].
Physical detail: [materials, wear, contact, anatomy, construction].
Constraints: [short scene-specific list of artifacts and forbidden elements].
```

- Lead with mandatory content and relationships; place style language last.
- Convert abstractions into visible facts: replace “immersive” with camera placement and spatial composition.
- Infer nonessential photographic details when helpful, but preserve requested subjects, actions, framing, and mood.
- Resolve contradictions such as overcast light with hard noon shadows or telephoto compression with extreme-wide coverage.
- State counts and relationships when ambiguity could create extra people, limbs, skis, poles, or equipment.
- Use targeted negative constraints rather than a long generic keyword wall.
- For edits or related frames, repeat approved anchors and describe only the intended change.
- Distinguish a standard rectilinear image from a true panorama in the prompt and deliverable.

## Ski POV & Continuity

- Place a first-person ski camera at believable adult eye height, normally about 1.6–1.8 m above the snow.
- Specify whether the skier is standing, crouching, turning, stopped, or looking downhill; match camera pitch and horizon.
- Use a credible wide rectilinear perspective, usually around 24–28 mm equivalent, unless another view is requested.
- When looking down or skis should be visible, show exactly two skis with correct spacing, convergence, boots, and bindings.
- Do not force skis, hands, or poles into a forward-looking composition when they would not naturally enter the frame.
- Keep boots seated in bindings, poles gripped naturally, straps and baskets coherent, and equipment mechanically plausible.
- Show weight and contact through compressed snow, edge marks, tracks, spray, and grounded shadows.
- Build believable alpine terrain with varied trees, readable slope direction, natural snow texture, mountain scale, and functional resort infrastructure.
- Keep patrol or rescue scenes calm, non-graphic, anatomically plausible, and operationally credible.
- Keep background plates free of AR interfaces, markers, alerts, text, or overlays unless the user requests them.

For related images or video keyframes, lock:

- location geometry, trail features, tree clusters, ridge silhouette, lifts, and buildings;
- eye height, lens class, horizon, framing, aspect ratio, and projection;
- time, weather, sun direction, exposure, white balance, and snow condition;
- people, wardrobe, equipment identity, colors, counts, and relative positions;
- action state, changing only what can physically occur between frames.

Reuse an approved reference image when supported. Preserve fixed landmarks and equipment even if the action or viewing direction changes. Start and end keyframes must share geography, identity, lighting, dimensions, and projection, with traceable motion rather than teleporting objects.

A wide image is not automatically a 360° panorama. A true equirectangular panorama requires exact 2:1 framing, 360° horizontal by 180° vertical coverage, a seamless left-right boundary, coherent poles, and validation in a spherical viewer. Never label an ultrawide rectilinear image as VR-ready.

## Quality Check

- [ ] **Realism:** Lighting, shadows, reflections, materials, exposure, and atmosphere are physically plausible.
- [ ] **Perspective:** Camera height, horizon, scale, depth, lens behavior, and projection match the intended view.
- [ ] **Anatomy and equipment:** Bodies, hands, skis, bindings, poles, clothing, and object connections are correct and grounded.
- [ ] **Continuity:** Geography, people, equipment, lighting, framing, and keyframe changes remain consistent.
- [ ] **Artifacts:** No duplicated or fused forms, warped geometry, cloned patterns, floating objects, garbled text, watermarks, or unintended UI/AR elements appear.
- [ ] **User request:** Required subjects, actions, mood, composition, aspect ratio, and exclusions are followed without unnecessary embellishment.
