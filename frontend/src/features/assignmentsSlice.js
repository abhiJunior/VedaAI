import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/client';

// Thunks
export const createAssignment = createAsyncThunk(
  'assignments/create',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllAssignments = createAsyncThunk(
  'assignments/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/assignments');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAssignment = createAsyncThunk(
  'assignments/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/assignments/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const regenerateAssignment = createAsyncThunk(
  'assignments/regenerate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/assignments/${id}/regenerate`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState: {
    list: [],
    currentAssignment: null,
    jobStatus: null, // null | 'started' | 'progress' | 'completed' | 'failed'
    jobProgress: 0,
    jobMessage: '',
    loading: false,
    creating: false,
    error: null,
  },
  reducers: {
    setJobStarted(state, action) {
      state.jobStatus = 'started';
      state.jobProgress = action.payload.progress || 10;
      state.jobMessage = action.payload.message || 'Job started...';
    },
    setJobProgress(state, action) {
      state.jobStatus = 'progress';
      state.jobProgress = action.payload.progress || 50;
      state.jobMessage = action.payload.message || 'Processing...';
    },
    setJobCompleted(state, action) {
      state.jobStatus = 'completed';
      state.jobProgress = 100;
      state.jobMessage = action.payload.message || 'Done!';
      if (action.payload.result && state.currentAssignment) {
        state.currentAssignment.result = action.payload.result;
        state.currentAssignment.status = 'completed';
      }
    },
    setJobFailed(state, action) {
      state.jobStatus = 'failed';
      state.jobMessage = action.payload.message || 'Generation failed';
      state.error = action.payload.error;
    },
    clearJobStatus(state) {
      state.jobStatus = null;
      state.jobProgress = 0;
      state.jobMessage = '';
    },
    setCurrentAssignment(state, action) {
      state.currentAssignment = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // createAssignment
    builder
      .addCase(createAssignment.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.creating = false;
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      });

    // fetchAllAssignments
    builder
      .addCase(fetchAllAssignments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchAssignment
    builder
      .addCase(fetchAssignment.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAssignment = action.payload;
      })
      .addCase(fetchAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // regenerateAssignment
    builder
      .addCase(regenerateAssignment.pending, (state) => {
        state.creating = true;
        state.jobStatus = null;
        state.error = null;
      })
      .addCase(regenerateAssignment.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(regenerateAssignment.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      });
  },
});

export const {
  setJobStarted,
  setJobProgress,
  setJobCompleted,
  setJobFailed,
  clearJobStatus,
  setCurrentAssignment,
  clearError,
} = assignmentsSlice.actions;

export default assignmentsSlice.reducer;
