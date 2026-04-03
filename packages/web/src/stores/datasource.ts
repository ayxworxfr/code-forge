import { create } from 'zustand';
import type { DataSource, TableInfo } from '@/types';

interface DataSourceStore {
  dataSources: DataSource[];
  currentDataSource: DataSource | null;
  tables: TableInfo[];
  loading: boolean;
  setDataSources: (dataSources: DataSource[]) => void;
  setCurrentDataSource: (dataSource: DataSource | null) => void;
  setTables: (tables: TableInfo[]) => void;
  setLoading: (loading: boolean) => void;
  addDataSource: (dataSource: DataSource) => void;
  updateDataSource: (id: number, dataSource: DataSource) => void;
  removeDataSource: (id: number) => void;
}

export const useDataSourceStore = create<DataSourceStore>((set) => ({
  dataSources: [],
  currentDataSource: null,
  tables: [],
  loading: false,
  setDataSources: (dataSources) => set({ dataSources }),
  setCurrentDataSource: (dataSource) => set({ currentDataSource: dataSource }),
  setTables: (tables) => set({ tables }),
  setLoading: (loading) => set({ loading }),
  addDataSource: (dataSource) =>
    set((state) => ({
      dataSources: [...state.dataSources, dataSource],
    })),
  updateDataSource: (id, dataSource) =>
    set((state) => ({
      dataSources: state.dataSources.map((ds) => (ds.id === id ? dataSource : ds)),
    })),
  removeDataSource: (id) =>
    set((state) => ({
      dataSources: state.dataSources.filter((ds) => ds.id !== id),
    })),
}));
