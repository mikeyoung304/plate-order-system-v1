#!/usr/bin/env python3
import os
import shutil
from pathlib import Path

# Get paths
app_dir = Path(__file__).parent.parent
voice_fixes_dir = app_dir.parent / "voice-order-fixes"
supabase_app_dir = app_dir.parent / "setup-scripts" / "supabase-api-project"

# Copy CSS file
if (voice_fixes_dir / "voice-recognition.css").exists():
    print("✓ Copying voice-recognition.css")
    shutil.copy(
        voice_fixes_dir / "voice-recognition.css",
        app_dir / "app" / "static" / "css" / "voice-recognition.css"
    )

# Add to base.html
base_path = app_dir / "app" / "templates" / "layouts" / "base.html"
if base_path.exists():
    with open(base_path, 'r') as f:
        content = f.read()
    
    if 'voice-recognition.css' not in content:
        content = content.replace(
            '{% block css %}{% endblock %}',
            '<link href="/static/css/voice-recognition.css" rel="stylesheet">\n    {% block css %}{% endblock %}'
        )
        with open(base_path, 'w') as f:
            f.write(content)
        print("✓ Updated base.html")

# Add to server-view.html
server_path = app_dir / "app" / "templates" / "pages" / "server-view.html"
if server_path.exists():
    with open(server_path, 'r') as f:
        content = f.read()
    
    if 'improved-ipad-voice-recognition.js' not in content:
        content = content.replace(
            '{% endblock %}',
            '<script src="{{ url_for(\'static\', filename=\'js/improved-ipad-voice-recognition.js\') }}"></script>\n{% endblock %}'
        )
        with open(server_path, 'w') as f:
            f.write(content)
        print("✓ Updated server-view.html")

print("✅ UI Integration complete!")
