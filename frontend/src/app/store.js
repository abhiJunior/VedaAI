import { configureStore } from '@reduxjs/toolkit';
import assignmentsReducer from '../features/assignmentsSlice';

const store = configureStore({
  reducer: {
    assignments: assignmentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['assignments/setCurrentAssignment'],
      },
    }),
});

export default store;
