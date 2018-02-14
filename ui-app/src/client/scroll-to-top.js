/**
 * @fileoverview
 */

import React from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';

class ScrollToTop extends React.Component {

  static propTypes = {
    location: PropTypes.object.isRequired,
    children: PropTypes.object.isRequired
  }

  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      window.scrollTo(0, 0); // eslint-disable-line no-undef
    }
  }

  render() {
    return this.props.children;
  }
}

export default withRouter(ScrollToTop);
