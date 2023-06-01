// Slide show functionality
document.addEventListener('DOMContentLoaded', function() {
  const slidesContainer = document.querySelector('.slides');
  const slides = document.querySelectorAll('.slide');
  const previousButton = document.querySelector('.button.previous');
  const nextButton = document.querySelector('.button.next');
  let currentIndex = 0;

  previousButton.addEventListener('click', showPreviousSlide);
  nextButton.addEventListener('click', showNextSlide);

  function showPreviousSlide() {
    if (currentIndex > 0) {
      slidesContainer.style.transform = `translateX(-${100 * (currentIndex - 1)}%)`;
      currentIndex--;

      nextButton.disabled = false;
    }

    if (currentIndex === 0) {
      previousButton.disabled = true;
    }

    // Check if on the last slide and update the next button
    if (currentIndex === slides.length - 1) {
      nextButton.textContent = 'Finish';
      nextButton.style.backgroundColor = 'green';
    }
  }

  function showNextSlide() {
    if (currentIndex < slides.length - 1) {
      slidesContainer.style.transform = `translateX(-${100 * (currentIndex + 1)}%)`;
      currentIndex++;

      previousButton.disabled = false;
    }

    if (currentIndex === slides.length - 1) {
      // nextButton.disabled = true;

      // Change next button to finish button and route to /dashboard
      nextButton.textContent = 'Finish';
      nextButton.style.backgroundColor = 'green';
      nextButton.removeEventListener('click', showNextSlide); // Remove previous event listener
      nextButton.addEventListener('click', handleFinishButtonClick); // Add new event listener
    }
  }

  function handleFinishButtonClick() {
    console.log('Finish button clicked');
    // Send POST request to server endpoint with success parameter
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
});


// Connect button functionality
document.addEventListener('DOMContentLoaded', function() {
  // Get the button element
  const connectButton = document.getElementById('obs-button');

  // Add event listener to the button
  connectButton.addEventListener('click', handleConnect);

  // Function to handle the Connect button click
  async function handleConnect(event) {
    event.preventDefault();

    // Get the input elements
    const hostInput = document.getElementById('host');
    const portInput = document.getElementById('port');
    const passwordInput = document.getElementById('password');

    // Validate the input values
    const host = hostInput.value.trim();
    const port = portInput.value.trim();

    // Validate IP address or localhost
    if (!isValidIpAddress(host) && host !== 'localhost') {
      displayErrorMessage(hostInput, 'Invalid IP address!');
      return;
    } else {
      clearErrorMessage(hostInput);
    }

    // Validate port
    if (!isValidPort(port)) {
      displayErrorMessage(portInput, 'Invalid port!');
      return;
    } else {
      clearErrorMessage(portInput);
    }

    // Disable the button and change its text to "Connecting..."
    connectButton.disabled = true;
    connectButton.textContent = 'Connecting...';

    // Send the form data to the endpoint
    try {
      // Update the following endpoint URL according to your server configuration
      await fetch('/obs-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ host, port, password: passwordInput.value }),
      });

      // Start checking the status for up to 10 seconds
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
          const response = await fetch('/obs-connection');
          if (response.status === 200) {
            const { status } = await response.json();

            // If the status is true, update the button and stop checking the status
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
});


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
  // Remove any existing error message
  clearErrorMessage(inputElement);

  // Create error message element
  const errorMessage = document.createElement('div');
  errorMessage.className = 'error-message';
  errorMessage.textContent = message;

  // Insert error message after the input element
  inputElement.parentNode.insertBefore(errorMessage, inputElement.nextSibling);

  // Add error class to the input element
  inputElement.classList.add('error');
}

// Function to clear error message
function clearErrorMessage(inputElement) {
  // Remove any existing error message
  const errorMessage = inputElement.parentNode.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.parentNode.removeChild(errorMessage);
  }

  // Remove error class from the input element
  inputElement.classList.remove('error');
}
