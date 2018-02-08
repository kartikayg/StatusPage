/**
 * @fileoverview
 */
import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import RealtimeList from './realtime/list';
import ScheduledList from './scheduled/list';

import { filterRealtimeIncidents, filterScheduledIncidents } from '../../../redux/helper';

/**
 * Listing of Incidents
 */
class Listing extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      tab: props.match.params.tab || 'realtime'
    };
  }

  static propTypes = {
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    incidents: PropTypes.arrayOf(PropTypes.object).isRequired
  }

  onTabClick = (e) => {
    this.props.history.push(`/admin/incidents/${e.target.dataset.tab}`);
  }

  render() {

    const noBorder = {
      borderLeft: '0px',
      borderRight: '0px',
      borderBottom: '0px',
      paddingLeft: '0px'
    };

    const realtimeTabClass = classNames('item', { active: this.state.tab === 'realtime' });
    const scheduledTabClass = classNames('item', { active: this.state.tab === 'scheduled' });

    return (
      <div>
        <h1 className='ui header' style={{ marginBottom: '2.5rem' }}>Incidents</h1>
        <div className="ui top attached tabular menu">
          <a className={realtimeTabClass} data-tab='realtime' onClick={this.onTabClick}>
            Incidents
          </a>
          <a className={scheduledTabClass} data-tab='scheduled' onClick={this.onTabClick}>
            Scheduled Maintenance
          </a>
        </div>
        {this.state.tab === 'realtime' &&
          <div className="ui bottom attached tab segment active" style={ noBorder }>
            <RealtimeList incidents={filterRealtimeIncidents(this.props.incidents)} />
          </div>
        }
        {this.state.tab === 'scheduled' &&
          <div className="ui bottom attached tab segment active" style={ noBorder }>
            <ScheduledList incidents={filterScheduledIncidents(this.props.incidents)} />
          </div>
        }
      </div>
    );
  }

}

export default Listing;
