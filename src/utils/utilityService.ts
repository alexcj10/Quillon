/**
 * Utility Service for Quillon
 * Handles Weather, Currency, and Unit conversions.
 */

const WMO_CODES: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Drizzle: Light',
    53: 'Drizzle: Moderate',
    55: 'Drizzle: Dense',
    56: 'Freezing Drizzle: Light',
    57: 'Freezing Drizzle: Dense',
    61: 'Rain: Slight',
    63: 'Rain: Moderate',
    65: 'Rain: Heavy',
    66: 'Freezing Rain: Light',
    67: 'Freezing Rain: Heavy',
    71: 'Snow fall: Slight',
    73: 'Snow fall: Moderate',
    75: 'Snow fall: Heavy',
    77: 'Snow grains',
    80: 'Rain showers: Slight',
    81: 'Rain showers: Moderate',
    82: 'Rain showers: Violent',
    85: 'Snow showers: Slight',
    86: 'Snow showers: Heavy',
    95: 'Thunderstorm: Slight or moderate',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
};

/**
 * Fetches current weather for a city using Open-Meteo (High Accuracy)
 */
export async function fetchWeather(city: string): Promise<string> {
    try {
        // Step 1: Geocoding - Convert city name to coordinates
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        if (!geoResponse.ok) throw new Error('Geocoding failed');
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            return `Weather Error: Could not find city "${city}".`;
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // Step 2: Fetch Weather using Coordinates
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        if (!weatherResponse.ok) throw new Error('Weather fetch failed');
        const weatherData = await weatherResponse.json();

        if (weatherData.current_weather) {
            const { temperature, weathercode, windspeed } = weatherData.current_weather;
            const condition = WMO_CODES[weathercode] || 'Unknown';
            return `Weather for ${name}, ${country}: ${temperature}°C, ${condition} (Wind: ${windspeed} km/h)`;
        }

        return `Weather (${city}): Data unavailable.`;
    } catch (error) {
        console.error('Weather error:', error);
        // Fallback to wttr.in if Open-Meteo fails for some reason
        try {
            const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=3`);
            if (response.ok) {
                const text = await response.text();
                return `Weather (${city}): ${text.trim()} (Fallback)`;
            }
        } catch (f) {
            console.error('Fallback weather error:', f);
        }
        return `Weather (${city}): Service unavailable.`;
    }
}

/**
 * Fetches currency exchange rates and converts amount
 */
export async function fetchCurrencyExchange(amount: number, from: string, to: string): Promise<string> {
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${from.toUpperCase()}`);
        if (!response.ok) throw new Error('Currency fetch failed');
        const data = await response.json();

        if (data.result === 'success' && data.rates[to.toUpperCase()]) {
            const rate = data.rates[to.toUpperCase()];
            const converted = (amount * rate).toFixed(2);
            return `${amount} ${from.toUpperCase()} = ${converted} ${to.toUpperCase()}`;
        }
        return `Currency Error: Conversion from ${from} to ${to} not found.`;
    } catch (error) {
        console.error('Currency error:', error);
        return `Currency Error: Could not fetch data.`;
    }
}

/**
 * Basic unit conversion logic
 */
const CONVERSIONS: Record<string, number> = {
    // Length
    'km_miles': 0.621371,
    'miles_km': 1.60934,
    'm_ft': 3.28084,
    'ft_m': 0.3048,
    'cm_inch': 0.393701,
    'inch_cm': 2.54,
    // Weight / Mass
    'kg_lb': 2.20462,
    'lb_kg': 0.453592,
    'kg_lbs': 2.20462,
    'lbs_kg': 0.453592,
    'kgs_lbs': 2.20462,
    'g_oz': 0.035274,
    'oz_g': 28.3495,
    // Temperature (special case)
    'c_f': 0, // Formula based
    'f_c': 0, // Formula based
};

export function convertUnits(value: number, from: string, to: string): string {
    const f = from.toLowerCase();
    const t = to.toLowerCase();

    if (f === 'c' && t === 'f') {
        return `${value}°C = ${((value * 9 / 5) + 32).toFixed(2)}°F`;
    }
    if (f === 'f' && t === 'c') {
        return `${value}°F = ${((value - 32) * 5 / 9).toFixed(2)}°C`;
    }

    const key = `${f}_${t}`;
    if (CONVERSIONS[key]) {
        const result = (value * CONVERSIONS[key]).toFixed(2);
        return `${value} ${from} = ${result} ${to}`;
    }

    return `Unit Error: Conversion from ${from} to ${to} not supported.`;
}

/**
 * Detect utility commands
 */
export function parseUtilityCommand(input: string):
    | { type: 'weather', city: string }
    | { type: 'currency', amount: number, from: string, to: string }
    | { type: 'unit', value: number, from: string, to: string }
    | null {
    const term = input.trim();

    // Weather: @w-city
    if (term.toLowerCase().startsWith('@w-')) {
        const city = term.slice(3).trim();
        return city ? { type: 'weather', city } : null;
    }

    // Currency: @cc-100usd to eur
    if (term.toLowerCase().startsWith('@cc-')) {
        const match = term.slice(4).match(/^([\d.]+)\s*([a-zA-Z]{3})\s+to\s+([a-zA-Z]{3})$/i);
        if (match) {
            return {
                type: 'currency',
                amount: parseFloat(match[1]),
                from: match[2],
                to: match[3]
            };
        }
    }

    // Unit: @u-5km to miles
    if (term.toLowerCase().startsWith('@u-')) {
        const match = term.slice(3).match(/^([\d.]+)\s*([a-zA-Z]+)\s+to\s+([a-zA-Z]+)$/i);
        if (match) {
            return {
                type: 'unit',
                value: parseFloat(match[1]),
                from: match[2],
                to: match[3]
            };
        }
    }

    return null;
}

/**
 * Parses Pomodoro time strings like "1h 30m 10s", "5m", "30s", etc.
 * Returns total seconds.
 */
export function parsePomoTime(input: string): number {
    if (!input) return 25 * 60; // Default 25m

    const timeRegex = /(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/i;
    const match = input.match(timeRegex);

    if (!match || (!match[1] && !match[2] && !match[3])) {
        return 25 * 60; // Fallback to 25m if no valid time components found
    }

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return (hours * 3600) + (minutes * 60) + seconds;
}
