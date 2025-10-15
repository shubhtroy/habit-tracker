import pytest
import json
from app import app, db

# This fixture provides a clean test client for each test
@pytest.fixture
def client():
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['TESTING'] = True

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client
        with app.app_context():
            db.drop_all()

# NEW: This fixture provides a pre-registered user
@pytest.fixture
def registered_user(client):
    """Fixture to register a user and provide their details."""
    user_data = {'username': 'testuser', 'password': 'password'}
    client.post('/register', data=json.dumps(user_data), content_type='application/json')
    return user_data

# --- TESTS ---

def test_register(client):
    """Tests the registration endpoint by itself."""
    response = client.post('/register',
                           data=json.dumps(dict(username='newuser', password='password')),
                           content_type='application/json')
    assert response.status_code == 201
    assert b"User created successfully!" in response.data

def test_login(client, registered_user):
    """Tests the login endpoint with a user provided by the fixture."""
    # The user is already registered by the fixture, so we just log in
    response = client.post('/login',
                           data=json.dumps(registered_user),
                           content_type='application/json')
    
    assert response.status_code == 200
    assert b'access_token' in response.data

def test_login_invalid_credentials(client, registered_user):
    """Tests the login endpoint with a bad password."""
    # The user is already registered, so we try to log in with a wrong password
    response = client.post('/login',
                           data=json.dumps(dict(username=registered_user['username'], password='wrongpassword')),
                           content_type='application/json')
                           
    assert response.status_code == 401
    assert b"Invalid credentials" in response.data