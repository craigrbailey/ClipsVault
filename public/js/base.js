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
