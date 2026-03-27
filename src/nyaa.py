import os
import re
import requests
import xml.etree.ElementTree as ET
from typing import List, Dict, Any

class NyaaInterface:
    def __init__(self):
        self.base_url = "https://nyaa.si/"

    def search(self, title: str, episode: int, resolution: str = "1080p", preferred_groups: List[str] | None = None) -> List[Dict[str, Any]]:
        if preferred_groups is None:
            preferred_groups = []
            
        # Clean title by keeping only alphanumeric and spaces to avoid query parser issues
        clean_title = re.sub(r'[^\w\s]', ' ', title).strip()
        
        # Pad episode to 2 digits (e.g. 05 instead of 5, which is standard on Nyaa)
        padded_ep = f"{int(episode):02d}"
        
        # Build search query
        query = f'"{clean_title}" {padded_ep} {resolution}'
        
        params = {
            'page': 'rss',
            'q': query,
            'c': '1_2', # Anime - English-translated
            'f': '0'    # No filter
        }
        
        try:
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            root = ET.fromstring(response.content)
        except Exception as e:
            print(f"Nyaa search failed: {e}")
            return []

        results = []
        for item in root.findall('./channel/item'):
            title_node = item.find('title')
            link_node = item.find('link')
            # Nyaa uses custom namespaces for size and seeders
            size_node = item.find('{https://nyaa.si/xmlns/nyaa}size')
            seeders_node = item.find('{https://nyaa.si/xmlns/nyaa}seeders')
            
            if title_node is None or link_node is None:
                continue
                
            t = title_node.text or ""
            l = link_node.text or ""
            s = size_node.text if size_node is not None and size_node.text else "Unknown"
            seed = int(seeders_node.text) if seeders_node is not None and seeders_node.text and str(seeders_node.text).isdigit() else 0
            
            # calculate a score based on preferred groups
            score = 0
            group_match = "Unknown"
            
            # extract group name like [ASW]
            match = re.search(r'^\[(.*?)\]', t)
            if match:
                group_match = match.group(1)
                
            for i, group in enumerate(preferred_groups):
                # Clean the group name from preferences
                group_clean = group.strip("[] ").lower()
                if group_clean and group_clean in t.lower():
                    # higher score for groups closer to the front of the preference list
                    score = 1000 - i
                    group_match = group.strip("[] ")
                    break
                    
            results.append({
                'title': t,
                'link': l,
                'size': s,
                'seeders': seed,
                'group': group_match,
                'score': score
            })
            
        # Sort by score desc, then seeders desc
        results.sort(key=lambda x: (x['score'], x['seeders']), reverse=True)
        return results

    def download_torrent(self, url: str, output_dir: str) -> str:
        """
        Downloads a .torrent file to output_dir and opens it using the OS default handler.
        """
        os.makedirs(output_dir, exist_ok=True)
        
        filename = "download.torrent"
        # Attempt to extract filename from URL
        if "/download/" in url:
            filename = url.split("/download/")[-1]
            if "?" in filename:
                filename = filename.split("?")[0]
        elif url.endswith(".torrent"):
            filename = os.path.basename(url)
            
        output_path = os.path.join(output_dir, filename)
        
        try:
            response = requests.get(url, stream=True, timeout=10)
            response.raise_for_status()
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    
            # Open the file
            if os.name == 'nt':
                os.startfile(output_path)
            else:
                import subprocess
                subprocess.call(('open', output_path))
                
            return output_path
        except Exception as e:
            print(f"Failed to download and open torrent: {e}")
            return ""
