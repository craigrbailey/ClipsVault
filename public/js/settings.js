function updateButtonStatus(status) {
    const button = document.getElementById('obs-button');
    const hostInput = document.getElementById('host');
    const portInput = document.getElementById('port');
    const passwordInput = document.getElementById('password');
  
    if (status) {
      // OBS connection is active
      button.innerText = 'Connected';
      button.style.backgroundColor = 'green';
      button.style.cursor = 'default';
      button.disabled = true;
  
      // Disable host, port, and password inputs
      hostInput.disabled = true;
      hostInput.value = 'localhost';
      portInput.disabled = true;
      portInput.value = '4444';
      passwordInput.disabled = true;
      passwordInput.value = 'password';
    } else {
      // OBS connection is inactive
      button.innerText = 'Connect';
      button.style.backgroundColor = 'initial';
      button.disabled = false;
  
      // Enable host, port, and password inputs
      hostInput.disabled = false;
      portInput.disabled = false;
      passwordInput.disabled = false;
    }
}
  
  
function getOBSConnectionStatus() {
    fetch('/obs-connection-status')
        .then(response => response.json())
        .then(data => {
        const status = data.status;
        updateButtonStatus(status);
        })
        .catch(error => {
        console.error(error);
        });
}
  
// Initial update to button status
getOBSConnectionStatus();

// Periodic updates to button status (every 5 seconds)
setInterval(getOBSConnectionStatus, 5000);
  