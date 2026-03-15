"""Quick regression test for season rollover episode mapping.

Run with:
    python test_season_rollover.py
"""

from src.main import TrackerAgent


def test_resolve_season_rollover():
    season1 = {
        'id': 173295,
        'title': {'romaji': 'Shoushimin Series'},
        'episodes': 10,
        'relations': {
            'edges': [
                {
                    'relationType': 'SEQUEL',
                    'node': {
                        'id': 181182,
                        'title': {'romaji': 'Shoushimin Series 2nd Season'},
                        'episodes': 12,
                    },
                }
            ]
        }
    }

    target_media, target_episode = TrackerAgent._resolve_episode_to_media(season1, 16)
    assert target_media['id'] == 181182, 'Should resolve to season 2 media ID'
    assert target_episode == 6, '16th episode overall should map to episode 6 of season 2'
    print('PASS: Season rollover resolved to season 2 ep 6')


if __name__ == '__main__':
    test_resolve_season_rollover()
