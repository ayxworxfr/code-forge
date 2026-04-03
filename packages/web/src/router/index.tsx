import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import {
  Generator,
  DataSource,
  Template,
  TemplateEditor,
  TypeMapping,
  History,
  Config,
} from '@/pages';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Generator />,
      },
      {
        path: 'datasource',
        element: <DataSource />,
      },
      {
        path: 'template',
        element: <Template />,
      },
      {
        path: 'template/:id/edit',
        element: <TemplateEditor />,
      },
      {
        path: 'type-mapping',
        element: <TypeMapping />,
      },
      {
        path: 'history',
        element: <History />,
      },
      {
        path: 'config',
        element: <Config />,
      },
    ],
  },
]);
