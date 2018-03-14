/**
 * @fileoverview
 */

import React from 'react';
import { Redirect } from 'react-router-dom';
import flashMsgStorage from '../lib/flash-message-storage';

const ConfirmSubscription = () => {
  flashMsgStorage.add('success', 'Subsciption is confirmed.');
  return <Redirect to='/' />;
};

export default ConfirmSubscription;
