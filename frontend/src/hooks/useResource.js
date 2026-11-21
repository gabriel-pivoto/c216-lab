import { useCallback, useEffect, useState } from "react";

export function useResource(loader) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let ignored = false;
    setLoading(true);
    setError(null);
    loader(version)
      .then((result) => {
        if (!ignored) {
          setData(result);
        }
      })
      .catch((failure) => {
        if (!ignored) {
          setError(failure.message);
        }
      })
      .finally(() => {
        if (!ignored) {
          setLoading(false);
        }
      });
    return () => {
      ignored = true;
    };
  }, [loader, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { data, error, loading, reload };
}
