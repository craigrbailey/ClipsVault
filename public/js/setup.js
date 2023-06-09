
let connectButton = document.getElementById('obs-button');
const finishbtn = document.getElementById('finish-button')
let currentIndex = 0;
let currentSettings = null;

// Register event listeners
document.addEventListener('DOMContentLoaded', async function () {
  await getSettings();
  finishbtn.addEventListener('click', handleFinishButtonClick);
  connectButton.addEventListener('click', handleConnect);
});

function handleFinishButtonClick() {
  console.log('Finish button clicked');
  fetch('/setup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ success: true }),
  })
    .then((response) => {
      console.log('Response:', response);
      if (response.ok) {
        window.location.href = '/';
      } else {
        console.error('Error sending success status to server');
      }
    })
    .catch((error) => {
      console.error('Error sending success status to server:', error);
    });
}

async function handleConnect(event) {
  event.preventDefault();
  const hostInput = document.getElementById('host');
  const portInput = document.getElementById('port');
  const passwordInput = document.getElementById('password');
  const host = hostInput.value.trim();
  const port = portInput.value.trim();

  if (!isValidIpAddress(host) && host !== 'localhost') {
    displayErrorMessage(hostInput, 'Invalid IP address!');
    return;
  } else {
    clearErrorMessage(hostInput);
  }

  if (!isValidPort(port)) {
    displayErrorMessage(portInput, 'Invalid port!');
    return;
  } else {
    clearErrorMessage(portInput);
  }

  connectButton.disabled = true;
  connectButton.textContent = 'Connecting...';

  try {
    await fetch('/api/obs-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ host, port, password: passwordInput.value }),
    });

    const startTime = new Date().getTime();
    const intervalId = setInterval(async () => {
      const currentTime = new Date().getTime();
      const elapsedTime = currentTime - startTime;
      if (elapsedTime >= 10000) {
        clearInterval(intervalId);
        connectButton.disabled = false;
        connectButton.textContent = 'Failed';
        connectButton.style.backgroundColor = 'red';
        return;
      }

      try {
        const response = await fetch('/api/obs-connection');
        if (response.status === 200) {
          const { status } = await response.json();

          if (status === true) {
            clearInterval(intervalId);
            connectButton.disabled = false;
            connectButton.textContent = 'Connected';
            connectButton.style.backgroundColor = 'green';
          }
        }
      } catch (error) {
        console.error('Error checking OBS connection status:', error);
      }
    }, 500);
  } catch (error) {
    console.error('Error updating OBS settings:', error);
    displayErrorMessage(connectButton, 'Failed to update OBS settings.');
    connectButton.disabled = false;
    connectButton.textContent = 'Connect';
  }
}

// Function to get settings from the server
async function getSettings() {
  try {
    const response = await fetch('/api/settings');
    if (response.ok) {
      const settings = await response.json();
      const settingsObject = settings.find(item => item._id === 'settings');
      if (settingsObject) {
        console.log(settingsObject);
      } else {
        console.log('Settings not found');
      }
      return settings;
    } else {
      console.error('Error getting settings from the server');
    }
  } catch (error) {
    console.error('Error getting settings from the server:', error);
  }
}

// Function to validate IP address
function isValidIpAddress(ip) {
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  return ipRegex.test(ip);
}

// Function to validate port
function isValidPort(port) {
  const portRegex = /^\d+$/;
  return portRegex.test(port);
}

// Function to display error message
function displayErrorMessage(inputElement, message) {
  clearErrorMessage(inputElement);
  const errorMessage = document.createElement('div');
  errorMessage.className = 'error-message';
  errorMessage.textContent = message;
  inputElement.parentNode.insertBefore(errorMessage, inputElement.nextSibling);
  inputElement.classList.add('error');
}

// Function to clear error message
function clearErrorMessage(inputElement) {
  const errorMessage = inputElement.parentNode.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.parentNode.removeChild(errorMessage);
  }
  inputElement.classList.remove('error');
}

document.addEventListener('DOMContentLoaded', async function () {
  await getSettings();
});