document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list with participant delete buttons
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Registered Participants (${details.participants.length}):</strong>
          </div>
        `;

        const participantsSection = activityCard.querySelector('.participants-section');
        const ul = document.createElement('ul');
        ul.className = 'participants-list';

        details.participants.forEach(email => {
          const li = document.createElement('li');
          const span = document.createElement('span');
          span.textContent = email;
          span.className = 'participant-email';

          const btn = document.createElement('button');
          btn.className = 'delete-btn';
          btn.title = 'Unregister participant';
          btn.dataset.activity = name;
          btn.dataset.email = email;
          btn.innerHTML = '&times;';

          li.appendChild(span);
          li.appendChild(btn);
          ul.appendChild(li);
        });

        participantsSection.appendChild(ul);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Delegate click for delete buttons
  document.addEventListener('click', async (e) => {
    if (e.target && e.target.matches('.delete-btn')) {
      const btn = e.target;
      const activity = btn.dataset.activity;
      const email = btn.dataset.email;
      try {
        const resp = await fetch(
          `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
          { method: 'DELETE' }
        );
        const result = await resp.json();
        if (resp.ok) {
          messageDiv.textContent = result.message;
          messageDiv.className = 'message success';
          messageDiv.classList.remove('hidden');
          // Refresh activities to reflect change
          fetchActivities();
        } else {
          messageDiv.textContent = result.detail || 'Failed to unregister participant';
          messageDiv.className = 'message error';
          messageDiv.classList.remove('hidden');
        }
        setTimeout(() => messageDiv.classList.add('hidden'), 5000);
      } catch (err) {
        messageDiv.textContent = 'Failed to unregister participant';
        messageDiv.className = 'message error';
        messageDiv.classList.remove('hidden');
        console.error('Error unregistering participant:', err);
      }
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
