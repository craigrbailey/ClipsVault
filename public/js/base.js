const notificationBell = document.querySelector('.notification-bell');
const notificationDropdown = document.querySelector('.notification-dropdown');
const notificationCount = document.querySelector('.notification-count');
const notificationList = document.querySelector('.notification-list');


notificationBell.addEventListener('click', function() {
  notificationDropdown.classList.toggle('show');
});

notificationCount.addEventListener('click', function() {
  notificationDropdown.classList.toggle('show');
});

function showNotifications(numNotifications) {
  notificationList.innerHTML = '';
  for (let i = 1; i <= numNotifications; i++) {
    const notificationItem = document.createElement('li');
    notificationItem.classList.add('notification-item');
    notificationItem.textContent = 'Notification ' + i;
    notificationList.appendChild(notificationItem);
  }
  if (numNotifications > 10) {
    notificationDropdown.style.height = 'calc(10 * 40px)';
  } else {
    notificationDropdown.style.height = 'auto';
  }
}


function updateMemoryUsage() {
    fetch('/memory-usage')
      .then(response => response.json())
      .then(({ usedMemoryPercentage, usedMemory, totalMemory }) => {
        const freeMemoryPercentage = (100 - usedMemoryPercentage).toFixed(0);
  
        const progressBar = document.querySelector('.progress-bar');
        const percent = document.getElementById('percent');
        const storage = document.getElementById('storage');
  
        progressBar.style.width = `${freeMemoryPercentage}%`;
        percent.innerHTML = `${freeMemoryPercentage}% Remaining`;
        storage.innerHTML = `${usedMemory} / ${totalMemory}`;
      })
      .catch(error => console.error(error));
  }

window.addEventListener('load', () => {
    updateMemoryUsage();
  });