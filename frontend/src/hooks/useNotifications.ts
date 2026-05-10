import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
}

/**
 * Hook for real-time notifications via WebSocket (STOMP over SockJS).
 * Falls back to polling if WebSocket is unavailable.
 */
export function useNotifications() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    if (!user || !token) return;

    // Try WebSocket connection
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        } catch { /* ignore */ }
      };

      ws.onerror = () => {
        // Fallback to polling
        startPolling();
      };

      ws.onclose = () => {
        startPolling();
      };
    } catch {
      startPolling();
    }

    // Initial fetch
    fetchUnreadCount();

    return () => {
      wsRef.current?.close();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user, token]);

  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(fetchUnreadCount, 30000);
  };

  return { notifications, unreadCount, refetch: fetchUnreadCount };
}
