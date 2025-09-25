# BINJ - Streaming Interface

**Author : [@RubnK](https://github.com/RubnK)**

This project is a Netflix-like streaming interface built with HTML5, CSS3, and vanilla JavaScript. The application provides a complete user experience with authentication, movie/series search, and TMDB API integration.

The codebase utilizes modern web technologies:
- HTML5 for semantic structure
- CSS3 for styling and animations
- JavaScript ES6+ for functionality
- TMDB API for movie data
- YouTube API for trailers

**Live Demo**: [https://binj.rcorp.fr](https://binj.rcorp.fr)

## Table of content

- [Installation](#installation)
- [API Setup](#api-setup)
- [Running the application](#running-the-application)
- [Usage](#usage)
- [Directory Structure](#directory-structure)
- [License](#license)

## Installation

1. Clone or download the project:
    ```sh
    git clone <repository-url>
    cd binj
    ```

2. No dependencies to install - pure vanilla JavaScript project.

## API Setup

1. Create an account on [The Movie Database (TMDB)](https://www.themoviedb.org/)

2. Get your API key from your account settings

3. Replace the API key in the `api.js` file:
    ```javascript
    const API_KEY = 'YOUR_TMDB_API_KEY';
    ```

## Running the Application

You can run the application in several ways:

- **Direct browser access:**
    ```sh
    # Simply open index.html in your browser
    ```

- **Node.js HTTP Server:**
    ```sh
    npx http-server
    ```

- **VS Code Live Server:**
    ```sh
    # Right-click on index.html → "Open with Live Server"
    ```

Visit `http://localhost:8000` (or your chosen port) in your web browser to see the application.

## Usage

### Features
- Browse popular movies on the homepage
- Search for specific movies and series
- View detailed movie information with trailers
- Responsive design for all devices
- User authentication and session management

## Directory Structure

- `index.html` : Login page
- `subscription.html` : Subscription selection page
- `home.html` : Main homepage with movie carousels
- `search.html` : Search functionality page
- `details.html` : Movie/series details page
- `styles.css` : Global CSS styles
- `auth.js` : Authentication logic
- `api.js` : TMDB API interface
- `main.js` : Homepage functionality
- `search.js` : Search page logic
- `details.js` : Details page functionality

## License

This project is developed for educational purposes and licensed uder the [MIT License](LICENSE). Images and data are provided by TMDB under their respective license.
