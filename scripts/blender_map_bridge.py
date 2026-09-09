"""Use the installed Blender addon's null-delimited localhost protocol."""
import json
import socket
import sys
from pathlib import Path

code = Path(sys.argv[1]).read_text(encoding='utf-8') if len(sys.argv) > 1 else "import bpy; result = {'version': bpy.app.version_string, 'file': bpy.data.filepath, 'objects': len(bpy.context.scene.objects)}"
with socket.create_connection(('127.0.0.1', 9876), timeout=15) as connection:
    connection.settimeout(180)
    connection.sendall(json.dumps({'type': 'execute', 'code': code, 'strict_json': True}).encode() + b'\0')
    response = b''
    while b'\0' not in response:
        block = connection.recv(65536)
        if not block:
            break
        response += block
    payload = json.loads(response.split(b'\0')[0])
    print(json.dumps(payload, ensure_ascii=True))
    if payload.get('status') != 'ok':
        sys.exit(1)
