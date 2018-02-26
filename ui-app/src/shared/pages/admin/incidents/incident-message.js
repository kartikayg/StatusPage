/**
 * @fileoverview Component for Incident-message editor with markdown support
 */

import React from 'react';
import ReactMde, { ReactMdeCommands } from 'react-mde';
import ReactMarkdown from 'react-markdown';
import PropTypes from 'prop-types';

import '../../../../../node_modules/react-mde/lib/styles/css/react-mde-all.css';
import '../../../../../node_modules/font-awesome/css/font-awesome.css';

// input component for the message field
const Input = ({ value, onChange, name }) => {

  let inputVal = value;
  if (value && typeof value !== 'object') {
    inputVal = { text: value, selection: null };
  }

  return (
    <ReactMde
      textAreaProps={{
        id: name,
        name
      }}
      value={inputVal}
      onChange={onChange}
      commands={[
          [
            ReactMdeCommands.makeHeaderCommand,
            ReactMdeCommands.makeBoldCommand,
            ReactMdeCommands.makeItalicCommand
          ],
          [
            ReactMdeCommands.makeLinkCommand
          ],
          [
            ReactMdeCommands.makeUnorderedListCommand,
            ReactMdeCommands.makeOrderedListCommand
          ]
        ]}
    />
  );
};

Input.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.object, PropTypes.string
  ]).isRequired,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired
};

// how to render the message field
const Render = ({ message }) => {
  return <ReactMarkdown source={message} />;
};

Render.propTypes = {
  message: PropTypes.string.isRequired
};

export { Input, Render };
