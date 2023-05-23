let selectedFiles = [];

function displayFiles(input) {
    var fileList = document.getElementById('fileList');
    for (var i = 0; i < input.files.length; i++) {
        var fileType = input.files[i].type;

        // Only accept .mp4, .mkv, and .avi files
        if (['video/mp4', 'video/x-matroska', 'video/x-msvideo'].includes(fileType)) {
            if (selectedFiles.findIndex(file => file.name === input.files[i].name) === -1) {
                selectedFiles.push(input.files[i]);

                // Create a new span for the file
                var fileSpan = document.createElement('span');
                fileSpan.textContent = input.files[i].name;

                // Create the close icon
                var closeIcon = document.createElement('i');
                closeIcon.classList.add('fas', 'fa-times-circle');

                // Add an event listener to the close icon
                closeIcon.addEventListener('click', function (e) {
                    const fileName = e.target.parentNode.textContent;
                    selectedFiles = selectedFiles.filter(file => file.name !== fileName);
                    e.target.parentNode.remove(); // remove the parent span of the close icon
                });

                // Add the close icon to the file span
                fileSpan.appendChild(closeIcon);

                // Add the file span to the file list
                fileList.appendChild(fileSpan);
            }
        } else {
            alert("Only .mp4, .mkv, and .avi files are accepted.");
        }
    }
}

document.querySelector('.upload-area').addEventListener('click', function () {
    document.getElementById('fileUpload').value = ""; // Reset the file input value
}, false);

document.querySelector('.upload-area').addEventListener('drop', function (e) {
    e.preventDefault(); // prevent the browser's default file open behavior
    Array.from(e.dataTransfer.files).forEach(file => {
        if (selectedFiles.findIndex(selectedFile => selectedFile.name === file.name) === -1) {
            selectedFiles.push(file); // add to the array
        }
    });
    displayFiles({ files: selectedFiles }); // update the file list
}, false);

document.getElementById('fileUpload').addEventListener('change', function (e) {
    e.preventDefault();
    Array.from(e.target.files).forEach(file => {
        if (selectedFiles.findIndex(selectedFile => selectedFile.name === file.name) === -1) {
            selectedFiles.push(file); // add to the array
        }
    });
    displayFiles({ files: selectedFiles }); // update the file list
}, false);

// Allow files to be selected from the file dialog
var timeoutId;
document.getElementById('streamCategory').addEventListener('input', function (e) {
    clearTimeout(timeoutId); // clear the timeout if it exists
    timeoutId = setTimeout(function () { // set a new timeout
        fetch('/api/categorysearch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                category: e.target.value
            })
        })
            .then(response => response.json())
            .then(data => {
                var suggestions = document.getElementById('suggestions');
                suggestions.innerHTML = ''; // clear the current suggestions
                data.forEach(game => {
                    var suggestion = document.createElement('div');
                    suggestion.className = "suggestion-item"; // Add class to suggestion div
                    var gameArt = document.createElement('img');
                    gameArt.src = game.art;
                    gameArt.className = "game-art"; // Add class to game art img
                    var gameName = document.createElement('span');
                    gameName.textContent = game.name;
                    gameName.className = "game-name"; // Add class to game name span
                    suggestion.appendChild(gameArt);
                    suggestion.appendChild(gameName);
                    suggestions.appendChild(suggestion);

                    // Add event listener for click on suggestion
                    suggestion.addEventListener('click', function () {
                        document.getElementById('streamCategory').value = game.name; // Set the value of the input field
                        suggestions.style.display = 'none'; // Hide the suggestions
                    });
                });

                // Show the suggestions
                if (data.length > 0) {
                    suggestions.style.display = 'block';
                }
            })
            .catch(error => console.error('Error:', error));
    }, 500);
});

// Add event listener for click outside of suggestions
document.addEventListener('click', function (e) {
    var suggestions = document.getElementById('suggestions');
    var streamCategory = document.getElementById('streamCategory');

    // If the clicked element is not the input field or a suggestion, hide the suggestions
    if (!streamCategory.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.style.display = 'none';
    }
});


function showNotification(message, backgroundColor) {
    const notificationsContainer = document.querySelectorAll('.top-notifications')[0]
    const notification = document.getElementById('top-notification');
    notificationsContainer.style.display = 'block';
    notificationsContainer.style.backgroundColor = backgroundColor;
    notification.innerHTML = message;
}

function hideNotification() {
    const notificationsContainer = document.querySelectorAll('.top-notifications')[0]
    notificationsContainer.style.opacity = '0';
    notificationsContainer.style.display = 'none';
    notificationsContainer.style.backgroundColor = '#007bff';
    const notification = document.getElementById('top-notification');
    notification.innerHTML = '';
}

document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault(); // prevent the form's default submission behavior
    showNotification('Uploading Files. Do not exit...', '#007bff'); // clear the current notifications
    document.querySelector('.upload-container').style.display = 'none';

    // create a new FormData object
    var formData = new FormData();

    // append the stream category
    formData.append('streamCategory', document.getElementById('streamCategory').value);

    // append the stream date
    formData.append('streamDate', document.getElementById('streamDate').value);

    // append all the selected files
    selectedFiles.forEach((file, i) => {
        formData.append('fileUpload', file); // Use 'fileUpload' for all files
    });

    // send the POST request
    fetch('/api/stream', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            if (data.message === 'Upload successful') {
                // Clear the file list
                selectedFiles = [];
                document.getElementById('fileList').innerHTML = '';

                // Reset the stream category
                document.getElementById('streamCategory').value = '';

                hideNotification();
                setTimeout(function () {
                    showNotification('Upload successful', '#28a745');
                }, 1000);
                setTimeout(function () {
                    hideNotification();
                }, 5000);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
});

document.getElementById('cancelButton').addEventListener('click', function () {
    document.querySelector('.upload-container').style.display = 'none';
    // Clear the file list
    selectedFiles = [];
    document.getElementById('fileList').innerHTML = '';

    // Reset the stream category
    document.getElementById('streamCategory').value = '';
});



window.onload = function () {
    console.log('Page loaded');
    var dateInput = document.getElementById('streamDate');
    var date = new Date(); // get the current date
    var day = ("0" + date.getDate()).slice(-2); // get the day and format it to 2 digits
    var month = ("0" + (date.getMonth() + 1)).slice(-2); // get the month (0-11), increment it to get the correct month number (1-12), and format it to 2 digits
    var year = date.getFullYear(); // get the year
    dateInput.value = year + '-' + month + '-' + day; // set the value of the date input
}
