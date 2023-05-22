const deleteNotificationButtons = document.querySelectorAll('.dete-noti');
const addStream = document.getElementById('add-stream');
const newStreamForm = document.getElementById('new-stream-form');

addStream.addEventListener('click', (event) => { 
  newStreamForm.style.display = 'block';
});

// Define a function that fetches the upload status and updates the UI
async function fetchUploadStatus() {
  try {
    const response = await fetch('/upload-status');
    if (response.ok) {
      const status = await response.json();
      updateProgress(status);
    } else {
      console.error('Error fetching upload status:', response.status);
    }
  } catch (error) {
    console.error('Error fetching upload status:', error.message);
  }
}

function updateMemoryUsage() {
  fetch('/memory-usage')
    .then(response => response.json())
    .then(data => {
      const progressBar = document.querySelector('.progress-bar');
      const percent = document.querySelector('#percent');
      const storage = document.querySelector('#storage');

      // Update progress bar width
      progressBar.style.width = `${data.memoryPct}%`;

      // Update memory percentage and storage details
      percent.textContent = `${data.memoryPct}%`;
      storage.textContent = `${data.usedMemory} / ${data.totalMemory}`;
    })
    .catch(error => {
      console.error('Error updating memory usage:', error);
    });
}

async function updateNotifications() {
  try {
    const response = await fetch('/notifications');
    const notifications = await response.json();
    const notificationContainer = document.querySelector('.notification-container');
    const notificationCount = document.querySelector('.notification-count');
    const notificationList = document.querySelector('.notification-list');

    // Clear existing notifications
    notificationList.innerHTML = '';

    if (notifications.length === 0) {
      notificationCount.style.display = 'none'; // Hide notification count
    } else {
      notificationCount.style.display = 'flex';
      notificationCount.textContent = notifications.length;
      for (const notification of notifications) {
        const notificationItem = document.createElement('li');
        notificationItem.classList.add('notification-item');
        notificationItem.innerHTML = `${notification.notification}<i class="fa-solid fa-xmark dete-noti"></i>`;
        notificationItem.setAttribute('data-id', notification._id);
        notificationList.appendChild(notificationItem);
      }
    }
  } catch (error) {
    console.error("Error updating notifications:", error);
  }
}

async function updateQueueNotifications() {
  try {
    const response = await fetch('/get-queue');
    const queueItems = await response.json();
    const queueNotification = document.querySelector('.queue-notification');

    if (queueItems.length === 0) {
      queueNotification.style.display = 'none'; // Hide queue notification
    } else {
      queueNotification.style.display = 'inline';
      queueNotification.textContent = queueItems.length;
    }
  } catch (error) {
    console.error("Error updating queue notifications:", error);
  }
}

function removeNotification(notificationId) {
  const notificationItem = document.querySelector(`li[data-id="${notificationId}"]`);
  if (notificationItem) {
    fetch(`/notifications/${notificationId}`, {
      method: 'DELETE',
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.message); // Optional: Log success message
        notificationItem.remove();
      })
      .catch((error) => {
        console.error("Error removing notification:", error);
      });
  }
}

async function getAndDisplayStreams() {
  const container = document.getElementById("latest-streams-container");
  const response = await fetch("/api/getstreams", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ count: 5 }) // you want to retrieve 5 streams
  });

  if (!response.ok) {
    console.log("Error fetching streams: ", response.status);
    return;
  }

  const streams = await response.json();

  // Select the add-stream div
  const addStreamDiv = document.getElementById('add-stream');
  let count = 0;
  // Iterate over streams and create HTML elements
  for (const stream of streams) {
    const streamElement = document.createElement("div");
    streamElement.className = "stream";
    streamElement.onclick = function () { window.location=`/stream?streamId=${stream._id}` };

    const imgInfoContainer = document.createElement("div");
    imgInfoContainer.className = "img-info-container";

    const image = document.createElement("img");
    image.src = stream.background_img;
    image.alt = `${stream.category} thumbnail`;

    const streamInfoContainer = document.createElement("div");
    streamInfoContainer.className = "stream-info-container";

    const dateSpan = document.createElement("span");
    dateSpan.textContent = stream.date;

    const lengthSpan = document.createElement("span");
    lengthSpan.textContent = convertSecondsToHMS(stream.length);

    streamInfoContainer.appendChild(dateSpan);
    streamInfoContainer.appendChild(lengthSpan);

    imgInfoContainer.appendChild(image);
    imgInfoContainer.appendChild(streamInfoContainer);

    const clipsNumber = document.createElement("span");
    clipsNumber.className = "clips-number";
    clipsNumber.textContent = stream.video_count.toString();
  
    streamElement.style.animationDelay = `0.2s`;
    streamElement.appendChild(imgInfoContainer);
    streamElement.appendChild(clipsNumber);

    // Insert the stream element after the addStream div
    addStreamDiv.parentNode.insertBefore(streamElement, addStreamDiv.nextSibling);
    count++;
  }
}

deleteNotificationButtons.forEach((button) => {
  console.log('Clicked');
  button.addEventListener('click', (event) => {
    const notificationId = button.parentElement.getAttribute('data-id');
    removeNotification(notificationId);
  });
});

function convertSecondsToHMS(seconds) {
  let hours = Math.floor(seconds / 3600);
  let minutes = Math.floor((seconds % 3600) / 60);
  let secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

window.addEventListener('load', () => {
  getAndDisplayStreams();
  console.log('Loaded');
});

document.addEventListener('DOMContentLoaded', () => {
  updateNotifications();
  updateMemoryUsage();
  updateQueueNotifications();
});

// Call the fetchUploadStatus function every 3 seconds
setInterval(updateMemoryUsage, 3000);

