import { useState, useEffect } from 'react';

export const useSyncedLocalStorage = (
  key: string,
  initialValue: string | null = null
): [string | null, (value: string | null) => void] => {
  const [value, setValue] = useState<string | null>(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? storedValue : initialValue;
  });

  useEffect(() => {
    if (value === null) {
      localStorage.removeItem(key); // Remove the key if value is null
    } else {
      localStorage.setItem(key, value); // Store the updated value
    }
  }, [key, value]);

  return [value, setValue];
};

export const useGadmen = (): JSX.Element | null => {
  const [latestImageUrl, setLatestImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestImage = async () => {
      try {
        const response = await fetch(
          'https://images.bergfex.at/ajax/webcamsarchive/?id=11008&date=2024-12-04&size=6'
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: Array<{
          hour: number;
          min: number;
          filetime: number;
          src: string;
          sfiletime: string;
        }> = await response.json();

        if (data.length > 0) {
          const latestImage = data.reduce((latest, current) =>
            current.filetime > latest.filetime ? current : latest
          );
          setLatestImageUrl(latestImage.src);
        }
      } catch (error) {
        console.error('Failed to fetch webcam image:', error);
      }
    };

    fetchLatestImage();
  }, []);

  if (!latestImageUrl) return null;

  return (
    <img src={latestImageUrl} className="w-full object-cover" alt="Gadmen" />
  );
};
