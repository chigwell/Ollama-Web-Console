# OLLAMA Web Console

This React-based project serves as a web console interacting with the OLLAMA backend. It provides a terminal interface where users can input commands, receive responses, and manage application states, leveraging React and an external REST API.

## Components

- **App.js**: The main React component that renders the `TerminalController`.
- **TerminalController.js**: Manages the terminal's state, input/output, and the commands passed to the OLLAMA backend.
- **utilities.js**: Contains utility functions such as checking the availability of the OLLAMA models.

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/chigwell/Ollama-Web-Console.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Live Demo

View a live demo of the application: [Ollama Web Console Live Demo](https://ollama-web-console.vercel.app/)

## Configuring CORS for OLLAMA

Configuring CORS settings is crucial for the security and proper functioning of the OLLAMA backend. Here's how to set up CORS for different operating systems:

### macOS

- **Allow All Domains**:
  ```bash
  launchctl setenv OLLAMA_ORIGINS "*"
  ```
- **Specific Domains**:
  ```bash
  launchctl setenv OLLAMA_ORIGINS "google.com,linkedin.com"
  ```
- Restart the OLLAMA application to apply these settings.

### Linux

- **Edit the systemd service file**:
  ```bash
  systemctl edit ollama.service
  ```
- Add the following in the `[Service]` section for unrestricted access:
  ```
  [Service]
  Environment="OLLAMA_ORIGINS=*"
  ```
  Or for specific domains:
  ```
  [Service]
  Environment="OLLAMA_ORIGINS=google.com,linkedin.com"
  ```
- Reload systemd and restart the OLLAMA service:
  ```bash
  systemctl daemon-reload
  systemctl restart ollama
  ```

### Windows

- Navigate to **Control Panel** > **System and Security** > **System** > **Advanced system settings** > **Environment Variables**.
- Add or edit `OLLAMA_ORIGINS`. To allow all domains:
  ```
  OLLAMA_ORIGINS=*
  ```
  Or for specific domains:
  ```
  OLLAMA_ORIGINS=google.com,linkedin.com
  ```
- Apply the changes and restart OLLAMA from a new terminal window.

### Security Note

Using `OLLAMA_ORIGINS="*"` allows all domains to access your OLLAMA resources, which might be insecure. It's recommended to specify only trusted domains to safeguard your data and services.

## Contributing

Contributions are welcome! Please submit pull requests with your enhancements.

## License

This project is licensed under the MIT License. 