import { useEffect, useMemo, useRef } from 'react';
import { debounce } from 'lodash';

const useDebouncedCallback = (callback, delay = 300) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useMemo(() => {
    const debounced = debounce((...args) => {
      callbackRef.current?.(...args);
    }, delay);

    return debounced;
  }, [delay]);

  useEffect(() => {
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);

  return debouncedCallback;
};

export default useDebouncedCallback;
