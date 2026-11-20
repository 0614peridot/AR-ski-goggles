"""Serve this folder over HTTPS so a Meta Quest on the same Wi-Fi can enter WebXR.

Usage:  python3 serve-https.py          (then open https://<this-mac-ip>:8443 on the Quest)

A self-signed certificate is created in .certs/ on first run. The Quest browser will
show a privacy warning once: choose "Advanced" → "Proceed".
"""
import http.server
import os
import socket
import ssl
import subprocess

PORT = 8443
ROOT = os.path.dirname(os.path.abspath(__file__))
CERT_DIR = os.path.join(ROOT, ".certs")
CERT = os.path.join(CERT_DIR, "cert.pem")
KEY = os.path.join(CERT_DIR, "key.pem")


def local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def ensure_cert(ip):
    if os.path.exists(CERT) and os.path.exists(KEY):
        return
    os.makedirs(CERT_DIR, exist_ok=True)
    subprocess.run(
        [
            "openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "365",
            "-keyout", KEY, "-out", CERT, "-subj", "/CN=ski-360-local",
            "-addext", f"subjectAltName=IP:{ip},IP:127.0.0.1,DNS:localhost",
        ],
        check=True,
        capture_output=True,
    )


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    # Byte-range support so the headset browser can stream and loop the MP4.
    def send_head(self):
        # Never serve hidden files/folders (e.g. .certs/key.pem, .git).
        if any(part.startswith(".") for part in self.path.split("?")[0].split("/") if part):
            self.send_error(404, "Not Found")
            return None
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not rng or not rng.startswith("bytes=") or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        start_s, _, end_s = rng[6:].split(",")[0].partition("-")
        try:
            if start_s:
                start, end = int(start_s), int(end_s) if end_s else size - 1
            else:
                start, end = size - int(end_s), size - 1
        except ValueError:
            return super().send_head()
        end = min(end, size - 1)
        if start > end or start >= size:
            self.send_error(416, "Requested Range Not Satisfiable")
            return None
        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        self._remaining = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        remaining = getattr(self, "_remaining", None)
        if remaining is None:
            return super().copyfile(source, outputfile)
        while remaining > 0:
            chunk = source.read(min(64 * 1024, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)
        self._remaining = None


if __name__ == "__main__":
    ip = local_ip()
    ensure_cert(ip)
    httpd = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(CERT, KEY)
    httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
    print(f"Open on Quest:  https://{ip}:{PORT}")
    print(f"Open on Mac:    https://localhost:{PORT}")
    httpd.serve_forever()
