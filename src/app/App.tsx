import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router';
import { store } from '../store';
import { router } from './routes';

export default function App() {
  return (
    <Provider store={store}>
      {/* MARKER-MAKE-KIT-INVOKED */}
      <RouterProvider router={router} />
    </Provider>
  );
}
