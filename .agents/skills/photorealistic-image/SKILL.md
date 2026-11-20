---
name: photorealistic-image
description: Create or refine photorealistic images with Kling MCP from brief natural-language requests. Use for realistic photography, ski or action POV, alpine environments, clean AR background plates, image edits, related stills, and image-to-video keyframes. Do not use for standalone video generation or stylized illustration unless the user also requests photorealism.
---

# Photorealistic Image Generation

Turn the user's request into a concise, physically believable image prompt and generate it with the connected Kling MCP server. Preserve the requested subject, action, framing, and mood; favor photographic realism over generic cinematic styling.

## Routing

- Use the connected `kling` MCP server for image generation and editing. Do not route to the Kling CLI or another provider when Kling MCP is available.
- Inspect the live Kling MCP tools and supported parameters before calling them. Never invent tool names, model names, parameters, reference limits, or output capabilities.
- This skill controls prompt quality and visual continuity. Let the MCP server control authentication, available models, task submission, and result retrieval.
- If Kling MCP is unavailable or lacks the required capability, explain the limitation instead of silently switching providers.
- Do not start video generation unless explicitly requested. Route standalone video work to the relevant Kling video workflow.

## Workflow

1. Read [references/realistic-photo-skill.md](references/realistic-photo-skill.md) before constructing or evaluating the prompt.
2. Identify whether the deliverable is a still, edit, related image set, keyframe, or true 360° equirectangular panorama. Do not mislabel a wide still as a 360° panorama.
3. Infer only nonessential photographic details. Ask a question only when a missing choice would materially change the result.
4. Write a compact prompt covering subject and action, spatial layout, camera, light and weather, materials, physical constraints, and targeted artifact exclusions.
5. Generate with a verified Kling image tool and inspect the actual result when available. Do not claim visual inspection from metadata alone.
6. Check realism, perspective, anatomy and equipment, continuity, artifacts, and adherence to the request. Prefer structural correctness over dramatic styling.
7. For related frames or edits, reuse approved references when supported and preserve geography, camera, lighting, people, equipment, aspect ratio, and projection.

## Constraints

- Keep background plates free of AR interfaces, HUDs, text, logos, holograms, and watermarks unless explicitly requested.
- For ski POV scenes, use believable eye height and mechanically plausible skis, boots, bindings, poles, snow contact, terrain, and resort infrastructure.
- Preserve physically plausible lighting, shadows, reflections, materials, scale, occlusion, gravity, and weather effects.
- Use a true equirectangular workflow for requested 360° output; aspect ratio alone is insufficient.
- Do not submit unrequested variations, retries, or video jobs that may consume additional credits.

## Output

Return the generated image or result provided by Kling. Keep the explanation brief, noting only material limitations or continuity decisions.
