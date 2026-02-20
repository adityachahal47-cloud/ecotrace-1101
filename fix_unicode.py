"""Fix Unicode chars in openrouter.py"""
import os

path = r"c:\Users\Ishan\OneDrive\Desktop\New folder\ecotrace\backend\services\openrouter.py"
with open(path, "rb") as f:
    content = f.read()

# Replace em-dash (U+2014) with --
content = content.replace(b"\xe2\x80\x94", b"--")
# Replace en-dash (U+2013) with -
content = content.replace(b"\xe2\x80\x93", b"-")
# Replace smart quotes
content = content.replace(b"\xe2\x80\x99", b"'")
content = content.replace(b"\xe2\x80\x9c", b'"')
content = content.replace(b"\xe2\x80\x9d", b'"')
# Replace arrow (U+2192)
content = content.replace(b"\xe2\x86\x92", b"->")

with open(path, "wb") as f:
    f.write(content)

print("Done - fixed all Unicode characters")
