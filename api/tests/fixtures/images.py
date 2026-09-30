"""Test images (004 T002), generated in memory so no binaries live in the repo.

photo_ok.jpg carries GPS EXIF; too_big.jpg is over 5 MB; fake.jpg is a PDF with a .jpg
name; tiny.png is 100×100; logo.png is transparent.
"""

import io
import os

from PIL import Image


def photo_ok_jpg() -> bytes:
    image = Image.new("RGB", (800, 800), (200, 120, 40))
    exif = Image.Exif()
    exif[0x010F] = "Test Camera Maker"  # Make
    gps = {1: "N", 2: (24.0, 51.0, 36.0), 3: "E", 4: (67.0, 0.0, 36.0)}
    exif[0x8825] = gps  # GPSInfo
    out = io.BytesIO()
    image.save(out, "JPEG", exif=exif)
    return out.getvalue()


def too_big_jpg() -> bytes:
    # Random noise barely compresses, so this lands above 5 MB.
    image = Image.frombytes("RGB", (2400, 2400), os.urandom(2400 * 2400 * 3))
    out = io.BytesIO()
    image.save(out, "JPEG", quality=100)
    data = out.getvalue()
    assert len(data) > 5 * 1024 * 1024, len(data)
    return data


def fake_jpg() -> bytes:
    return b"%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << >>\n%%EOF\n"


def tiny_png() -> bytes:
    out = io.BytesIO()
    Image.new("RGB", (100, 100), (0, 128, 255)).save(out, "PNG")
    return out.getvalue()


def logo_png() -> bytes:
    image = Image.new("RGBA", (400, 200), (0, 0, 0, 0))
    for x in range(100, 300):
        for y in range(50, 150):
            image.putpixel((x, y), (255, 200, 0, 255))
    out = io.BytesIO()
    image.save(out, "PNG")
    return out.getvalue()
