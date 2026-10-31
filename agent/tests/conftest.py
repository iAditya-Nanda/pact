import pytest
from agent.db.connection import db_manager
from agent.db.schema import init_database, seed_mock_data


@pytest.fixture(autouse=True, scope="session")
def setup_test_db():
    init_database(db_manager)
    seed_mock_data(db_manager)
    yield
