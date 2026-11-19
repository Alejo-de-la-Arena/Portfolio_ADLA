"""Static TTF instances for ImageResponse (opengraph-image), which reads neither WOFF2 nor variable axes.

Derived from the same variable WOFF2 the site uses, with the values from the CSS. The SIL OFL 1.1 of
these fonts declares no Reserved Font Name, so a static instance is allowed with its license next to it.

Run (fonttools 4.55.3 + brotli in any venv), from web/:
  python -I scripts/instance-og-fonts.py
"""
import shutil
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

FONTS = [
    ("assets/fonts/bricolage-grotesque-latin.woff2", {"opsz": 96, "wght": 800, "wdth": 75}, "bricolage-grotesque-800-75.ttf", "assets/fonts/Bricolage-Grotesque-OFL.txt"),
    ("public/fonts/hanken-grotesk-latin.woff2", {"wght": 500}, "hanken-grotesk-500.ttf", "public/fonts/Hanken-Grotesk-OFL.txt"),
    ("public/fonts/jetbrains-mono-latin.woff2", {"wght": 400}, "jetbrains-mono-400.ttf", "public/fonts/JetBrains-Mono-OFL.txt"),
]
for source, axes, target, license_file in FONTS:
    font = instantiateVariableFont(TTFont(source), axes, updateFontNames=False)
    font.flavor = None
    font.save("assets/og-fonts/" + target)
    shutil.copy(license_file, "assets/og-fonts/")
    print(target, axes)
