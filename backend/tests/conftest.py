import os
import tempfile
import pytest
import app.config
import app.database

@pytest.fixture(autouse=True, scope="session")
def isolate_test_database():
    """Ensures pytest never pollutes the user's real ~/.wiredrop/wiredrop.db."""
    tmp_dir = tempfile.mkdtemp(prefix="wiredrop_test_db_")
    test_db = os.path.join(tmp_dir, "test_wiredrop.db")
    app.config.DB_PATH = test_db
    app.database.DB_PATH = test_db
    yield
    import shutil
    shutil.rmtree(tmp_dir, ignore_errors=True)
