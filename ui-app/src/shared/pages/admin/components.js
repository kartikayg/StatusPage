/**
 * @fileoverview Container component: Components Admin Page
 */

import React from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import _sortBy from 'lodash/fp/sortBy';

import List from './components/list';
import Form from './components/form';
import * as rActions from '../../redux/actions/components';

import { groupComponents } from '../../redux/helper';

/**
 * Container for displaying all section of components
 */
const ComponentsDisplay = (props) => {
  return (
    <div>
      <Helmet>
        <title>Components</title>
      </Helmet>
      <Switch>
        <Route key={`ROUTE_${Math.random()}`} exact path={props.match.path}
          render={(subProps) => {
            return <List {...subProps}
                         componentsByGroup={props.componentsByGroup}
                         onComponentSortUpdate={props.updateComponentSortOrder}
                   />;
          }}
        />
        <Route key={`ROUTE_${Math.random()}`} exact path={`${props.match.path}/add`}
          render={(subProps) => {
            return <Form {...subProps}
                        groups={props.groups}
                        componentsCount={props.components.length}
                        onNewComponent={props.addComponent}
                        onNewGroup={props.addGroup}
                   />;
          }}
        />
      </Switch>
    </div>
  );
};

ComponentsDisplay.propTypes = {
  components: PropTypes.arrayOf(PropTypes.object).isRequired,
  groups: PropTypes.arrayOf(PropTypes.object).isRequired,
  componentsByGroup: PropTypes.arrayOf(PropTypes.object).isRequired,
  match: PropTypes.object.isRequired,
  updateComponentSortOrder: PropTypes.func.isRequired,
  addComponent: PropTypes.func.isRequired,
  addGroup: PropTypes.func.isRequired
};

// mapping redux state and actions to props to pass the display component
const mapStateToProps = (state) => {
  return {
    components: state.components,
    groups: _sortBy(['name'])(state.componentGroups),
    componentsByGroup: groupComponents(state.components, state.componentGroups)
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addGroup: (group) => {
      dispatch(rActions.addComponentGroup(group));
    },
    addComponent: (component) => {
      dispatch(rActions.addComponent(component));
    },
    updateComponent: (component) => {
      dispatch(rActions.updateComponent(component));
    },
    updateComponentSortOrder: (payload) => {
      dispatch(rActions.updateComponentSortOrder(payload));
    }
  };
};


const ComponentsPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(ComponentsDisplay);

export default ComponentsPage;
