import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import {
  setJobStarted,
  setJobProgress,
  setJobCompleted,
  setJobFailed,
} from '../features/assignmentsSlice';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socketInstance = null;

export const useSocket = (assignmentId) => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!assignmentId) return;

    // Reuse single socket instance
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    socketRef.current = socketInstance;
    const socket = socketRef.current;

    // Join the assignment-specific room
    socket.emit('join-assignment', assignmentId);

    const handleJobStarted = (data) => {
      if (data.assignmentId === assignmentId) {
        dispatch(setJobStarted(data));
      }
    };

    const handleJobProgress = (data) => {
      if (data.assignmentId === assignmentId) {
        dispatch(setJobProgress(data));
      }
    };

    const handleJobCompleted = (data) => {
      if (data.assignmentId === assignmentId) {
        dispatch(setJobCompleted(data));
      }
    };

    const handleJobFailed = (data) => {
      if (data.assignmentId === assignmentId) {
        dispatch(setJobFailed(data));
      }
    };

    socket.on('job-started', handleJobStarted);
    socket.on('job-progress', handleJobProgress);
    socket.on('job-completed', handleJobCompleted);
    socket.on('job-failed', handleJobFailed);

    return () => {
      socket.off('job-started', handleJobStarted);
      socket.off('job-progress', handleJobProgress);
      socket.off('job-completed', handleJobCompleted);
      socket.off('job-failed', handleJobFailed);
    };
  }, [assignmentId, dispatch]);

  return socketRef.current;
};
