# Clips Vault

<div style="text-align: center;">
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)]()
</div>

Clips Vault is a powerful application designed to help you sort and manage clips from all your streams. With Clips Vault, you can easily organize, categorize, and catalogue the best moments from your stream.

## Features

### 1. Tags

Tags allow you to categorize your clips based on various themes, events or any other criteria you find relevant. Easily assign tags to your clips to create personalized collections and quickly locate specific clips whenever you want to revisit them.

### 2. Queue

The queue feature enables you to create a playlist of clips to watch in a specific order. As you come across interesting clips, simply add them to your queue and enjoy a seamless playback experience as Clips Vault automatically plays through your selected clips one by one.

### 3. Notifications

Stay up to date with the latest highlights from your favorite streamers with the notifications feature. Clips Vault will send you notifications whenever new clips are available, ensuring that you never miss out on the most exciting moments.

### 3. ClipIt
Send a POST request to the application, providing the clip duration and any relevant tags. The application will process the request and create a clip based on the provided parameters. Automatically create clips every time you get raided, or a gifted bomb of over 10 or when a channel point is redeemed. Having the ability to store the
```
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
