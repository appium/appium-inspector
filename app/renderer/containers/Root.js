import React from 'react';
import {Provider} from 'react-redux';
import {MemoryRouter} from 'react-router-dom';

import AllRoutes from '../routes';

const Root = ({store}) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={['/']}>
      <AllRoutes />
    </MemoryRouter>
  </Provider>
);

export default Root;
