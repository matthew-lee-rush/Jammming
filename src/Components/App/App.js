// import logo from './favicon.ico';

import React from 'react';
import './App.css';
import SearchBar from '../SearchBar/SearchBar';
import SearchResults from '../SearchResults/SearchResults';
import Playlist from '../Playlist/Playlist.js';
import Spotify from '../../util/Spotify';

class App extends React.Component {
  constructor(props) {
    super(props);

    console.log("APP VERSION 2 LOADED");

    this.state = {
      searchResults: [
        {
          id: 1,
          name: "Track Name 1",
          artist: "Artist 1",
          album: "Album 1"
        },
        {
          id: 2,
          name: "Track Name 2",
          artist: "Artist 2",
          album: "Album 2"
        }
      ],
      playlistName: 'My Playlist',
      playlistTracks: [
        {
          id: 3,
          name: "Track Name 3",
          artist: "Artist A",
          album: "Album A"
        },
        {
          id: 4,
          name: "Track Name 4",
          artist: "Artist B",
          album: "Album B"
        }
      ],
      isLoggedIn: false
    };

    // Bind methods
    this.addTrack = this.addTrack.bind(this);
    this.removeTrack = this.removeTrack.bind(this);
    this.updatePlaylistName = this.updatePlaylistName.bind(this);
    this.savePlaylist = this.savePlaylist.bind(this);
    this.search = this.search.bind(this);
    this.handleLoginClick = this.handleLoginClick.bind(this);
    this.handleLogoutClick = this.handleLogoutClick.bind(this);
  }

  async componentDidMount() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    // Check for stored token first
    const storedValid = await Spotify.verifyStoredToken();
    if (storedValid) {
      this.setState({ isLoggedIn: true });
      return;
    }

    // If we have a code, complete the auth exchange
    if (code) {
      const token = await Spotify.getAccessToken();
      if (token) {
        this.setState({ isLoggedIn: true });
      }
    }

    window.addEventListener("beforeunload", () => {
      console.log("PAGE IS RELOADING");
    });
  }

  handleLoginClick() {
    Spotify.getAccessToken().then(token => {
      if (token) {
        this.setState({ isLoggedIn: true });
      }
    });
  }

  handleLogoutClick() {
    Spotify.clearAccessToken();
    this.setState({ isLoggedIn: false });
  }


  savePlaylist() {
    const trackURIs = this.state.playlistTracks.map(track => track.uri);

    Spotify.savePlaylist(this.state.playlistName, trackURIs);

    this.setState({
      playlistName: 'New Playlist',
      playlistTracks: []
    });
  }

  addTrack(track) {
    const tracks = this.state.playlistTracks;

    if (tracks.find(savedTrack => savedTrack.id === track.id)) {
      return;
    }

    const newTracks = [...tracks, track];

    this.setState({
      playlistTracks: newTracks
    });
  }

  removeTrack(track) {
    const tracks = this.state.playlistTracks;

    const newTracks = tracks.filter(
      savedTrack => savedTrack.id !== track.id
    );

    this.setState({
      playlistTracks: newTracks
    });
  }

  updatePlaylistName(name) {
    this.setState({
      playlistName: name
    });
  }

  search(term) {
    Spotify.search(term).then(searchResults => {
      this.setState({ searchResults: searchResults });
    });
  }

  render() {
    console.log("Rendering App component - isLoggedIn:", this.state.isLoggedIn);
    return (
      <div>
        <h1>🔥 THIS IS THE REAL APP FILE</h1> 

        <h1>
          Ja<span className="highlight">mmm</span>ing
        </h1>
        <div className="App">
        <div className="App-status">
          <p>
            Status: {this.state.isLoggedIn ? 'Logged in to Spotify' : 'Not logged in'}
          </p>
          {!this.state.isLoggedIn ? (
            <button className="SearchButton" onClick={this.handleLoginClick}>
              Log in with Spotify
            </button>
          ) : (
            <button className="SearchButton" onClick={this.handleLogoutClick}>
              Log out of Spotify
            </button>
          )}
        </div>
          <SearchBar onSearch={this.search} />
          <div className="App-playlist">
            <SearchResults
              searchResults={this.state.searchResults}
              onAdd={this.addTrack}
            />
            <Playlist
              playlistName={this.state.playlistName}
              playlistTracks={this.state.playlistTracks}
              onNameChange={this.updatePlaylistName}
              onRemove={this.removeTrack}
              onSave={this.savePlaylist}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default App;