from fastapi import status


def test_root_redirects_to_static_index(client):
    # Arrange
    url = "/"

    # Act
    response = client.get(url, follow_redirects=False)

    # Assert
    assert response.status_code == status.HTTP_307_TEMPORARY_REDIRECT
    assert response.headers["location"] == "/static/index.html"


def test_get_activities(client):
    # Arrange
    url = "/activities"

    # Act
    response = client.get(url)

    # Assert
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)
    assert data["Chess Club"]["max_participants"] == 12


def test_signup_for_activity(client):
    # Arrange
    activity_name = "Chess Club"
    email = "newstudent@mergington.edu"
    url = f"/activities/{activity_name}/signup"
    params = {"email": email}

    # Act
    response = client.post(url, params=params)

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": f"Signed up {email} for {activity_name}"}

    activities = client.get("/activities").json()
    assert email in activities[activity_name]["participants"]


def test_signup_duplicate_fails(client):
    # Arrange
    activity_name = "Chess Club"
    email = "duplicate@mergington.edu"
    url = f"/activities/{activity_name}/signup"
    params = {"email": email}

    client.post(url, params=params)

    # Act
    response = client.post(url, params=params)

    # Assert
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_unregister_participant(client):
    # Arrange
    activity_name = "Programming Class"
    email = "remove@mergington.edu"
    signup_url = f"/activities/{activity_name}/signup"
    delete_url = f"/activities/{activity_name}/participants"
    params = {"email": email}

    client.post(signup_url, params=params)

    # Act
    response = client.delete(delete_url, params=params)

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": f"Unregistered {email} from {activity_name}"}

    activities = client.get("/activities").json()
    assert email not in activities[activity_name]["participants"]


def test_unregister_unknown_participant_returns_404(client):
    # Arrange
    delete_url = "/activities/Chess%20Club/participants"
    params = {"email": "missing@mergington.edu"}

    # Act
    response = client.delete(delete_url, params=params)

    # Assert
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Participant not found in this activity"
