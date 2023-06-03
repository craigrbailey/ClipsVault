const apiKey = '<%= apiKey %>';
console.log(`API Key: ${apiKey}`);
const videoId = urlParams.get('videoId');

function addTagToVideo(event) {
    event.preventDefault();

    const tagInput = document.getElementById('tag-input');
    const tagList = document.getElementById('tag-list');
    const newTag = tagInput.value.trim();

    if (newTag !== '') {
        const tagType = 'video'; // Assuming the tag type is 'stream'
        const id = videoId; // Replace with the actual stream ID

        // Make an API request to add the tag
        fetch('/api/tags', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
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