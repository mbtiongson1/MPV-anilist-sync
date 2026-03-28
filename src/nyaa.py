import os
import re
import requests
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional

# Nyaa category codes
NYAA_CATEGORIES = {
    'english': '1_2',   # Anime - English-translated
    'non_english': '1_3',
    'raw': '1_4',
    'all': '1_0',
}

# Nyaa filter codes
NYAA_FILTERS = {
    'none': '0',
    'no_remakes': '1',
    'trusted': '2',
}


def _parse_episode_from_title(title: str) -> tuple[Optional[int], bool]:
    """
    Try to extract an episode number from a Nyaa torrent title.
    Returns (episode_number, is_batch).
    Batch torrents (e.g. 01-13, Batch, Complete) return (None, True).
    """
    # Detect batch indicators first
    batch_patterns = [
        r'\b(?:batch|complete series|complete|all episodes)\b',
        r'[\[\(]batch[\]\)]',
        # Standalone range e.g. 01-13 or 01~13, avoiding things like S1 - 05
        r'(?<![S\d])\b\d{1,3}\s*[-~]\s*\d{1,3}\b',
    ]
    for pat in batch_patterns:
        if re.search(pat, title, re.IGNORECASE):
            return None, True

    # Try to find a standalone episode number (ordered most → least specific)
    ep_patterns = [
        r'[-_\s]E(\d{1,4})\b',              # -E01 or _E01
        r'\bEP\.?\s*(\d{1,4})\b',           # EP01  EP. 01
        r'S\d{1,2}E(\d{1,4})\b',            # S01E05
        r'S\d{1,2}\s+-\s+(\d{1,4})\b',      # S2 - 05
        r'\s-\s(\d{1,4})(?:\s|$|\[|\()',    # " - 05 " or " - 05["
        r'\]\s+(\d{1,4})\s+(?:\[|\()',      # "] 03 [" or "] 03 ("
        r'\s(\d{2,3})\s+(?:\[|\()',         # " 03 [720p]" or " 03 (720p)"
    ]
    for pat in ep_patterns:
        m = re.search(pat, title)
        if m:
            try:
                val = int(m.group(1))
                if val >= 1900:  # skip year-like numbers
                    continue
                return val, False
            except ValueError:
                continue

    # Last resort: standalone bracketed 1-3 digit number that isn't a year
    m = re.search(r'[\[\(](\d{1,3})[\]\)]', title)
    if m:
        try:
            val = int(m.group(1))
            return val, False
        except ValueError:
            pass

    return None, False


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

    def _clean_title(self, title: str) -> str:
        """Strip punctuation and normalise whitespace for fuzzy matching."""
        # Remove common separators that break Nyaa matching
        cleaned = re.sub(r'[^\w\s]', ' ', title)
        # Collapse multiple spaces
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned

    def search(
        self,
        title: str,
        episode: Optional[int] = None,
        resolution: str = "1080p",
        preferred_groups: List[str] | None = None,
        category: str = '1_2',
        nyaa_filter: str = '0',
    ) -> List[Dict[str, Any]]:
        if preferred_groups is None:
            preferred_groups = []

        clean_title = self._clean_title(title)

        def _do_search(query_title: str, res: Optional[str]) -> List[Dict[str, Any]]:
            """Run a single Nyaa RSS query and return parsed results."""
            parts = [query_title]
            if episode is not None:
                padded_ep = f"{int(episode):02d}"
                parts.append(padded_ep)
            if res:
                parts.append(res)
            query = ' '.join(parts)

            params = {
                'page': 'rss',
                'q': query,
                'c': category,
                'f': nyaa_filter,
            }

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }

            try:
                response = requests.get(self.base_url, params=params, headers=headers, timeout=10)
                response.raise_for_status()
                root = ET.fromstring(response.content)
            except Exception as e:
                print(f"Nyaa search failed: {e}")
                return []

            results: List[Dict[str, Any]] = []
            for item in root.findall('./channel/item'):
                title_node = item.find('title')
                link_node = item.find('link')
                guid_node = item.find('guid')
                size_node = item.find('{https://nyaa.si/xmlns/nyaa}size')
                seeders_node = item.find('{https://nyaa.si/xmlns/nyaa}seeders')
                leechers_node = item.find('{https://nyaa.si/xmlns/nyaa}leechers')
                infohash_node = item.find('{https://nyaa.si/xmlns/nyaa}infoHash')
                pub_date_node = item.find('pubDate')

                if title_node is None or link_node is None:
                    continue

                t: str = str(title_node.text) if title_node.text is not None else ""
                l: str = str(link_node.text) if link_node.text is not None else ""

                view_link = guid_node.text if guid_node is not None and guid_node.text and "view" in guid_node.text else l
                download_link = self.get_torrent_download_url(view_link) if "view" in view_link else l

                s: str = str(size_node.text) if size_node is not None and size_node.text is not None else "Unknown"

                seed: int = 0
                if seeders_node is not None and seeders_node.text is not None:
                    try:
                        seed = int(str(seeders_node.text))
                    except (ValueError, TypeError):
                        seed = 0

                leech: int = 0
                if leechers_node is not None and leechers_node.text is not None:
                    try:
                        leech = int(str(leechers_node.text))
                    except (ValueError, TypeError):
                        leech = 0

                # Build magnet link from infoHash
                magnet = ''
                if infohash_node is not None and infohash_node.text:
                    ih = infohash_node.text.strip()
                    import urllib.parse as _up
                    dn = _up.quote(t)
                    magnet = f'magnet:?xt=urn:btih:{ih}&dn={dn}&tr=http%3A%2F%2Fnyaa.tracker.wf%3A7777%2Fannounce'
                
                pd: str = str(pub_date_node.text) if pub_date_node is not None and pub_date_node.text is not None else ""

                # Parse episode number and batch status from title
                parsed_ep, is_batch = _parse_episode_from_title(t)

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
                    'leechers': leech,
                    'magnet': magnet,
                    'group': group_match,
                    'score': score,
                    'episode': parsed_ep,
                    'is_batch': is_batch,
                    'pubDate': pd,
                })

            results.sort(key=lambda x: (x['score'], x['seeders']), reverse=True)
            return results

        # First attempt: with resolution
        results = _do_search(clean_title, resolution)

        # Fallback 1: try without resolution if nothing found
        if not results and resolution:
            results = _do_search(clean_title, None)

        # Fallback 2: try English title if it differs from the cleaned romaji
        # (caller can pass english_title as part of title like "romaji|english")
        if not results and '|' in title:
            parts_split = title.split('|', 1)
            alt_title = self._clean_title(parts_split[1].strip())
            if alt_title and alt_title != clean_title:
                results = _do_search(alt_title, resolution)
                if not results and resolution:
                    results = _do_search(alt_title, None)

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
                subprocess.Popen(['open', output_path])
            else:
                subprocess.Popen(['xdg-open', output_path])

            return output_path
        except Exception as e:
            print(f"Failed to download and open torrent: {e}")
            return ""
