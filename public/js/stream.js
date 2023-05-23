var video = document.querySelector('.video');
const urlParams = new URLSearchParams(window.location.search);
const streamId = urlParams.get('streamId');
const deleteStreamButton = document.getElementById('delete-stream');

video.addEventListener('mouseenter', function () {
  this.setAttribute('controls', 'controls');
});

video.addEventListener('mouseleave', function () {
  this.removeAttribute('controls');
});

function addTagToStream(event) {
  event.preventDefault();

  const tagInput = document.getElementById('tag-input');
  const tagList = document.getElementById('tag-list');
  const newTag = tagInput.value.trim();

  if (newTag !== '') {
    const tagType = 'stream'; // Assuming the tag type is 'stream'
    const id = streamId; // Replace with the actual stream ID

    // Make an API request to add the tag
    fetch('/api/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tagType: tagType,
        id: id,
        newTag: newTag
      })
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        if (data.success) {
          // Tag added successfully, append it to the tag list
          const tagElement = document.createElement('span');
          const iconElement = document.createElement('i');
          iconElement.classList.add('fa-solid', 'fa-circle-xmark');
          tagElement.textContent = newTag;
          tagElement.appendChild(iconElement);
          tagList.appendChild(tagElement);

          // Clear the input field
          tagInput.value = '';
        }
      })
      .catch(error => {
        console.error('Error adding tag:', error);
      });
  }
}

const tagInput = document.getElementById('tag-input');
tagInput.addEventListener('keypress', function (event) {
  if (event.key === 'Enter') {
    addTagToStream(event);
  }
});


function removeTag(tagElement, tagType, id, tagToRemove) {
  const tagList = document.getElementById('tag-list');

  fetch('/api/tags', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tagType: tagType,
      id: id,
      tagToRemove: tagToRemove
    })
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      if (data.success) {
        // Tag removed successfully, remove it from the tag list
        tagList.removeChild(tagElement);
      }
    })
    .catch(error => {
      console.error('Error removing tag:', error);
    });
}

const tagList = document.getElementById('tag-list');
tagList.addEventListener('click', function (event) {
  if (event.target.classList.contains('fa-circle-xmark')) {
    const tagElement = event.target.parentNode;
    const tagType = 'stream'; // Assuming the tag type is 'stream'
    const id = streamId; // Replace with the actual stream ID
    const tagToRemove = tagElement.textContent.trim();

    removeTag(tagElement, tagType, id, tagToRemove);
  }
});


function showConfirmationWindow() {
  const confirmationWindow = document.querySelector('.confirmation-window');
  confirmationWindow.style.display = 'block';
}

function handleConfirm() {
  console.log('Sending Form');
  // Send request to remove the stream
  fetch(`/api/stream/${streamId}`, {
    method: 'DELETE'
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      // Process the response as needed
    })
    .catch(error => {
      console.error('Error removing stream:', error);
    });

  const confirmationWindow = document.querySelector('.confirmation-window');
  confirmationWindow.style.display = 'none';
}

function handleCancel() {
  const confirmationWindow = document.querySelector('.confirmation-window');
  confirmationWindow.style.display = 'none';
}

deleteStreamButton.addEventListener('click', showConfirmationWindow);

const confirmButton = document.getElementById('confirm-btn');
const cancelButton = document.getElementById('cancel-btn');
confirmButton.addEventListener('click', handleConfirm);
cancelButton.addEventListener('click', handleCancel);

