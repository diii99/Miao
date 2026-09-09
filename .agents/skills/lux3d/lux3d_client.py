"""Public Lux3D API client.

The client accepts accessible HTTP(S) URLs. Upload local files with the Asset
upload API before calling a Lux3D task endpoint.
"""

import argparse
import json
import os
import sys
import time
import urllib.parse

import requests


CN_BASE_URL = "https://api.aholo3d.cn"
INTERNATIONAL_BASE_URL = "https://api.aholo3d.com/global"
REGION_BASE_URLS = {
    "cn": CN_BASE_URL,
    "international": INTERNATIONAL_BASE_URL,
}
ASSET_UPLOAD_DOCS = {
    "cn": "https://labs.aholo3d.cn/api-docs/api-reference#tag/asset",
    "international": "https://labs.aholo3d.com/api-docs/en/api-reference#tag/asset",
}

DEFAULT_REGION = "international"
REQUEST_TIMEOUT = 30
MAX_RETRIES = 3
RETRY_DELAY = 2
DEFAULT_POLL_ATTEMPTS = 60
DEFAULT_POLL_INTERVAL = 15
DOWNLOAD_CHUNK_SIZE = 1024 * 1024

SUPPORTED_STYLES = {
    "photorealistic",
    "cartoon",
    "anime",
    "hand_painted",
    "cyberpunk",
    "fantasy",
    "glass",
}
GENERATION_VERSIONS = {"G1", "G1-Turbo"}
MATERIAL_VERSION = "v3.0-standard"
GENERATION_FORMATS = {"zip", "glb", "ply"}
MATERIAL_FORMATS = {"zip", "glb", "usdz", "obj_zip", "fbx_zip"}
EXPORT_FORMATS = {"usdz", "obj_zip", "fbx_zip"}
DOWNLOAD_FORMATS = GENERATION_FORMATS | MATERIAL_FORMATS
SUPPORTED_TASK_STATUSES = {0, 1, 3, 4, 6}
FACE_COUNT_MIN = 10000
FACE_COUNT_MAX = 300000


def get_api_key():
    """Read the API key from the environment."""
    return os.environ.get("LUX3D_API_KEY", "").strip()


def validate_api_key():
    """Return the configured API key or raise a useful error."""
    api_key = get_api_key()
    if not api_key or api_key in {"your_lux3d_api_key", "your_api_key"}:
        raise ValueError(
            "API key not configured. Set LUX3D_API_KEY to a Lux3D API key."
        )
    return api_key


def normalize_region(region=None):
    """Normalize supported region aliases and reject unknown values."""
    value = region
    if value is None:
        value = os.environ.get("LUX3D_REGION", DEFAULT_REGION)
    value = str(value).strip().lower()
    aliases = {
        "cn": "cn",
        "china": "cn",
        "domestic": "cn",
        "international": "international",
        "global": "international",
        "intl": "international",
    }
    if value not in aliases:
        raise ValueError("region must be 'cn' or 'international'")
    return aliases[value]


def get_base_url(region=None):
    """Return the configured Lux3D API root."""
    configured = os.environ.get("LUX3D_BASE_URL", "").strip()
    if configured:
        return normalize_base_url(configured, region)
    return REGION_BASE_URLS[normalize_region(region)]


def normalize_base_url(base_url=None, region=None):
    """Normalize a custom base URL to the documented Lux3D API root."""
    if not base_url:
        base_url = os.environ.get("LUX3D_BASE_URL", "").strip()
        if not base_url:
            return REGION_BASE_URLS[normalize_region(region)]
    normalized = str(base_url).strip().rstrip("/")
    if normalized == "https://api.aholo3d.com":
        return INTERNATIONAL_BASE_URL
    if normalized == CN_BASE_URL:
        return CN_BASE_URL
    return normalized


def get_asset_upload_docs(region=None):
    """Return the Asset upload documentation for a region."""
    return ASSET_UPLOAD_DOCS[normalize_region(region)]


def validate_http_url(value, field_name, region=None):
    """Validate a public HTTP(S) URL used by an API file field."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field_name} must be a non-empty HTTP(S) URL")
    normalized = value.strip()
    parsed = urllib.parse.urlparse(normalized)
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.netloc:
        docs = get_asset_upload_docs(region)
        raise ValueError(
            f"{field_name} must be an accessible HTTP(S) URL. "
            f"Upload local files first: {docs}"
        )
    return normalized


def validate_url_suffix(value, field_name, suffixes, region=None):
    """Validate a URL and its decoded path suffix."""
    normalized = validate_http_url(value, field_name, region)
    path = urllib.parse.unquote(urllib.parse.urlparse(normalized).path).lower()
    if not any(path.endswith(suffix) for suffix in suffixes):
        expected = " or ".join(suffixes)
        raise ValueError(f"{field_name} URL path must end with {expected}")
    return normalized


def validate_output_path(output_path):
    """Validate that an output path can be written."""
    output_dir = os.path.dirname(os.path.abspath(output_path)) or "."
    if not os.path.isdir(output_dir):
        raise ValueError(f"Output directory does not exist: {output_dir}")


def validate_prompt(prompt):
    """Validate a text-to-3D prompt."""
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("prompt must be non-empty text")
    return prompt.strip()


def validate_style(style):
    """Validate an optional text-to-3D style."""
    if style is None:
        return None
    if style not in SUPPORTED_STYLES:
        supported = ", ".join(sorted(SUPPORTED_STYLES))
        raise ValueError(f"Unsupported style '{style}'. Supported styles: {supported}")
    return style


def validate_boolean(value, name):
    """Validate an optional boolean field."""
    if value is None:
        return None
    if not isinstance(value, bool):
        raise ValueError(f"{name} must be a boolean")
    return value


def validate_version(version):
    """Validate the required image/text generation version."""
    if version not in GENERATION_VERSIONS:
        raise ValueError("version is required and must be 'G1' or 'G1-Turbo'")
    return version


def validate_material_version(version):
    """Validate the required material-transfer version."""
    if version != MATERIAL_VERSION:
        raise ValueError(f"version is required and must be '{MATERIAL_VERSION}'")
    return version


def validate_face_count(faceCount):
    """Validate the target Mesh face count."""
    if faceCount is None:
        return None
    if not isinstance(faceCount, int) or isinstance(faceCount, bool):
        raise ValueError("faceCount must be an integer")
    if not FACE_COUNT_MIN <= faceCount <= FACE_COUNT_MAX:
        raise ValueError(
            f"faceCount must be in [{FACE_COUNT_MIN}, {FACE_COUNT_MAX}]"
        )
    return faceCount


def normalize_output_formats(outputFormat):
    """Normalize outputFormat while preserving order and rejecting duplicates."""
    if outputFormat is None:
        return None
    if isinstance(outputFormat, str):
        formats = [outputFormat]
    elif isinstance(outputFormat, (list, tuple)):
        formats = list(outputFormat)
    else:
        raise ValueError("outputFormat must be a string or an ordered list of strings")
    if any(not isinstance(item, str) for item in formats):
        raise ValueError("outputFormat values must be strings")
    if len(formats) != len(set(formats)):
        raise ValueError("outputFormat must not contain duplicate values")
    return formats


def validate_allowed_formats(outputFormat, allowed, label):
    """Validate outputFormat against one endpoint's public values."""
    formats = normalize_output_formats(outputFormat)
    invalid = [item for item in formats or [] if item not in allowed]
    if invalid:
        supported = ", ".join(sorted(allowed))
        raise ValueError(f"{label} supports only: {supported}")
    return formats


def validate_generation_options(version, outputFormat=None, enablePbr=None):
    """Validate version-specific image/text generation fields."""
    version = validate_version(version)
    formats = validate_allowed_formats(
        outputFormat, GENERATION_FORMATS, f"{version} generation"
    )
    validate_boolean(enablePbr, "enablePbr")
    if version == "G1" and enablePbr is not None:
        raise ValueError("enablePbr is not a G1 field; omit it for G1")
    if (
        version == "G1-Turbo"
        and formats == ["ply"]
        and enablePbr is not None
    ):
        raise ValueError("enablePbr must be omitted for a G1-Turbo PLY-only request")
    return formats


def validate_custom_size(customSize):
    """Validate a model height in millimetres."""
    if customSize is None:
        return None
    if isinstance(customSize, bool) or not isinstance(customSize, (int, float)):
        raise ValueError("customSize must be a number greater than 0")
    if customSize <= 0:
        raise ValueError("customSize must be a number greater than 0")
    return customSize


def validate_material_options(
    version, outputFormat=None, aiPredictSize=None, customSize=None
):
    """Validate material-transfer fields for v3.0-standard."""
    validate_material_version(version)
    formats = validate_allowed_formats(
        outputFormat, MATERIAL_FORMATS, "Material transfer"
    )
    validate_boolean(aiPredictSize, "aiPredictSize")
    validate_custom_size(customSize)
    if aiPredictSize is True and customSize is not None:
        raise ValueError("customSize must be omitted when aiPredictSize is true")
    return formats


def validate_export_options(modelUrl, outputFormat=None, region=None):
    """Validate multi-format export input and requested formats."""
    model_url = validate_url_suffix(
        modelUrl, "modelUrl", (".zip", ".glb"), region
    )
    formats = validate_allowed_formats(
        outputFormat, EXPORT_FORMATS, "Multi-format export"
    )
    path = urllib.parse.unquote(urllib.parse.urlparse(model_url).path).lower()
    if path.endswith(".glb") and not formats:
        raise ValueError(
            "outputFormat is required for GLB input and must include at least "
            "one of: usdz, obj_zip, fbx_zip"
        )
    return model_url, formats


def add_optional(payload, name, value):
    """Add a field only when the caller supplied it."""
    if value is not None:
        payload[name] = value


def generation_result_formats(version, outputFormat=None):
    """Return the documented output order for a generation request."""
    formats = normalize_output_formats(outputFormat)
    if version == "G1":
        result = ["zip", "glb"]
        if formats and "ply" in formats:
            result.append("ply")
        return result
    return formats or ["zip"]


def material_result_formats(outputFormat=None):
    """Return the documented material-transfer output order."""
    result = ["zip", "glb"]
    for item in normalize_output_formats(outputFormat) or []:
        if item not in result:
            result.append(item)
    return result


def export_result_formats(modelUrl, outputFormat=None):
    """Return expected output formats for a multi-format export request."""
    formats = normalize_output_formats(outputFormat)
    if formats:
        return formats
    path = urllib.parse.unquote(urllib.parse.urlparse(modelUrl).path).lower()
    return ["glb"] if path.endswith(".zip") else []


def output_extension(output_format):
    """Return the file extension for a public output format."""
    if output_format in {"obj_zip", "fbx_zip", "zip"}:
        return "zip"
    return output_format


def get_auth_headers():
    """Build the Lux3D authentication headers."""
    return {
        "Content-Type": "application/json",
        "Authorization": validate_api_key(),
    }


def secure_request(
    method,
    url,
    headers=None,
    data=None,
    timeout=None,
    retries=None,
    stream=False,
):
    """Perform an HTTP request with bounded retries."""
    method = method.upper()
    request_headers = {"Content-Type": "application/json"} if headers is None else headers
    timeout = REQUEST_TIMEOUT if timeout is None else timeout
    retries = (1 if method == "POST" else MAX_RETRIES) if retries is None else retries
    if not isinstance(retries, int) or isinstance(retries, bool) or retries < 1:
        raise ValueError("retries must be a positive integer")
    last_error = None
    for attempt in range(retries):
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=request_headers,
                json=data,
                timeout=timeout,
                stream=stream,
            )
            response.raise_for_status()
            return response
        except requests.exceptions.Timeout:
            last_error = f"Request timeout (attempt {attempt + 1}/{retries})"
        except requests.exceptions.RequestException as exc:
            last_error = f"Request failed: {exc}"
        if attempt < retries - 1:
            time.sleep(RETRY_DELAY)
    raise RuntimeError(f"Request failed after {retries} attempts: {last_error}")


def ensure_success(result):
    """Validate create, query, and list response envelopes."""
    code = result.get("c")
    if code not in (None, "", 0, "0"):
        message = result.get("m") or "unknown error"
        raise RuntimeError(f"API error: {message} (code={code})")
    return result


def submit_task(path, payload, base_url=None, region=None):
    """Submit an asynchronous task and return its task ID."""
    url = normalize_base_url(base_url, region) + path
    response = secure_request(
        "POST", url, headers=get_auth_headers(), data=payload
    )
    try:
        result = response.json()
    except ValueError as exc:
        raise RuntimeError(f"Invalid JSON response: {response.text}") from exc
    ensure_success(result)
    task_id = result.get("d")
    if task_id in (None, ""):
        raise RuntimeError(f"Missing task ID in response: {result}")
    return str(task_id)


def create_image_to_3d_task(
    img=None,
    *,
    imgs=None,
    version,
    faceCount=None,
    outputFormat=None,
    enablePbr=None,
    aiPredictSize=None,
    base_url=None,
    region=None,
):
    """Create an image-to-3D task from one URL or 1-32 URL inputs."""
    if (img is None) == (imgs is None):
        raise ValueError("Pass exactly one of img or imgs")
    payload = {}
    if img is not None:
        payload["img"] = validate_http_url(img, "img", region)
    else:
        if not isinstance(imgs, (list, tuple)):
            raise ValueError("imgs must be an ordered list of 1-32 image URLs")
        if not 1 <= len(imgs) <= 32:
            raise ValueError("imgs must contain 1-32 image URLs")
        payload["imgs"] = [
            validate_http_url(item, f"imgs[{index}]", region)
            for index, item in enumerate(imgs)
        ]

    payload["version"] = validate_version(version)
    formats = validate_generation_options(version, outputFormat, enablePbr)
    add_optional(payload, "faceCount", validate_face_count(faceCount))
    if outputFormat is not None:
        payload["outputFormat"] = formats
    add_optional(payload, "enablePbr", enablePbr)
    add_optional(
        payload, "aiPredictSize", validate_boolean(aiPredictSize, "aiPredictSize")
    )
    return submit_task(
        "/lux3d/v1/generate/img-to-3d/task/create",
        payload,
        base_url=base_url,
        region=region,
    )


def create_task(img=None, **kwargs):
    """Backward-compatible name for create_image_to_3d_task."""
    return create_image_to_3d_task(img, **kwargs)


def create_text_to_3d_task(
    prompt,
    *,
    version,
    style=None,
    img=None,
    faceCount=None,
    outputFormat=None,
    enablePbr=None,
    aiPredictSize=None,
    base_url=None,
    region=None,
):
    """Create a text-to-3D task with one optional reference-image URL."""
    payload = {
        "prompt": validate_prompt(prompt),
        "version": validate_version(version),
    }
    add_optional(payload, "style", validate_style(style))
    if img is not None:
        payload["img"] = validate_http_url(img, "img", region)
    formats = validate_generation_options(version, outputFormat, enablePbr)
    add_optional(payload, "faceCount", validate_face_count(faceCount))
    if outputFormat is not None:
        payload["outputFormat"] = formats
    add_optional(payload, "enablePbr", enablePbr)
    add_optional(
        payload, "aiPredictSize", validate_boolean(aiPredictSize, "aiPredictSize")
    )
    return submit_task(
        "/lux3d/v1/generate/text-to-3d/task/create",
        payload,
        base_url=base_url,
        region=region,
    )


def create_material_transfer_task(
    img,
    meshUrl,
    *,
    version,
    outputFormat=None,
    aiPredictSize=None,
    customSize=None,
    base_url=None,
    region=None,
):
    """Create a v3.0-standard material-transfer task."""
    formats = validate_material_options(
        version, outputFormat, aiPredictSize, customSize
    )
    payload = {
        "img": validate_http_url(img, "img", region),
        "meshUrl": validate_http_url(meshUrl, "meshUrl", region),
        "version": validate_material_version(version),
    }
    if outputFormat is not None:
        payload["outputFormat"] = formats
    add_optional(
        payload, "aiPredictSize", validate_boolean(aiPredictSize, "aiPredictSize")
    )
    add_optional(payload, "customSize", validate_custom_size(customSize))
    return submit_task(
        "/lux3d/v1/generate/material-transfer/task/create",
        payload,
        base_url=base_url,
        region=region,
    )


def create_image_to_four_view_task(
    img, *, base_url=None, region=None
):
    """Create a single-image viewpoint-completion task."""
    payload = {"img": validate_http_url(img, "img", region)}
    return submit_task(
        "/lux3d/v1/generate/image-to-four-view/task/create",
        payload,
        base_url=base_url,
        region=region,
    )


def create_multi_format_export_task(
    modelUrl,
    *,
    outputFormat=None,
    base_url=None,
    region=None,
):
    """Create a multi-format export task for a Lux3D ZIP or GLB URL."""
    model_url, formats = validate_export_options(
        modelUrl, outputFormat, region
    )
    payload = {"modelUrl": model_url}
    if outputFormat is not None:
        payload["outputFormat"] = formats
    return submit_task(
        "/lux3d/v1/multi-format-export/task/create",
        payload,
        base_url=base_url,
        region=region,
    )


def get_task(task_id, base_url=None, region=None):
    """Query one Lux3D task once and return the public task object."""
    if task_id in (None, ""):
        raise ValueError("task_id is required")
    url = (
        normalize_base_url(base_url, region)
        + "/lux3d/v1/generate/task/get?taskid="
        + urllib.parse.quote(str(task_id))
    )
    response = secure_request("GET", url, headers=get_auth_headers())
    try:
        result = response.json()
    except ValueError as exc:
        raise RuntimeError(f"Invalid JSON response: {response.text}") from exc
    ensure_success(result)
    task_data = result.get("d")
    if not isinstance(task_data, dict):
        raise RuntimeError(f"Missing task data in response: {result}")
    return task_data


def infer_artifact_format(url):
    """Infer a public artifact format from a result URL when possible."""
    path = urllib.parse.unquote(urllib.parse.urlparse(url).path).lower()
    filename = path.rsplit("/", 1)[-1]
    if filename.endswith(("_obj.zip", ".obj.zip", "obj.zip")):
        return "obj_zip"
    if filename.endswith(("_fbx.zip", ".fbx.zip", "fbx.zip")):
        return "fbx_zip"
    if filename.endswith(".usdz"):
        return "usdz"
    if filename.endswith(".glb"):
        return "glb"
    if filename.endswith(".ply"):
        return "ply"
    if filename.endswith(".zip"):
        return "zip"
    return None


def parse_task_outputs(task_data):
    """Parse result URLs without discarding their documented order."""
    contents = []
    for output in task_data.get("outputs") or []:
        if not isinstance(output, dict):
            continue
        content = output.get("content")
        if isinstance(content, str):
            content = content.strip()
        if content and str(content).upper() != "NOT_REQUESTED":
            contents.append(content)
    if not contents:
        raise RuntimeError(f"Task succeeded without output content: {task_data}")

    if len(contents) == 1 and isinstance(contents[0], str):
        try:
            view_urls = json.loads(contents[0])
        except (TypeError, ValueError):
            view_urls = None
        if (
            isinstance(view_urls, list)
            and len(view_urls) == 4
            and all(isinstance(item, str) for item in view_urls)
        ):
            return [
                validate_http_url(item, f"fourView[{index}]")
                for index, item in enumerate(view_urls)
            ]

    artifacts = {}
    for content in contents:
        if not isinstance(content, str):
            break
        output_format = infer_artifact_format(content)
        if output_format is None or output_format in artifacts:
            break
        artifacts[output_format] = content
    else:
        return artifacts
    return contents[0] if len(contents) == 1 else contents


def query_task_status(
    task_id,
    base_url=None,
    region=None,
    max_attempts=DEFAULT_POLL_ATTEMPTS,
    interval=DEFAULT_POLL_INTERVAL,
):
    """Poll a task until it succeeds, fails, or is cancelled."""
    if not isinstance(max_attempts, int) or max_attempts < 1:
        raise ValueError("max_attempts must be a positive integer")
    if not isinstance(interval, (int, float)) or interval < 0:
        raise ValueError("interval must be a non-negative number")
    for attempt in range(max_attempts):
        task_data = get_task(task_id, base_url=base_url, region=region)
        status = task_data.get("status")
        if status == 3:
            return parse_task_outputs(task_data)
        if status == 4:
            raise RuntimeError(f"Task failed: {task_data}")
        if status == 6:
            raise RuntimeError(f"Task was cancelled: {task_data}")
        if status not in {0, 1}:
            raise RuntimeError(f"Unknown task status: {status}")
        if attempt < max_attempts - 1:
            time.sleep(interval)
    raise TimeoutError("Task did not finish before the polling limit")


def list_tasks(
    page=1,
    pagesize=20,
    status=None,
    starttime=None,
    endtime=None,
    base_url=None,
    region=None,
):
    """List tasks for the current API-key account."""
    if not isinstance(page, int) or isinstance(page, bool) or page < 1:
        raise ValueError("page must be a positive integer")
    if (
        not isinstance(pagesize, int)
        or isinstance(pagesize, bool)
        or not 1 <= pagesize <= 100
    ):
        raise ValueError("pagesize must be an integer between 1 and 100")
    if (
        status is not None
        and (
            not isinstance(status, int)
            or isinstance(status, bool)
            or status not in SUPPORTED_TASK_STATUSES
        )
    ):
        raise ValueError("status must be one of 0, 1, 3, 4, or 6")
    for name, value in (("starttime", starttime), ("endtime", endtime)):
        if (
            value is not None
            and (
                not isinstance(value, int)
                or isinstance(value, bool)
                or value < 0
            )
        ):
            raise ValueError(
                f"{name} must be a non-negative Unix timestamp in milliseconds"
            )
    if starttime is not None and endtime is not None and starttime >= endtime:
        raise ValueError("starttime must be earlier than endtime")

    params = {"page": page, "pagesize": pagesize}
    for name, value in (
        ("status", status),
        ("starttime", starttime),
        ("endtime", endtime),
    ):
        if value is not None:
            params[name] = value
    url = (
        normalize_base_url(base_url, region)
        + "/lux3d/v1/generate/task/list?"
        + urllib.parse.urlencode(params)
    )
    response = secure_request("GET", url, headers=get_auth_headers())
    try:
        result = response.json()
    except ValueError as exc:
        raise RuntimeError(f"Invalid JSON response: {response.text}") from exc
    ensure_success(result)
    return result.get("d") or {
        "items": [],
        "total": 0,
        "page": page,
        "pageSize": pagesize,
    }


def download_model(model_url, output_path):
    """Download one result URL and return the number of bytes written."""
    model_url = validate_http_url(model_url, "model_url")
    validate_output_path(output_path)
    response = secure_request("GET", model_url, headers={}, stream=True)
    total_size = 0
    with open(output_path, "wb") as file_obj:
        for chunk in response.iter_content(chunk_size=DOWNLOAD_CHUNK_SIZE):
            if chunk:
                file_obj.write(chunk)
                total_size += len(chunk)
    response.close()
    return total_size


def map_artifact_urls(outputs, expected_formats):
    """Map ordered or named task outputs to expected formats."""
    if isinstance(outputs, dict):
        missing = [item for item in expected_formats if item not in outputs]
        if missing:
            raise ValueError(
                "Missing expected result formats: " + ", ".join(missing)
            )
        return {item: outputs[item] for item in expected_formats}
    if isinstance(outputs, str) and len(expected_formats) == 1:
        return {expected_formats[0]: outputs}
    if (
        isinstance(outputs, list)
        and len(outputs) == len(expected_formats)
        and all(isinstance(item, str) for item in outputs)
    ):
        return dict(zip(expected_formats, outputs))
    raise ValueError("Task outputs do not match the expected result formats")


def download_requested_models(outputs, output_path, expected_formats):
    """Download all expected model artifacts in documented output order."""
    artifact_urls = map_artifact_urls(outputs, expected_formats)
    if len(expected_formats) == 1:
        output_format = expected_formats[0]
        path = output_path
        if not os.path.splitext(path)[1]:
            path = f"{path}.{output_extension(output_format)}"
        return [(path, download_model(artifact_urls[output_format], path))]

    output_base, _ = os.path.splitext(output_path)
    downloads = []
    for output_format in expected_formats:
        path = f"{output_base}_{output_format}.{output_extension(output_format)}"
        size = download_model(artifact_urls[output_format], path)
        downloads.append((path, size))
    return downloads


def complete_task(
    task_id,
    *,
    output_path=None,
    expected_formats=None,
    base_url=None,
    region=None,
    max_attempts=DEFAULT_POLL_ATTEMPTS,
    interval=DEFAULT_POLL_INTERVAL,
):
    """Wait for a task, optionally downloading all expected artifacts."""
    outputs = query_task_status(
        task_id,
        base_url=base_url,
        region=region,
        max_attempts=max_attempts,
        interval=interval,
    )
    if output_path is None:
        return outputs
    if not expected_formats:
        raise ValueError("expected_formats are required when downloading results")
    return download_requested_models(outputs, output_path, expected_formats)


def generate_3d_model(
    img=None,
    output_path=None,
    *,
    imgs=None,
    version,
    faceCount=None,
    outputFormat=None,
    enablePbr=None,
    aiPredictSize=None,
    base_url=None,
    region=None,
    max_attempts=DEFAULT_POLL_ATTEMPTS,
    interval=DEFAULT_POLL_INTERVAL,
):
    """Run the image-to-3D create, poll, and optional download workflow."""
    task_id = create_image_to_3d_task(
        img,
        imgs=imgs,
        version=version,
        faceCount=faceCount,
        outputFormat=outputFormat,
        enablePbr=enablePbr,
        aiPredictSize=aiPredictSize,
        base_url=base_url,
        region=region,
    )
    return complete_task(
        task_id,
        output_path=output_path,
        expected_formats=generation_result_formats(version, outputFormat),
        base_url=base_url,
        region=region,
        max_attempts=max_attempts,
        interval=interval,
    )


def generate_text_to_3d(
    prompt,
    output_path=None,
    *,
    version,
    style=None,
    img=None,
    faceCount=None,
    outputFormat=None,
    enablePbr=None,
    aiPredictSize=None,
    base_url=None,
    region=None,
    max_attempts=DEFAULT_POLL_ATTEMPTS,
    interval=DEFAULT_POLL_INTERVAL,
):
    """Run the text-to-3D create, poll, and optional download workflow."""
    task_id = create_text_to_3d_task(
        prompt,
        version=version,
        style=style,
        img=img,
        faceCount=faceCount,
        outputFormat=outputFormat,
        enablePbr=enablePbr,
        aiPredictSize=aiPredictSize,
        base_url=base_url,
        region=region,
    )
    return complete_task(
        task_id,
        output_path=output_path,
        expected_formats=generation_result_formats(version, outputFormat),
        base_url=base_url,
        region=region,
        max_attempts=max_attempts,
        interval=interval,
    )


def generate_material_transfer(
    img,
    meshUrl,
    output_path=None,
    *,
    version,
    outputFormat=None,
    aiPredictSize=None,
    customSize=None,
    base_url=None,
    region=None,
    max_attempts=DEFAULT_POLL_ATTEMPTS,
    interval=DEFAULT_POLL_INTERVAL,
):
    """Run the material-transfer create, poll, and optional download workflow."""
    task_id = create_material_transfer_task(
        img,
        meshUrl,
        version=version,
        outputFormat=outputFormat,
        aiPredictSize=aiPredictSize,
        customSize=customSize,
        base_url=base_url,
        region=region,
    )
    return complete_task(
        task_id,
        output_path=output_path,
        expected_formats=material_result_formats(outputFormat),
        base_url=base_url,
        region=region,
        max_attempts=max_attempts,
        interval=interval,
    )


def generate_four_views(
    img,
    *,
    base_url=None,
    region=None,
    max_attempts=DEFAULT_POLL_ATTEMPTS,
    interval=DEFAULT_POLL_INTERVAL,
):
    """Run the single-image viewpoint-completion workflow and return four URLs."""
    task_id = create_image_to_four_view_task(
        img, base_url=base_url, region=region
    )
    result = complete_task(
        task_id,
        base_url=base_url,
        region=region,
        max_attempts=max_attempts,
        interval=interval,
    )
    if not (
        isinstance(result, list)
        and len(result) == 4
        and all(isinstance(item, str) for item in result)
    ):
        raise RuntimeError("The four-view task did not return four image URLs")
    return result


def generate_multi_format_export(
    modelUrl,
    output_path=None,
    *,
    outputFormat=None,
    base_url=None,
    region=None,
    max_attempts=DEFAULT_POLL_ATTEMPTS,
    interval=DEFAULT_POLL_INTERVAL,
):
    """Run the multi-format export create, poll, and optional download workflow."""
    task_id = create_multi_format_export_task(
        modelUrl,
        outputFormat=outputFormat,
        base_url=base_url,
        region=region,
    )
    return complete_task(
        task_id,
        output_path=output_path,
        expected_formats=export_result_formats(modelUrl, outputFormat),
        base_url=base_url,
        region=region,
        max_attempts=max_attempts,
        interval=interval,
    )


def add_poll_arguments(parser):
    """Add shared polling controls to a CLI subcommand."""
    parser.add_argument(
        "--max-attempts", type=int, default=DEFAULT_POLL_ATTEMPTS
    )
    parser.add_argument(
        "--interval", type=float, default=DEFAULT_POLL_INTERVAL
    )


def add_generation_arguments(parser):
    """Add shared version-specific image/text generation options."""
    parser.add_argument(
        "--version", required=True, choices=sorted(GENERATION_VERSIONS)
    )
    parser.add_argument(
        "--face-count",
        dest="faceCount",
        type=int,
        default=None,
        help=f"Mesh face count in [{FACE_COUNT_MIN}, {FACE_COUNT_MAX}]",
    )
    parser.add_argument(
        "--format",
        dest="outputFormat",
        action="append",
        choices=sorted(GENERATION_FORMATS),
        default=None,
        help="Repeat to request multiple formats.",
    )
    pbr_group = parser.add_mutually_exclusive_group()
    pbr_group.add_argument(
        "--enable-pbr", dest="enablePbr", action="store_true"
    )
    pbr_group.add_argument(
        "--no-pbr", dest="enablePbr", action="store_false"
    )
    parser.set_defaults(enablePbr=None)
    size_group = parser.add_mutually_exclusive_group()
    size_group.add_argument(
        "--ai-predict-size", dest="aiPredictSize", action="store_true"
    )
    size_group.add_argument(
        "--no-ai-predict-size", dest="aiPredictSize", action="store_false"
    )
    parser.set_defaults(aiPredictSize=None)
    add_poll_arguments(parser)


def build_parser():
    """Build the public command-line interface."""
    parser = argparse.ArgumentParser(
        description="Lux3D client using accessible URL inputs."
    )
    parser.add_argument(
        "--region",
        "-r",
        choices=["cn", "international"],
        default=None,
        help="API region. Default for this package: international",
    )
    parser.add_argument(
        "--base-url",
        default=None,
        help="Override the API root; LUX3D_BASE_URL is also supported.",
    )
    subparsers = parser.add_subparsers(dest="command")

    image_parser = subparsers.add_parser(
        "image", help="Generate 3D from one or more accessible image URLs."
    )
    image_parser.add_argument("img", help="Primary accessible image URL")
    image_parser.add_argument(
        "output_path", nargs="?", help="Optional output path or filename base"
    )
    image_parser.add_argument(
        "--image-view",
        dest="imageViews",
        action="append",
        default=None,
        help="Additional accessible image URL; repeat up to 31 times.",
    )
    add_generation_arguments(image_parser)

    text_parser = subparsers.add_parser(
        "text", help="Generate 3D from text and an optional image URL."
    )
    text_parser.add_argument("prompt")
    text_parser.add_argument(
        "output_path", nargs="?", help="Optional output path or filename base"
    )
    text_parser.add_argument("--style", choices=sorted(SUPPORTED_STYLES))
    text_parser.add_argument(
        "--image", dest="img", help="Optional accessible reference-image URL"
    )
    add_generation_arguments(text_parser)

    material_parser = subparsers.add_parser(
        "material", help="Transfer materials using accessible image and GLB URLs."
    )
    material_parser.add_argument("img", help="Material reference image URL")
    material_parser.add_argument(
        "output_path", nargs="?", help="Optional output path or filename base"
    )
    material_parser.add_argument(
        "--mesh-url", dest="meshUrl", required=True, help="Accessible GLB URL"
    )
    material_parser.add_argument(
        "--version", required=True, choices=[MATERIAL_VERSION]
    )
    material_parser.add_argument(
        "--format",
        dest="outputFormat",
        action="append",
        choices=sorted(MATERIAL_FORMATS),
        default=None,
    )
    material_size_group = material_parser.add_mutually_exclusive_group()
    material_size_group.add_argument(
        "--ai-predict-size", dest="aiPredictSize", action="store_true"
    )
    material_size_group.add_argument(
        "--no-ai-predict-size", dest="aiPredictSize", action="store_false"
    )
    material_parser.set_defaults(aiPredictSize=None)
    material_parser.add_argument("--custom-size", dest="customSize", type=float)
    add_poll_arguments(material_parser)

    four_view_parser = subparsers.add_parser(
        "four-view", help="Complete four viewpoints from one object image URL."
    )
    four_view_parser.add_argument("img", help="Accessible object image URL")
    add_poll_arguments(four_view_parser)

    export_parser = subparsers.add_parser(
        "export", help="Export a Lux3D ZIP or GLB URL to other formats."
    )
    export_parser.add_argument("modelUrl", help="Accessible .zip or .glb URL")
    export_parser.add_argument(
        "output_path", nargs="?", help="Optional output path or filename base"
    )
    export_parser.add_argument(
        "--format",
        dest="outputFormat",
        action="append",
        choices=sorted(EXPORT_FORMATS),
        default=None,
    )
    add_poll_arguments(export_parser)

    query_parser = subparsers.add_parser("query", help="Query one task once.")
    query_parser.add_argument("task_id")

    list_parser = subparsers.add_parser(
        "list", help="List generation tasks for the current account."
    )
    list_parser.add_argument("--page", type=int, default=1)
    list_parser.add_argument("--pagesize", type=int, default=20)
    list_parser.add_argument(
        "--status",
        type=int,
        choices=sorted(SUPPORTED_TASK_STATUSES),
        default=None,
    )
    list_parser.add_argument("--starttime", type=int, default=None)
    list_parser.add_argument("--endtime", type=int, default=None)
    return parser


def print_result(result):
    """Print a CLI result without Python representation noise."""
    if isinstance(result, (dict, list, tuple)):
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(result)


def main():
    """Command-line entry point."""
    parser = build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        raise SystemExit(1)

    common = {"base_url": args.base_url, "region": args.region}
    if args.command == "image":
        image_urls = [args.img] + list(args.imageViews or [])
        image_input = (
            {"img": image_urls[0]} if len(image_urls) == 1 else {"imgs": image_urls}
        )
        result = generate_3d_model(
            output_path=args.output_path,
            version=args.version,
            faceCount=args.faceCount,
            outputFormat=args.outputFormat,
            enablePbr=args.enablePbr,
            aiPredictSize=args.aiPredictSize,
            max_attempts=args.max_attempts,
            interval=args.interval,
            **image_input,
            **common,
        )
    elif args.command == "text":
        result = generate_text_to_3d(
            args.prompt,
            output_path=args.output_path,
            version=args.version,
            style=args.style,
            img=args.img,
            faceCount=args.faceCount,
            outputFormat=args.outputFormat,
            enablePbr=args.enablePbr,
            aiPredictSize=args.aiPredictSize,
            max_attempts=args.max_attempts,
            interval=args.interval,
            **common,
        )
    elif args.command == "material":
        result = generate_material_transfer(
            args.img,
            args.meshUrl,
            output_path=args.output_path,
            version=args.version,
            outputFormat=args.outputFormat,
            aiPredictSize=args.aiPredictSize,
            customSize=args.customSize,
            max_attempts=args.max_attempts,
            interval=args.interval,
            **common,
        )
    elif args.command == "four-view":
        result = generate_four_views(
            args.img,
            max_attempts=args.max_attempts,
            interval=args.interval,
            **common,
        )
    elif args.command == "export":
        result = generate_multi_format_export(
            args.modelUrl,
            output_path=args.output_path,
            outputFormat=args.outputFormat,
            max_attempts=args.max_attempts,
            interval=args.interval,
            **common,
        )
    elif args.command == "query":
        result = get_task(args.task_id, **common)
    elif args.command == "list":
        result = list_tasks(
            page=args.page,
            pagesize=args.pagesize,
            status=args.status,
            starttime=args.starttime,
            endtime=args.endtime,
            **common,
        )
    else:
        parser.error(f"Unknown command: {args.command}")
        return
    print_result(result)


if __name__ == "__main__":
    try:
        main()
    except (ValueError, RuntimeError, TimeoutError) as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        raise SystemExit(1)
