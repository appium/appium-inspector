import {useContext} from 'react';

import {ThemeContext} from '../providers/ThemeProvider.jsx';

export const useTheme = () => useContext(ThemeContext);
