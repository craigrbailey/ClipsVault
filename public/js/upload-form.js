let selectedFiles = [];

function displayFiles(input) {
    var fileList = document.getElementById('fileList');
    for (var i = 0; i < input.files.length; i++) {
        var fileType = input.files[i].type;
        if (['video/mp4', 'video/x-matroska', 'video/x-msvideo'].includes(fileType)) {
            if (selectedFiles.findIndex(file => file.name === input.files[i].name) === -1) {
                selectedFiles.push(input.files[i]);
                var fileSpan = document.createElement('span');
                fileSpan.textContent = input.files[i].name;
                var closeIcon = document.createElement('i');
                closeIcon.classList.add('fas', 'fa-times-circle');
                closeIcon.addEventListener('click', function (e) {
                    const fileName = e.target.parentNode.textContent;
                    selectedFiles = selectedFiles.filter(file => file.name !== fileName);
                    e.target.parentNode.remove();
                });
                fileSpan.appendChild(closeIcon);
                fileList.appendChild(fileSpan);
            }
        } else {
            alert("Only .mp4, .mkv, and .avi files are accepted.");
        }
    }
}

document.querySelector('.upload-area').addEventListener('click', function () {
    document.getElementById('fileUpload').value = "";
}, false);

document.querySelector('.upload-area').addEventListener('drop', function (e) {
    e.preventDefault();
    Array.from(e.dataTransfer.files).forEach(file => {
        if (selectedFiles.findIndex(selectedFile => selectedFile.name === file.name) === -1) {
            selectedFiles.push(file);
        }
    });
    displayFiles({ files: selectedFiles });
}, false);

document.getElementById('fileUpload').addEventListener('change', function (e) {
    e.preventDefault();
    Array.from(e.target.files).forEach(file => {
        if (selectedFiles.findIndex(selectedFile => selectedFile.name === file.name) === -1) {
            selectedFiles.push(file);
        }
    });
    displayFiles({ files: selectedFiles });
}, false);

var timeoutId;
document.getElementById('streamCategory').addEventListener('input', function (e) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(function () {
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
                const gameImg = document.getElementById('catImg');
                var suggestions = document.getElementById('suggestions');
                suggestions.innerHTML = '';
                data.forEach(game => {
                    var suggestion = document.createElement('div');
                    suggestion.className = "suggestion-item";
                    var gameArt = document.createElement('img');
                    gameArt.src = game.art;
                    gameArt.className = "game-art";
                    var gameName = document.createElement('span');
                    gameName.textContent = game.name;
                    gameName.className = "game-name";
                    suggestion.appendChild(gameArt);
                    suggestion.appendChild(gameName);
                    suggestions.appendChild(suggestion);
                    suggestion.addEventListener('click', function () {
                        document.getElementById('streamCategory').value = game.name;
                        suggestions.style.display = 'none';
                    });
                });
                if (data.length > 0) {
                    suggestions.style.display = 'block';
                }
            })
            .catch(error => console.error('Error:', error));
    }, 500);
});

document.addEventListener('click', function (e) {
    var suggestions = document.getElementById('suggestions');
    var streamCategory = document.getElementById('streamCategory');
    if (!streamCategory.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.style.display = 'none';
    }
});

document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();
    document.querySelector('.container').style.display = 'none';
    document.querySelector('.loader-container').style.display = 'flex';
    var formData = new FormData();
    formData.append('streamCategory', document.getElementById('streamCategory').value);
    formData.append('streamDate', document.getElementById('streamDate').value);
    selectedFiles.forEach((file, i) => {
        formData.append('fileUpload', file);
    });
    fetch('/api/stream', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            if (data.success) {
                setTimeout(() => {
                    window.location.href = '/stream?streamId='+ data.streamId;
                }, 1500);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
});

window.onload = function () {
    console.log('Page loaded');
    var dateInput = document.getElementById('streamDate');
    var date = new Date();
    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0" + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    dateInput.value = year + '-' + month + '-' + day;
}
