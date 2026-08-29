## Description:

Use the Lux3D Global environment to generate 3D from image URLs or text, transfer materials onto an existing model, complete additional viewpoints from one object image, export model formats, and query task status or generation history.

This skill is ready for commercial/non-commercial use.

## Publisher:

[violalulu](https://clawhub.ai/user/violalulu)

### License/Terms of Use:

MIT-0

## Use Case:

Developers and content-production agents use this skill to call Lux3D APIs for image-to-3D, text-to-3D, material transfer, four-view completion, model export, task queries, and task history workflows.

### Deployment Geography for Use:

Global

## Known Risks and Mitigations:

Risk: The Lux3D API key and task data can be sent to a caller- or environment-selected base URL.

Mitigation: Use the documented Lux3D Global endpoint by default, keep LUX3D_API_KEY scoped to this service, and do not set LUX3D_BASE_URL or pass --base-url unless the endpoint is fully trusted.

Risk: Prompts and asset URLs are sent to Lux3D during generation, export, query, and history workflows.

Mitigation: Use only assets and prompts you are comfortable sending to Lux3D, and ensure referenced URLs are intentionally accessible to the service.

## Reference(s):

- [ClawHub skill page](https://clawhub.ai/violalulu/skills/lux3d)
- [Lux3D Global API Key page](https://labs.aholo3d.com/api-keys)
- [Lux3D Asset upload APIs](https://labs.aholo3d.com/api-docs/en/api-reference#tag/asset)
- [Lux3D Pricing](https://www.aholo3d.com/pricing)

## Skill Output:

**Output Type(s):** [Guidance, Shell commands, Code, API Calls, Configuration]

**Output Format:** [Markdown with inline bash and Python code blocks, JSON API responses, and generated 3D asset URLs]

**Output Parameters:** [1D]

**Other Properties Related to Output:** [May return Lux3D task identifiers, status data, downloadable model URLs, or local downloaded files when an output path is supplied.]

## Skill Version(s):

4.1.2 (source: server release metadata)

## Ethical Considerations:

Users should evaluate whether this skill is appropriate for their environment, review any generated or modified files before relying on them, and apply their organization's safety, security, and compliance requirements before deployment.
