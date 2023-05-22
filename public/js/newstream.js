// Get references to the form and its elements
const dateInput = document.querySelector('#date');
const inputField = document.getElementById('stream-category');
const form = document.querySelector('.new-stream form');
const streamTitleInput = document.getElementById('stream-title');

fetch('/status')
  .then(res => {
    console.log(`Status code: ${res.status}`);
    return res.text();
  })
  .then(data => {
    console.log(data);
  })
  .catch(error => {
    console.error(error);
  });

// Format the date string in the expected format
const now = new Date();
const offsetMs = now.getTimezoneOffset() * 60 * 1000;
const date = new Date(now.getTime() - offsetMs).toISOString().substr(0, 10);
dateInput.value = date;


document.addEventListener("DOMContentLoaded", function() {
  const dropArea = document.querySelector(".drag-area");
  const fileInput = document.querySelector("#file-upload");
  const fileList = document.querySelector(".files");
  const uploadBtn = document.querySelector("#uploadbtn");
  let selectedFiles = [];

  ["dragenter", "dragover"].forEach(eventName => {
    dropArea.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  dropArea.addEventListener("drop", e => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener("change", e => {
    handleFiles(fileInput.files);
  });

  function handleFiles(files) {
    for (const file of files) {
      selectedFiles.push(file);

      const span = document.createElement("span");
      span.textContent = file.name;
      fileList.appendChild(span);

      const i = document.createElement("i");
      i.className = "fa-solid fa-xmark";
      span.appendChild(i);
    }
    uploadBtn.disabled = false;
  }

  uploadBtn.addEventListener("click", async e => {
    e.preventDefault();

    const form = document.querySelector("form");
    const formData = new FormData();
    const date = form.elements["date"].value;
    const streamCategory = form.elements["stream-category"].value;

    formData.append("date", date);
    formData.append("stream-category", streamCategory);
    if (streamTitleInput.value) {
      formData.append('stream_title', streamTitleInput.value);
    }

    for (const file of selectedFiles) {
      formData.append("files[]", file);
    }
    const serverUrl = "/newstreams";
    try {
      const response = await fetch(serverUrl, {
        method: "POST",
        body: formData,
      });
      window.location.href = `/index?streamId=4564564`;
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const streamId = data.streamId;
      window.location.href = `/index?streamId=${streamId}`;
      console.log("Files uploaded successfully.");
    } catch (error) {
      console.error("An error occurred while uploading the files:", error);
    }
  });
});

inputField.addEventListener('input', (event) => {
  const input = event.target.value;

  // Delay the POST request by 500ms
  clearTimeout(window.timerId);
  window.timerId = setTimeout(() => {
    if (input) {
      fetch('/categorysearch', {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({ input }),
        headers: {
          'Content-Type': 'application/json',
        }
      })
        .then(response => response.json())
        .then(data => {
          // Clear any existing suggestions
          suggestions = [];
          while (inputField.nextElementSibling) {
            inputField.nextElementSibling.remove();
          }

          // Create new suggestion dropdown list
          suggestions = data;
          const dropdown = document.createElement('ul');
          dropdown.classList.add('suggestions');
          for (const suggestion of suggestions) {
            const listItem = document.createElement('li');
            listItem.textContent = suggestion;
            listItem.addEventListener('click', (event) => {
              inputField.value = event.target.textContent;
              dropdown.remove();
            });
            dropdown.appendChild(listItem);
          }
          inputField.parentElement.appendChild(dropdown);
        })
        .catch(error => console.error(error));
    }
  }, 100);
});

inputField.addEventListener('keydown', (event) => {
  if (event.key === 'Tab' && suggestions.length > 0) {
    inputField.value = suggestions[0];
    suggestions = [];
    while (inputField.nextElementSibling && inputField.nextElementSibling.classList.contains('suggestions')) {
      inputField.nextElementSibling.remove();
    }
    event.preventDefault();
  }
});

document.addEventListener('click', (event) => {
  if (!event.target.matches('#stream-category') && !event.target.matches('.suggestions')) {
    while (inputField.nextElementSibling) {
      inputField.nextElementSibling.remove();
    }
  }
});
