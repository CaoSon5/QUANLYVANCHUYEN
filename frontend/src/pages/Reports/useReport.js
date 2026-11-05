// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Reports\
import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../api/authApi';

// Tải dữ liệu báo cáo mỗi khi `deps` đổi. Trả về { data, loading, error, reload }.
export default function useReport(fetcher, deps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetcher()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}
