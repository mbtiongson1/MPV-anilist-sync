import unittest
from src.nyaa import NyaaInterface

class TestNyaa(unittest.TestCase):
    def test_search(self):
        nyaa = NyaaInterface()
        results = nyaa.search("Frieren", 5, "1080p", ["SubsPlease", "ASW"])
        self.assertIsNotNone(results)
        print(f"Found {len(results)} torrents.")
        if results:
            print("Top result:", results[0])
            
if __name__ == "__main__":
    unittest.main()
