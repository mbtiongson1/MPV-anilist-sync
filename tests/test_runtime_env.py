import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from src import runtime_env


class TestRuntimeEnv(unittest.TestCase):
    def test_resolve_resource_path_uses_repo_root_when_not_frozen(self):
        version_path = runtime_env.resolve_resource_path("VERSION")
        self.assertTrue(version_path.exists())
        self.assertEqual(version_path.name, "VERSION")

    def test_resolve_resource_path_uses_meipass_when_frozen(self):
        with patch.object(runtime_env.sys, "frozen", True, create=True), patch.object(runtime_env.sys, "_MEIPASS", "/tmp/mpv-bundle", create=True):
            path = runtime_env.resolve_resource_path("frontend", "dist")
        self.assertEqual(path, Path("/tmp/mpv-bundle/frontend/dist"))

    def test_port_from_env_ignores_invalid_value(self):
        with patch.dict(os.environ, {"MPV_TRACKER_PORT": "not-a-port"}, clear=False):
            self.assertEqual(runtime_env.port_from_env(8080), 8080)

    def test_prepare_runtime_environment_uses_packaged_data_dir(self):
        with tempfile.TemporaryDirectory() as temp_home:
            target_dir = Path(temp_home) / "Library" / "Application Support" / runtime_env.APP_NAME
            with patch.object(runtime_env.sys, "frozen", True, create=True), patch.object(runtime_env.sys, "platform", "darwin"), patch.object(runtime_env, "Path") as mock_path, patch.object(runtime_env.os, "chdir") as mock_chdir:
                real_path = Path
                mock_path.home.return_value = real_path(temp_home)
                mock_path.return_value = real_path(temp_home)
                mock_path.side_effect = lambda *args, **kwargs: real_path(*args, **kwargs)

                result = runtime_env.prepare_runtime_environment()

            self.assertEqual(result, target_dir)
            self.assertTrue(target_dir.exists())
            mock_chdir.assert_called_once_with(target_dir)


if __name__ == "__main__":
    unittest.main()
