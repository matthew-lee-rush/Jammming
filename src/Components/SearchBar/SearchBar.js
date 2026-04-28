import React from 'react';
import './SearchBar.css';

class SearchBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      term: ''
    };

    this.search = this.search.bind(this);
    this.handleTermChange = this.handleTermChange.bind(this);
  }

  search(event) {
  if (event) event.preventDefault();
  this.props.onSearch(this.input.value);
}

  handleTermChange(event) {
    this.setState({ term: event.target.value });
  }

  render() {
    return (
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="SearchBar">
          <input 
            placeholder="Enter A Song, Album, or Artist"
            value={this.state.term}
            onChange={this.handleTermChange}
            ref={(input) => this.input = input}
          />

          <button 
            type="button"
            className="SearchButton"
            onClick={(event) => this.search(event)}
          >
            SEARCH
          </button>
        </div>
      </form>
    );
  }
}

export default SearchBar;