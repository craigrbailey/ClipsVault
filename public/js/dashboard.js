const deleteNotificationButtons = document.querySelectorAll('.dete-noti');
const addStream = document.getElementById('add-stream');
const newStreamForm = document.getElementById('new-stream-form');

addStream.addEventListener('click', (event) => { 
  newStreamForm.style.display = 'block';
});

function convertSecondsToHMS(seconds) {
  let hours = Math.floor(seconds / 3600);
  let minutes = Math.floor((seconds % 3600) / 60);
  let secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}


