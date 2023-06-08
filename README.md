# Clips Vault

<div align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/version-1.0.0-orange.svg" alt="Version"></a>
</div>

Clips Vault is a powerful application designed to help you sort and manage clips from all your streams. With Clips Vault, you can easily organize, categorize, and catalogue the best moments from your stream.

## Features

### 1. Tags

[![Tags](https://img.shields.io/badge/feature-Tags-green.svg)]()

Stay informed and updated with the Notifications. Receive notifications directly from the application, keeping you in the loop about important events such as new stream additions, added clips, and deleted clips. Curerntly Discord and Gmail are the two supported platforms.

### 2. Queue

[![Queue](https://img.shields.io/badge/feature-Queue-blue.svg)]()
The queue feature enables you to create a playlist of clips to watch in a specific order. As you come across interesting clips, simply add them to your queue and enjoy a seamless playback experience as Clips Vault automatically plays through your selected clips one by one.

### 3. Notifications

[![Notifications](https://img.shields.io/badge/feature-Notifications-yellow.svg)]()

Stay up to date with the latest highlights from your favorite streamers with the notifications feature. Clips Vault will send you notifications whenever new clips are available, ensuring that you never miss out on the most exciting moments.

### 3. ClipIt

[![ClipIt](https://img.shields.io/badge/feature-ClipIt-red.svg)]()

Send a POST request to the application, providing the clip duration and any relevant tags. The application will process the request and create a clip based on the provided parameters. Automatically create clips every time you get raided, or a gifted bomb of over 10 or when a channel point is redeemed. Having the ability to store the

```
headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
},
{
  "length": 20,
  "tags": ["gaming", "funny", "raid"]
}
```

## Getting Started

To use Clips Vault locally, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/your-username/clips-vault.git
```

2. Install the necessary dependencies:

```bash
cd clipsvault
npm install
```

3. Start the application:

```bash
npm start
```

4. Access the application in your browser at `http://localhost:3000`.

## Contributing

Contributions are welcome! If you have any ideas, bug reports, or feature requests, please submit an issue or a pull request. For major changes, kindly open an issue first to discuss the proposed changes.

Please make sure to update tests as appropriate.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT). Feel free to use, modify, and distribute this code as permitted by the license.

## Contact

If you have any questions or need assistance, feel free to reach out to our support team at support@clipsvault.com.

Happy clipping!
