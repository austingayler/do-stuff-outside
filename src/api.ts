export async function getHutsList() {
    const response = await fetch('https://www.hut-reservation.org/api/v1/manage/hutsList');
    const data = await response.json();
    return data;
}

export async function getHutById(hutId: number) {
    const response = await fetch(`https://www.hut-reservation.org/api/v1/reservation/hutInfo/${hutId}`);
    const data = await response.json();
    return data;
}

export async function getHutAvailability(hutId: number) {
    const response = await fetch(`https://www.hut-reservation.org/api/v1/reservation/getHutAvailability?hutId=${hutId}`);
    const data = await response.json();
    return data;
}

// Probably don't need this one
// https://www.hut-reservation.org/api/v1/reservation/hutStatus/214
// {"arrivalDate":"27.02.2025","departureDate":"28.02.2025"}
export const getHutReservationStatus = async (hutId: number, arrivalDate: string, departureDate: string) => {
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(arrivalDate) || !/^\d{2}\.\d{2}\.\d{4}$/.test(departureDate)) {
        throw new Error('Invalid date format');
    }

    const response = await fetch(`https://www.hut-reservation.org/api/v1/reservation/hutStatus/${hutId}`, {
        method: 'POST',
        body: JSON.stringify({ arrivalDate, departureDate }),
    });
    const data = await response.json();
    return data;
}

// Jungfraujoch coordinates (3,466m elevation)
const JUNGFRAUJOCH_LAT = 46.5475;
const JUNGFRAUJOCH_LON = 7.9854;
const JUNGFRAUJOCH_ELEVATION = 3466;

export interface JungfraujochForecastHour {
    time: string;
    windSpeed: number; // km/h
    windDirection: number; // degrees
    windGusts: number; // km/h
}

export interface JungfraujochForecastDay {
    date: string;
    hours: JungfraujochForecastHour[];
}

export interface JungfraujochForecastResponse {
    latitude: number;
    longitude: number;
    elevation: number;
    days: JungfraujochForecastDay[];
}

/**
 * Fetches 5-day weather forecast for Jungfraujoch using Open-Meteo API with MeteoSwiss ICON CH2 model.
 * Returns hourly wind speed, direction, and gusts data.
 */
export async function getJungfraujochForecast(): Promise<JungfraujochForecastResponse> {
    const params = new URLSearchParams({
        latitude: JUNGFRAUJOCH_LAT.toString(),
        longitude: JUNGFRAUJOCH_LON.toString(),
        elevation: JUNGFRAUJOCH_ELEVATION.toString(),
        hourly: 'wind_speed_10m,wind_direction_10m,wind_gusts_10m',
        models: 'meteoswiss_icon_ch2',
        forecast_days: '5',
        timezone: 'Europe/Zurich',
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch Jungfraujoch forecast: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Group hourly data by day
    const dayMap = new Map<string, JungfraujochForecastHour[]>();
    
    for (let i = 0; i < data.hourly.time.length; i++) {
        const time = data.hourly.time[i];
        const date = time.split('T')[0];
        
        let dayHours = dayMap.get(date);
        if (!dayHours) {
            dayHours = [];
            dayMap.set(date, dayHours);
        }
        
        dayHours.push({
            time,
            windSpeed: data.hourly.wind_speed_10m[i],
            windDirection: data.hourly.wind_direction_10m[i],
            windGusts: data.hourly.wind_gusts_10m[i],
        });
    }
    
    const days: JungfraujochForecastDay[] = Array.from(dayMap.entries()).map(([date, hours]) => ({
        date,
        hours,
    }));
    
    return {
        latitude: data.latitude,
        longitude: data.longitude,
        elevation: data.elevation,
        days,
    };
}