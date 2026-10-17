import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const TimerContext = createContext(null);

export const TimerProvider = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');

  // Restore timer from localStorage on mount
  useEffect(() => {
    const savedStart = localStorage.getItem('timerStartTime');
    const savedProject = localStorage.getItem('timerProjectId');
    const savedDesc = localStorage.getItem('timerDescription');

    if (savedStart) {
      const start = parseInt(savedStart, 10);
      setStartTime(start);
      setProjectId(savedProject || '');
      setDescription(savedDesc || '');
      setIsRunning(true);
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }
  }, []);

  // Tick
  useEffect(() => {
    let interval = null;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const startTimer = useCallback((pid, desc) => {
    const now = Date.now();
    setStartTime(now);
    setProjectId(pid || '');
    setDescription(desc || '');
    setIsRunning(true);
    setElapsed(0);

    localStorage.setItem('timerStartTime', now.toString());
    localStorage.setItem('timerProjectId', pid || '');
    localStorage.setItem('timerDescription', desc || '');
  }, []);

  const stopTimer = useCallback(async () => {
    if (!isRunning || !startTime) return null;

    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const durationMins = Math.max(1, Math.round(durationMs / 60000));

    setIsRunning(false);
    setElapsed(0);
    setStartTime(null);

    // Clear localStorage
    localStorage.removeItem('timerStartTime');
    localStorage.removeItem('timerProjectId');
    localStorage.removeItem('timerDescription');

    if (!projectId) {
      toast.error('No project selected for timer');
      return null;
    }

    try {
      const { data } = await api.post('/time-logs', {
        projectId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: durationMins,
        description: description || 'Timer session',
      });
      toast.success(`Time logged: ${formatTime(elapsed)}`);
      return data;
    } catch (err) {
      toast.error('Failed to save time log');
      return null;
    }
  }, [isRunning, startTime, projectId, description, elapsed]);

  const cancelTimer = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    setStartTime(null);
    setProjectId('');
    setDescription('');
    localStorage.removeItem('timerStartTime');
    localStorage.removeItem('timerProjectId');
    localStorage.removeItem('timerDescription');
  }, []);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  };

  return (
    <TimerContext.Provider value={{
      isRunning,
      elapsed,
      startTime,
      projectId,
      description,
      setProjectId,
      setDescription,
      startTimer,
      stopTimer,
      cancelTimer,
      formatTime,
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be within TimerProvider');
  return ctx;
};
