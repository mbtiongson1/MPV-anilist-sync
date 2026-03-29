import unittest
import sys
import os
from unittest.mock import MagicMock, patch

# Add src to path for internal imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.anilist import AnilistClient

class TestAnilist(unittest.TestCase):
    def setUp(self):
        # We don't want to actually hit the API during unit tests
        self.mock_requests = MagicMock()
        self.client = AnilistClient(token_file="dummy_config.json")
        self.client.token = "test_token"

    def test_get_headers(self):
        headers = self.client._get_headers()
        self.assertEqual(headers['Authorization'], 'Bearer test_token')
        self.assertEqual(headers['Content-Type'], 'application/json')

    @patch('requests.post')
    def test_execute_query_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'data': {'Viewer': {'id': 123}}}
        mock_post.return_value = mock_response

        query = "query { Viewer { id } }"
        result = self.client._execute_query(query)
        self.assertIsNotNone(result)
        self.assertEqual(result['data']['Viewer']['id'], 123)

    def test_is_authenticated(self):
        self.client.token = "valid"
        self.assertTrue(self.client.is_authenticated())
        self.client.token = None
        self.assertFalse(self.client.is_authenticated())

if __name__ == "__main__":
    unittest.main()
