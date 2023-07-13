import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import Routes from '../routes';

const Root = ({ store }) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={['/']}>
      <Routes />
    </MemoryRouter>
  </Provider>
);

export default Root;
