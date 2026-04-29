# Jammming 

A React web app that allows users to search for songs using the Spotify API and build and save custom playlists directly to their Spotify account.

## Features
- Search for tracks via Spotify
- Add/remove songs to a custom playlist 
- Save playlists directly to your Spotify account

## Tech Stack
- React
- JavaScript (ES6+)
- Spotify Web API 
- CSS 

## Live Demo
https://your-app-name.surge.sh

## Preview
![Jammming App Screenshot](./screenshot.png)

## How to Run Locally
1. Clone the repo
2. Install dependencies:
   npm install
3. Start the app:
   npm start
4. Open http://localhost:3000

## Environment Setup 
You’ll need a Spotify Developer account and API credentials.

Create a `.env` file and add:

REACT_APP_CLIENT_ID=your_client_id
REACT_APP_REDIRECT_URI=http://localhost:3000/

## Challenges
- Implementing Spotify OAuth authentication flow
- Managing asynchronous API requests
- Handling state between multiple React components

## Notes
- Requires Spotify authentication
- Built as part of a Codecademy project

## Future Improvements
- Add playlist editing 
- Improve UI/UX
- Deploy live version