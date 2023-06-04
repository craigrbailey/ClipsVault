function updateButtonStatus(status) {
    const button = document.getElementById('obs-button');
    const hostInput = document.getElementById('host');
    const portInput = document.getElementById('port');
    const passwordInput = document.getElementById('password');
    const liveRequiredSwitch = document.getElementById('liveRequired');
  
    if (status) {
      // OBS connection is active
      button.innerText = 'Connected';
      button.style.backgroundColor = 'green';
      button.style.cursor = 'default';
      button.disabled = true;
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
setInterval(getOBSConnectionStatus, 5000);

liveRequiredSwitch.addEventListener('change', () => {
  console.log('Live Required switch changed.')
  const isChecked = liveRequiredSwitch.checked;
  const data = {
    setting: 'liveRequired',
    value: isChecked.toString()
  };
  fetch('/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (response.ok) {
      console.log('Live Required setting updated successfully.');
    } else {
      console.log('Failed to update Live Required setting.');
    }
  })
  .catch(error => {
    console.error('An error occurred while updating the Live Required setting:', error);
  });
});
  