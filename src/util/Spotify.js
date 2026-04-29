let accessToken;
let accessTokenPromise = null;

const clientId = '292fd97716ab4b269ef4660c4efce87e';
const redirectUri = 'https://matt-jammming.surge.sh';
const accessTokenKey = 'spotify_access_token';
const codeVerifierKey = 'spotify_code_verifier';
const pendingSearchKey = 'spotify_pending_search';

/* ---------------- PKCE HELPERS ---------------- */

function generateRandomString(length) {
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(x => possible[x % possible.length])
    .join('');
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function redirectToSpotifyAuth() {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  localStorage.setItem(codeVerifierKey, codeVerifier);

  const statePayload = {
    codeVerifier,
    origin: window.location.origin
  };
  const state = btoa(unescape(encodeURIComponent(JSON.stringify(statePayload))));

  const authUrl =
    `https://accounts.spotify.com/authorize` +
    `?client_id=${clientId}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=playlist-modify-public` +
    `&show_dialog=true` +
    `&code_challenge_method=S256` +
    `&code_challenge=${codeChallenge}` +
    `&state=${encodeURIComponent(state)}`;

  window.location = authUrl;
}

/* ---------------- MAIN OBJECT ---------------- */

const Spotify = {
  async getAccessToken() {
    if (accessToken) return accessToken;
    if (accessTokenPromise) return accessTokenPromise;

    accessTokenPromise = (async () => {
      console.log("ACCESS TOKEN IN MEMORY:", accessToken);
      console.log("LOCAL STORAGE TOKEN:", localStorage.getItem(accessTokenKey));
      console.log("LOCAL STORAGE CODE_VERIFIER:", localStorage.getItem(codeVerifierKey));
      console.log("URL:", window.location.href);

      const storedToken = localStorage.getItem(accessTokenKey);
      if (storedToken) {
        accessToken = storedToken;
        return accessToken;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!code) {
        await redirectToSpotifyAuth();
        return;
      }

      let codeVerifier = localStorage.getItem(codeVerifierKey);
      if (!codeVerifier) {
        const state = params.get('state');
        if (state) {
          try {
            const decoded = decodeURIComponent(escape(atob(state)));
            const payload = JSON.parse(decoded);
            if (payload.codeVerifier) {
              codeVerifier = payload.codeVerifier;
              localStorage.setItem(codeVerifierKey, codeVerifier);
            }
          } catch (error) {
            console.warn('Could not parse Spotify state:', error);
          }
        }
      }

      if (!codeVerifier) {
        console.warn('Missing code_verifier; restarting Spotify auth');
        localStorage.removeItem(accessTokenKey);
        await redirectToSpotifyAuth();
        return;
      }

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier
      });

      const response = await fetch(
        'https://accounts.spotify.com/api/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body
        }
      );

      const data = await response.json();

      if (!data.access_token) {
        console.error('Spotify token error:', data);
        if (data.error === 'invalid_grant') {
          localStorage.removeItem(codeVerifierKey);
        }
        accessTokenPromise = null;
        return;
      }

      accessToken = data.access_token;
      localStorage.setItem(accessTokenKey, accessToken);
      localStorage.removeItem(codeVerifierKey);

      // Clear the code from URL without reloading
      const url = new URL(window.location);
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      window.history.replaceState({}, document.title, url.toString());

      accessTokenPromise = null;
      return accessToken;
    })();

    return accessTokenPromise;
  },

  /* ---------------- SEARCH ---------------- */

  search(term) {
    return Spotify.getAccessToken().then(token => {
      if (!token) {
        localStorage.setItem(pendingSearchKey, term);
        console.warn('Spotify.search: no access token, redirecting to login');
        redirectToSpotifyAuth();
        return [];
      }

      localStorage.removeItem(pendingSearchKey);

      return fetch(
        `https://api.spotify.com/v1/search?type=track&q=${term}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      ).then(res => {
        if (res.status === 401) {
          Spotify.clearAccessToken();
          localStorage.setItem(pendingSearchKey, term);
          redirectToSpotifyAuth();
          return { tracks: { items: [] } };
        }
        return res.json();
      }).then(json => {
        if (!json.tracks) return [];

        return json.tracks.items.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          uri: track.uri
        }));
      });
    });
  },

  async verifyStoredToken() {
    const storedToken = localStorage.getItem(accessTokenKey);
    if (!storedToken) return false;

    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${storedToken}`
      }
    });

    if (response.ok) {
      accessToken = storedToken;
      return true;
    }

    Spotify.clearAccessToken();
    return false;
  },

  clearAccessToken() {
    accessToken = null;
    accessTokenPromise = null;
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(codeVerifierKey);
  },

  /* ---------------- SAVE PLAYLIST ---------------- */

  savePlaylist(name, trackURIs) {
    if (!name || !trackURIs.length) return;

    return Spotify.getAccessToken().then(token => {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      let userId;

      return fetch('https://api.spotify.com/v1/me', { headers })
        .then(res => res.json())
        .then(data => {
          userId = data.id;

          return fetch(
            `https://api.spotify.com/v1/users/${userId}/playlists`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({ name })
            }
          );
        })
        .then(res => res.json())
        .then(data => {
          const playlistId = data.id;

          return fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({ uris: trackURIs })
            }
          );
        });
    });
  }
};

export default Spotify;