import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import HTTPException
from src.api.utils import validate_configured_dir
from src.api.router_library import save_settings, SettingsRequest
import asyncio


class TestValidateConfiguredDir(unittest.TestCase):
    def test_valid_paths(self):
        with tempfile.TemporaryDirectory() as d:
            self.assertEqual(validate_configured_dir(d), d)
            nested = os.path.join(d, "Anime", "Season..2 [HD]")  # '..' inside a name is fine
            self.assertEqual(validate_configured_dir(nested), nested)  # need not exist
            self.assertEqual(validate_configured_dir(f"  {d}  "), d)

    def test_rejects_roots(self):
        root = os.path.abspath(os.sep)
        for p in (root, root + os.sep, os.path.join(root, "."), os.path.join(root, "tmp", "..")):
            with self.assertRaises(ValueError, msg=p):
                validate_configured_dir(p)

    def test_rejects_symlink_to_root(self):
        if not hasattr(os, "symlink") or sys.platform == "win32":
            self.skipTest("symlinks unavailable")
        with tempfile.TemporaryDirectory() as d:
            link = os.path.join(d, "rootlink")
            os.symlink(os.sep, link)
            with self.assertRaises(ValueError):
                validate_configured_dir(link)

    def test_rejects_traversal(self):
        with tempfile.TemporaryDirectory() as d:
            for p in (os.path.join(d, "..", "etc"), d + "/../..", d + "\\..\\x"):
                with self.assertRaises(ValueError, msg=p):
                    validate_configured_dir(p)

    def test_rejects_malformed(self):
        for p in ("", "   ", None, 5, ["/tmp"], "relative/dir", "\x00/tmp", "/tmp/a\x00b",
                  "\\\\server\\share", "//server/share", "  //server/share"):
            with self.assertRaises(ValueError, msg=repr(p)):
                validate_configured_dir(p)

    @unittest.skipUnless(sys.platform == "win32", "Windows semantics")
    def test_windows_drive_roots(self):
        for p in ("C:\\", "C:/", "C:", "c:\\\\"):
            with self.assertRaises(ValueError, msg=p):
                validate_configured_dir(p)
        self.assertEqual(validate_configured_dir("C:\\Videos\\Anime"), "C:\\Videos\\Anime")


class TestSaveSettingsEndpoint(unittest.TestCase):
    def _request(self):
        agent = MagicMock()
        agent.settings.base_anime_folder = "/orig/base"
        agent.settings.default_download_dir = "/orig/dl"
        req = MagicMock()
        req.app.state.agent = agent
        return req, agent

    def test_saves_valid_dirs(self):
        req, agent = self._request()
        with tempfile.TemporaryDirectory() as a, tempfile.TemporaryDirectory() as b:
            asyncio.run(save_settings(req, SettingsRequest(base_anime_folder=a, default_download_dir=b)))
            self.assertEqual(agent.settings.base_anime_folder, a)
            self.assertEqual(agent.settings.default_download_dir, b)

    def test_rejection_is_atomic(self):
        req, agent = self._request()
        with tempfile.TemporaryDirectory() as ok:
            with self.assertRaises(HTTPException) as cm:
                asyncio.run(save_settings(req, SettingsRequest(
                    default_download_dir=ok, base_anime_folder=os.path.abspath(os.sep),
                    preferred_resolution="1080p")))
            self.assertEqual(cm.exception.status_code, 400)
            self.assertEqual(agent.settings.default_download_dir, "/orig/dl")
            self.assertEqual(agent.settings.base_anime_folder, "/orig/base")
            self.assertNotEqual(agent.settings.preferred_resolution, "1080p")

    def test_empty_keeps_existing(self):
        req, agent = self._request()
        asyncio.run(save_settings(req, SettingsRequest(base_anime_folder="", default_download_dir="  ")))
        self.assertEqual(agent.settings.base_anime_folder, "/orig/base")
        self.assertEqual(agent.settings.default_download_dir, "/orig/dl")


if __name__ == "__main__":
    unittest.main()
