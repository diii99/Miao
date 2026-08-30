---
name: lux3d
description: "Use the Lux3D Global environment to generate 3D from image URLs or text, transfer materials onto an existing model, complete additional viewpoints from one object image, export model formats, and query task status or generation history. Use for image-to-3D, text-to-3D, text plus reference image, material transfer, four-view completion, USDZ/OBJ/FBX export, task queries, or task lists."
---

# Lux3D Global

Use **lux3d_client.py** in this directory to call the public Lux3D API. Before running a command, change to this Skill directory or replace the script name in the examples with its absolute path. This package defaults to the Global environment:

~~~text
https://api.aholo3d.com/global
~~~

Use only the public endpoints and fields listed here. Do not add business-type fields or internal versions.

## Before Calling

1. Apply for a key on the [Global API Key page](https://labs.aholo3d.com/api-keys).
2. Set the environment:

   ~~~bash
   export LUX3D_API_KEY="your_api_key"
   export LUX3D_REGION="international"
   ~~~

3. **img**, **imgs**, **meshUrl**, and **modelUrl** must be HTTP(S) URLs accessible to Lux3D. For a local file, upload it first with the [Asset upload APIs](https://labs.aholo3d.com/api-docs/en/api-reference#tag/asset), then use the returned URL.
4. Global and China API Keys are not interchangeable. This Skill defaults to Global; do not mix it with the China endpoint.
5. Pass the API Key directly in the authentication header, without a Bearer prefix:

   ~~~text
   Authorization: <API Key>
   ~~~

Install the dependency:

~~~bash
pip install requests
~~~

## Choose a Capability

Select one creation endpoint for the request:

| Need | Capability |
| --- | --- |
| One or more object images and a 3D model | Image-to-3D |
| A text description, optionally with one reference image | Text-to-3D |
| An existing GLB that needs material transfer from an image | Material transfer |
| Optional multi-view completion before a G1-Turbo generation request | Image-to-four-view -> G1-Turbo image-to-3D |
| Additional formats from a Lux3D ZIP or GLB | Multi-format export |

For image-to-3D and text-to-3D, pass the input directly to **G1** without assembling other capabilities around it. **G1-Turbo** can run as a lightweight atomic capability on its own; when the user wants more control through multi-view input, they may optionally complete viewpoints first and pass the results as **imgs**. If the user did not specify a version and the request does not distinguish them, ask before creating the task.

A create endpoint returns a **taskid**. Query that task afterward; poll every 10-15 seconds.

## 1. Image-to-3D

**version** is required. Pass **img** for a single image or **imgs** for multiple images, never both. **imgs** accepts 1-32 URLs of the same subject; put the clearest and most complete view first.

### G1

Pass only these fields:

| Field | Required | How to pass it |
| --- | :---: | --- |
| **img** | Conditional | One image URL; omit when using **imgs** |
| **imgs** | Conditional | 1-32 image URLs; omit when using **img** |
| **version** | Yes | Pass **G1** |
| **faceCount** | No | Mesh face count in [10000, 300000]; default 200000; does not affect PLY |
| **outputFormat** | No | A non-duplicated list of **zip**, **glb**, and **ply**. Omission, an empty list, or a list without **ply** returns ZIP + GLB; including **ply** returns ZIP + GLB + PLY |
| **aiPredictSize** | No | Omit or pass **true** to predict and scale size; pass **false** to disable |

Do not pass **enablePbr** for G1. Output order is always ZIP, GLB, optional PLY. Even ["ply"] returns all three outputs.

~~~bash
python lux3d_client.py image \
  "https://example.com/object.jpg" \
  --version G1
~~~

Multiple images:

~~~bash
python lux3d_client.py image \
  "https://example.com/front.jpg" \
  --image-view "https://example.com/side.jpg" \
  --version G1 --format ply
~~~

### G1-Turbo

Pass only these fields:

| Field | Required | How to pass it |
| --- | :---: | --- |
| **img** | Conditional | One image URL; omit when using **imgs** |
| **imgs** | Conditional | 1-32 image URLs; omit when using **img** |
| **version** | Yes | Pass **G1-Turbo** |
| **faceCount** | No | Mesh face count in [10000, 300000]; default 200000; does not affect PLY |
| **outputFormat** | No | Any non-duplicated individual or combined **zip**, **glb**, and **ply** values; omission or an empty list is treated as ["zip"] |
| **enablePbr** | No | For ZIP/GLB, omit or pass **true** for a textured Mesh and **false** for a white Mesh; omit for PLY-only |
| **aiPredictSize** | No | Omit or pass **true** to predict and scale size; pass **false** to disable |

~~~bash
python lux3d_client.py image \
  "https://example.com/object.jpg" \
  --version G1-Turbo --format glb --no-pbr
~~~

PLY-only:

~~~bash
python lux3d_client.py image \
  "https://example.com/object.jpg" \
  --version G1-Turbo --format ply
~~~

## 2. Text-to-3D

**prompt** and **version** are required. **style** is optional. For visual guidance, pass one **img** URL; do not pass **imgs**.

Supported **style** values:

~~~text
photorealistic, cartoon, anime, hand_painted, cyberpunk, fantasy, glass
~~~

The default style is **photorealistic**.

### G1

| Field | Required | How to pass it |
| --- | :---: | --- |
| **prompt** | Yes | Non-empty text describing the subject, material, style, and key details |
| **style** | No | Use one value from the list above |
| **img** | No | One accessible reference-image URL |
| **version** | Yes | Pass **G1** |
| **faceCount** | No | Mesh face count in [10000, 300000]; default 200000; does not affect PLY |
| **outputFormat** | No | A non-duplicated list of **zip**, **glb**, and **ply**. A list without **ply** returns ZIP + GLB; including **ply** appends PLY |
| **aiPredictSize** | No | Omit or pass **true** to predict and scale size; pass **false** to disable |

Do not pass **enablePbr**.

~~~bash
python lux3d_client.py text \
  "A modern dining chair with visible wood grain" \
  --style photorealistic --version G1
~~~

### G1-Turbo

| Field | Required | How to pass it |
| --- | :---: | --- |
| **prompt** | Yes | Non-empty text describing the subject, material, style, and key details |
| **style** | No | Use one value from the list above |
| **img** | No | One accessible reference-image URL |
| **version** | Yes | Pass **G1-Turbo** |
| **faceCount** | No | Mesh face count in [10000, 300000]; default 200000; does not affect PLY |
| **outputFormat** | No | Any non-duplicated individual or combined **zip**, **glb**, and **ply** values; omission or an empty list is treated as ["zip"] |
| **enablePbr** | No | For ZIP/GLB, omit or pass **true** for a textured Mesh and **false** for a white Mesh; omit for PLY-only |
| **aiPredictSize** | No | Omit or pass **true** to predict and scale size; pass **false** to disable |

~~~bash
python lux3d_client.py text \
  "A futuristic desk lamp" \
  --image "https://example.com/reference.png" \
  --version G1-Turbo --format glb
~~~

## 3. Material Transfer

This endpoint uses only **v3.0-standard**:

| Field | Required | How to pass it |
| --- | :---: | --- |
| **img** | Yes | Material reference-image URL |
| **meshUrl** | Yes | URL of the GLB to retexture |
| **version** | Yes | Pass **v3.0-standard** |
| **outputFormat** | No | A non-duplicated list of **zip**, **glb**, **usdz**, **obj_zip**, and **fbx_zip**. Omission or an empty list returns ZIP + GLB; include other values when needed |
| **aiPredictSize** | No | Pass **true** for automatic size prediction and omit **customSize**; pass **false** or omit to preserve size or set a height |
| **customSize** | No | Model height in millimetres, greater than 0; set **aiPredictSize** to **false** or omit it |

~~~bash
python lux3d_client.py material \
  "https://example.com/material.png" \
  --mesh-url "https://example.com/model.glb" \
  --version v3.0-standard --format usdz
~~~

## 4. Image-to-Four-View

Pass one object image URL to complete additional viewpoints. This endpoint does not generate a 3D model and accepts only **img**.

~~~bash
python lux3d_client.py four-view "https://example.com/object.jpg"
~~~

On success, it returns four image URLs. The API stores them as a JSON-array string in one output item; the client parses that value into a list.

G1-Turbo accepts either one image or multiple images directly. Check the input first: when it has a plain background, or its background has been removed and it contains only the target object to generate, pass the single image directly as **img**. Viewpoints and structural details that are not visible in the image are inferred from the available information. Offer the following composition when the user wants to reduce that inference, gain more control over unseen viewpoints, or provide missing viewpoint information:

~~~text
Single image -> Image-to-four-view -> Review and approve -> imgs -> G1-Turbo image-to-3D
~~~

~~~python
from lux3d_client import generate_four_views

four_view_urls = generate_four_views("https://example.com/object.jpg")
print(four_view_urls)
~~~

Show the four images or their URLs to the user and confirm that the subject structure, orientation, and viewpoints match expectations. Do not create the G1-Turbo task until the user explicitly approves the results. After approval, continue with:

~~~python
from lux3d_client import create_image_to_3d_task

task_id = create_image_to_3d_task(
    imgs=four_view_urls,
    version="G1-Turbo",
)
~~~

If the order needs adjustment, put the clearest and most complete view first in **imgs**.

This is only a recommended optional enhancement, not a prerequisite for G1-Turbo. If the user asks to call G1-Turbo directly, pass the single image as **img**; do not force multi-view completion or block the call because four-view results are absent. For G1, pass the original input directly and do not add a four-view task to the workflow.

## 5. Multi-Format Export

**modelUrl** must be an accessible .zip or .glb URL. A ZIP input must come from a Lux3D generation task.

| Input | **outputFormat** rule |
| --- | --- |
| GLB | Pass at least one of **usdz**, **obj_zip**, or **fbx_zip** |
| ZIP | Omit or pass an empty list to return GLB, or request one or more export formats above |

~~~bash
python lux3d_client.py export \
  "https://example.com/model.glb" \
  --format usdz --format obj_zip
~~~

## 6. Query One Task

Query once:

~~~bash
python lux3d_client.py query 1256173
~~~

Poll from Python:

~~~python
from lux3d_client import query_task_status

outputs = query_task_status("1256173")
~~~

Public statuses:

| Status | Meaning |
| --- | --- |
| 0 | Initialized |
| 1 | Running |
| 3 | Succeeded |
| 4 | Failed |
| 6 | Cancelled |

After success, read results from **d.outputs[].content**. Result URLs expire after 2 hours, so save them promptly.

## 7. List Generation Tasks

~~~bash
python lux3d_client.py list \
  --page 1 --pagesize 20 --status 3 \
  --starttime 1786590000000 --endtime 1786600000000
~~~

- **page** is one-based and defaults to 1
- **pagesize** is 1-100 and defaults to 20
- **status** may be 0, 1, 3, 4, or 6
- Times are Unix milliseconds and use the interval [starttime, endtime)
- Omit unused filters

## Python Creation Functions

Use the functions in endpoint order:

~~~python
from lux3d_client import (
    create_image_to_3d_task,
    create_text_to_3d_task,
    create_material_transfer_task,
    create_image_to_four_view_task,
    create_multi_format_export_task,
    get_task,
    list_tasks,
)
~~~

Pass only the fields listed for the selected version. For example:

~~~python
task_id = create_image_to_3d_task(
    img="https://example.com/object.jpg",
    version="G1",
    outputFormat=["ply"],
)
~~~

## Tasks and Credits

Image-to-3D, text-to-3D, and material transfer share the account concurrency limit:

| Account | Concurrent in-progress tasks |
| --- | :---: |
| Free | 2 |
| Pro | 5 |

If the API returns **GENERATION_CONCURRENCY_LIMIT_EXCEEDED**, wait for an existing task to finish before retrying. The rejected request does not create a task or consume credits. See [Lux3D Pricing](https://www.aholo3d.com/pricing) for plans and credits.

## References

- [API Key](https://labs.aholo3d.com/api-keys)
- [Asset upload APIs](https://labs.aholo3d.com/api-docs/en/api-reference#tag/asset)
- [Lux3D Pricing](https://www.aholo3d.com/pricing)
- Contact: lux3d@qunhemail.com
