import os
from PIL import Image

def convert_icon(input_path, output_dir, base_name):
    try:
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        img = Image.open(input_path)
        
        # Convert to ICO
        ico_path = os.path.join(output_dir, f"{base_name}.ico")
        img.save(ico_path, format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)])
        print(f"Successfully created {ico_path}")

        # Convert to ICNS
        icns_path = os.path.join(output_dir, f"{base_name}.icns")
        img.save(icns_path, format="ICNS")
        print(f"Successfully created {icns_path}")

    except Exception as e:
        print(f"Error converting icon: {e}")

if __name__ == "__main__":
    # Ensure this matches the output of the generate_image node
    # The generated image was app_icon_v2_1773537412003.png
    # But since that is in the .gemini directory, we can provide it via argument 
    import sys
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        convert_icon(input_file, "build", "app_icon")
    else:
        print("Please provide the input PNG file path.")

