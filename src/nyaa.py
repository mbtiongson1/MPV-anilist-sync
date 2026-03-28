import os
import re
import requests
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional

class NyaaInterface:
    def __init__(self):
        self.base_url = "https://nyaa.si/"

    def get_torrent_download_url(self, page_url: str) -> str:
        """
        Converts a Nyaa.si view URL to a direct download URL.
        Example: https://nyaa.si/view/1234567 -> https://nyaa.si/download/1234567.torrent
        """
        if "/view/" in page_url:
            return page_url.replace("/view/", "/download/") + ".torrent"
        return page_url

    def search(self, title: str, episode: Optional[int] = None, resolution: str = "1080p", preferred_groups: List[str] | None = None) -> List[Dict[str, Any]]:
        if preferred_groups is None:
            preferred_groups = []
            
        # Clean title
        clean_title = re.sub(r'[^\w\s]', ' ', title).strip()
        
        # Build search query
        if episode is not None:
            padded_ep = f"{int(episode):02d}"
            query = f'"{clean_title}" {padded_ep} {resolution}'
        else:
            query = f'"{clean_title}" {resolution}'
        
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
            guid_node = item.find('guid') # Often the view link
            size_node = item.find('{https://nyaa.si/xmlns/nyaa}size')
            seeders_node = item.find('{https://nyaa.si/xmlns/nyaa}seeders')
            
            if title_node is None or link_node is None:
                continue
                
            t: str = str(title_node.text) if title_node.text is not None else ""
            l: str = str(link_node.text) if link_node.text is not None else ""
            
            # Use guid if it's a view link, otherwise link
            view_link = guid_node.text if guid_node is not None and guid_node.text and "view" in guid_node.text else l
            download_link = self.get_torrent_download_url(view_link) if "view" in view_link else l
            
            s: str = str(size_node.text) if size_node is not None and size_node.text is not None else "Unknown"
            
            seed: int = 0
            if seeders_node is not None and seeders_node.text is not None:
                try:
                    seed = int(str(seeders_node.text))
                except (ValueError, TypeError):
                    seed = 0
            
            score = 0
            group_match = "Unknown"
            
            match = re.search(r'^\[(.*?)\]', t)
            if match:
                group_match = match.group(1)
                
            for i, group in enumerate(preferred_groups):
                group_clean = group.strip("[] ").lower()
                if group_clean and group_clean in t.lower():
                    score = 1000 - i
                    group_match = group.strip("[] ")
                    break
                    
            results.append({
                'title': t,
                'link': download_link,
                'view_link': view_link,
                'size': s,
                'seeders': seed,
                'group': group_match,
                'score': score
            })
            
        results.sort(key=lambda x: (x['score'], x['seeders']), reverse=True)
        return results

    def download_torrent(self, url: str, output_dir: str) -> str:
        """
        Downloads a .torrent file to output_dir and opens it using the OS default handler.
        """
        os.makedirs(output_dir, exist_ok=True)
        
        filename = "download.torrent"
        if "/download/" in url:
            filename = url.split("/download/")[-1]
            if "?" in filename:
                filename = filename.split("?")[0]
            if not filename.endswith(".torrent"):
                filename += ".torrent"
        elif url.endswith(".torrent"):
            filename = os.path.basename(url)
            
        output_path = os.path.join(output_dir, filename)
        
        try:
            response = requests.get(url, stream=True, timeout=10)
            response.raise_for_status()
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    
            import sys
            import subprocess
            
            if sys.platform == 'win32':
                os.startfile(output_path)
            elif sys.platform == 'darwin':
                subprocess.call(('open', output_path))
            else:
                subprocess.call(('xdg-open', output_path))
                
            return output_path
        except Exception as e:
            print(f"Failed to download and open torrent: {e}")
            return ""
