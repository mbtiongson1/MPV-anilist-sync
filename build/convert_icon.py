import os
from PIL import Image

def convert_png_to_icons(png_path, icon_name="app_icon"):
    """Convert PNG icon to ICO (Windows) and ICNS (macOS) using Pillow."""
    if not os.path.exists(png_path):
        print(f"Error: {png_path} not found.")
        return False
    
    img = Image.open(png_path)
    
    # Create build directory if needed
    os.makedirs('build', exist_ok=True)
    
    ico_path = os.path.join('build', f"{icon_name}.ico")
    icns_path = os.path.join('build', f"{icon_name}.icns")
    
    print(f"Converting {png_path} to {ico_path} and {icns_path}...")
    
    # Save as ICO (Windows)
    # Recommended icon sizes for Windows ICO
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(ico_path, format='ICO', sizes=ico_sizes)
    
    # Save as ICNS (macOS)
    # Pillow handles ICNS too!
    img.save(icns_path, format='ICNS')
    
    print("Icon conversion complete.")
    return True

if __name__ == "__main__":
    # Look for app_icon.png in root or current dir
    src_icon = "app_icon.png"
    if os.path.exists(src_icon):
        convert_png_to_icons(src_icon)
    else:
        print(f"Could not find {src_icon} in root directory.")
