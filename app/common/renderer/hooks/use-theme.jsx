import {use} from 'react';

import {ThemeContext} from '../providers/ThemeProvider.jsx';

export const useTheme = () => use(ThemeContext);
