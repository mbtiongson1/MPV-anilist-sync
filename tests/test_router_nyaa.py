import unittest

from src.api.router_nyaa import _rank_torrent, _torrent_key


class TestRouterNyaa(unittest.TestCase):
    def test_torrent_key_prefers_link(self):
        self.assertEqual(_torrent_key({'link': 'a', 'url': 'b'}), 'a')

    def test_rank_prefers_group_and_seeders(self):
        torrent = {'title': '[SubsPlease] Example', 'seeders': 200, 'timestamp': 10, 'category': 'trusted'}
        rank = _rank_torrent(torrent, preferred_groups=['SubsPlease'], category='1_2', nyaa_filter='0')
        self.assertGreater(rank[0], 0)
        self.assertGreater(rank[1], 0)


if __name__ == '__main__':
    unittest.main()
