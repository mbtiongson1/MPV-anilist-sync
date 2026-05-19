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



    def test_rank_trusted_status(self):
        torrent1 = {'title': 'Example', 'seeders': 200, 'timestamp': 10, 'category': 'trusted'}
        torrent2 = {'title': 'Example', 'seeders': 200, 'timestamp': 10, 'category': 'regular'}

        rank1 = _rank_torrent(torrent1, preferred_groups=[], category='1_2', nyaa_filter='0')
        rank2 = _rank_torrent(torrent2, preferred_groups=[], category='1_2', nyaa_filter='0')

        self.assertGreater(rank1[1], rank2[1])

    def test_rank_trusted_filter_override(self):
        torrent = {'title': 'Example', 'seeders': 200, 'timestamp': 10, 'category': 'regular'}
        rank = _rank_torrent(torrent, preferred_groups=[], category='1_2', nyaa_filter='2')
        self.assertEqual(rank[1], 100)

    def test_rank_remake_penalty(self):
        torrent_normal = {'title': 'Example', 'seeders': 200, 'timestamp': 10, 'category': 'trusted'}
        torrent_remake = {'title': 'Example Remake', 'seeders': 200, 'timestamp': 10, 'category': 'trusted'}

        rank_normal = _rank_torrent(torrent_normal, preferred_groups=[], category='1_2', nyaa_filter='1')
        rank_remake = _rank_torrent(torrent_remake, preferred_groups=[], category='1_2', nyaa_filter='1')

        self.assertGreater(rank_normal[1], rank_remake[1])

    def test_rank_preferred_group_order(self):
        torrent_first = {'title': '[GroupA] Example', 'seeders': 10, 'timestamp': 10}
        torrent_second = {'title': '[GroupB] Example', 'seeders': 100, 'timestamp': 10}
        torrent_none = {'title': '[GroupC] Example', 'seeders': 1000, 'timestamp': 10}

        rank_first = _rank_torrent(torrent_first, preferred_groups=['GroupA', 'GroupB'], category='1_2', nyaa_filter='0')
        rank_second = _rank_torrent(torrent_second, preferred_groups=['GroupA', 'GroupB'], category='1_2', nyaa_filter='0')
        rank_none = _rank_torrent(torrent_none, preferred_groups=['GroupA', 'GroupB'], category='1_2', nyaa_filter='0')

        self.assertGreater(rank_first[0], rank_second[0])
        self.assertGreater(rank_second[0], rank_none[0])

if __name__ == '__main__':
    unittest.main()
