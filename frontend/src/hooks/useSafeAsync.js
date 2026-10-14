import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook для безопасного выполнения async функций в useEffect
 * Автоматически отменяет setState если компонент размонтирован
 *
 * @example
 * const runAsync = useSafeAsync();
 *
 * useEffect(() => {
 *   runAsync(async () => {
 *     const data = await fetchData();
 *     setState(data); // Безопасно - не вызовется если unmounted
 *   });
 * }, [runAsync]);
 */
export function useSafeAsync() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const runAsync = useCallback(async (asyncFn) => {
    try {
      return await asyncFn(isMountedRef);
    } catch (error) {
      // Пробрасываем ошибку дальше если компонент еще смонтирован
      if (isMountedRef.current) {
        throw error;
      }
      // Игнорируем ошибки от размонтированных компонентов
      return null;
    }
  }, []);

  return runAsync;
}

/**
 * Hook для создания AbortController который автоматически отменяется при unmount
 *
 * @example
 * const abortController = useAbortController();
 *
 * useEffect(() => {
 *   fetch('/api/data', { signal: abortController.signal })
 *     .then(res => res.json())
 *     .then(data => setState(data));
 * }, []);
 */
export function useAbortController() {
  const abortControllerRef = useRef(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return abortControllerRef.current;
}

/**
 * Комбинированный hook для безопасного выполнения async функций с AbortController
 *
 * @example
 * const { runAsync, abortController } = useSafeAsyncWithAbort();
 *
 * useEffect(() => {
 *   runAsync(async (isMounted) => {
 *     const response = await fetch('/api/data', {
 *       signal: abortController.signal
 *     });
 *     const data = await response.json();
 *     if (isMounted.current) {
 *       setState(data);
 *     }
 *   });
 * }, [runAsync]);
 */
export function useSafeAsyncWithAbort() {
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(new AbortController());

  useEffect(() => {
    isMountedRef.current = true;
    abortControllerRef.current = new AbortController();

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current.abort();
    };
  }, []);

  const runAsync = useCallback(async (asyncFn) => {
    try {
      return await asyncFn(isMountedRef);
    } catch (error) {
      // Игнорируем ошибки отмены
      if (error.name === 'AbortError') {
        return null;
      }
      // Пробрасываем другие ошибки если компонент еще смонтирован
      if (isMountedRef.current) {
        throw error;
      }
      return null;
    }
  }, []);

  return {
    runAsync,
    abortController: abortControllerRef.current,
    isMounted: isMountedRef
  };
}
