import { useState, useEffect } from "react";

// Types for API data
interface WeatherData {
  current: {
    temp_c: number;
    humidity: number;
    condition: { text: string; icon: string };
  };
}

interface NewsData {
  title: string;
  url: string;
  source: { name: string };
}

interface EventData {
  id: string;
  name: { text: string };
  url: string;
  dates: { start: { localDate: string; localTime: string } };
}

export default function LocalLivingDashboard() {
  const [input, setInput] = useState("Taguig, Metro Manila");
  const [city, setCity] = useState("Taguig");
  const [province, setProvince] = useState("Metro Manila");
  const [country, setCountry] = useState("Philippines");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [news, setNews] = useState<NewsData[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);

  // --- Fetch coordinates from WeatherAPI ---
  async function fetchCoordinates(query: string) {
    try {
      const res = await fetch(
        `https://api.weatherapi.com/v1/search.json?key=${import.meta.env.VITE_WEATHER_KEY}&q=${query}`
      );
      const data = await res.json();
      if (!data || data.length === 0) return null;

      // Prefer Metro Manila if searching within PH
      let loc = data[0];
      for (let item of data) {
        if (item.region === "Metro Manila") {
          loc = item;
          break;
        }
      }

      return {
        city: loc.name,
        province: loc.region,
        country: loc.country,
        lat: loc.lat,
        lon: loc.lon,
      };
    } catch (err) {
      console.error("Failed to fetch coordinates:", err);
      return null;
    }
  }

  // --- Fetch weather by lat/lon ---
  useEffect(() => {
    if (lat && lon) {
      async function fetchWeather() {
        try {
          const res = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${import.meta.env.VITE_WEATHER_KEY}&q=${lat},${lon}&aqi=no`
          );
          const data = await res.json();
          setWeather(data);
        } catch (err) {
          console.error("Failed to fetch weather:", err);
          setWeather(null);
        }
      }
      fetchWeather();
    }
  }, [lat, lon]);

  // --- Fetch news ---
  useEffect(() => {
    if (city && country) {
      async function fetchNews() {
        try {
          const query = `${city}, ${province}, ${country}`;
          const res = await fetch(
            `https://newsapi.org/v2/everything?q=${encodeURIComponent(
              query
            )}&sortBy=publishedAt&pageSize=5&apiKey=${import.meta.env.VITE_NEWS_KEY}`
          );
          const data = await res.json();
          setNews(data.articles || []);
        } catch (err) {
          console.error("Failed to fetch news:", err);
          setNews([]);
        }
      }
      fetchNews();
    }
  }, [city, province, country]);

  // --- Fetch events ---
  useEffect(() => {
    if (city && country) {
      async function fetchEvents() {
        try {
          const countryCode = country === "Philippines" ? "PH" : "";
          const res = await fetch(
            `https://app.ticketmaster.com/discovery/v2/events.json?city=${encodeURIComponent(
              city
            )}&countryCode=${countryCode}&size=5&apikey=${import.meta.env.VITE_TICKETMASTER_KEY}`
          );
          const data = await res.json();
          setEvents(data._embedded?.events || []);
        } catch (err) {
          console.error("Failed to fetch events:", err);
          setEvents([]);
        }
      }
      fetchEvents();
    }
  }, [city, country]);

  // --- Handle search ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const loc = await fetchCoordinates(input);
    if (loc) {
      setCity(loc.city);
      setProvince(loc.province);
      setCountry(loc.country);
      setLat(loc.lat);
      setLon(loc.lon);
    } else {
      alert("Location not found");
    }
  };

  return (
    // Full-screen gradient background
    <div className="min-h-screen bg-gradient-to-b from-purple-300 via-purple-400 to-purple-700 flex flex-col items-center p-6 font-sans">
      
      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 text-center">
        Local Living Dashboard
      </h1>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex w-full max-w-2xl mb-10 gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Taguig, Metro Manila"
          className="flex-1 p-3 rounded-full bg-purple-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-400 transition"
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-full bg-purple-700 text-white font-semibold hover:bg-purple-800 shadow-md transition"
        >
          Search
        </button>
      </form>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">

        {/* Weather Card */}
        <div className="bg-gradient-to-b from-purple-800 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:scale-105 transform transition">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🌻 Weather in {city}, {province}, {country}
          </h2>
          {weather?.current ? (
            <>
              <p className="text-5xl font-bold mb-2">{weather.current.temp_c}°C</p>
              <p className="mb-1">{weather.current.condition.text}</p>
              <p>Humidity: {weather.current.humidity}%</p>
              <img src={weather.current.condition.icon} alt="weather icon" className="mt-4" />
            </>
          ) : (
            <p>Loading weather...</p>
          )}
        </div>

        {/* Events Card */}
        <div className="bg-gradient-to-b from-purple-800 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:scale-105 transform transition">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🎉 Events in {city}, {province}, {country}
          </h2>
          {events.length > 0 ? (
            <ul className="space-y-2">
              {events.map((e) => (
                <li key={e.id}>
                  <a href={e.url} target="_blank" rel="noreferrer" className="hover:underline">
                    {e.name.text}
                  </a>
                  <p className="text-sm">{e.dates.start.localDate} {e.dates.start.localTime}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No events found in {city}</p>
          )}
        </div>

        {/* News Card */}
        <div className="bg-gradient-to-b from-purple-800 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:scale-105 transform transition">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📰 News in {city}, {province}, {country}
          </h2>
          {news.length > 0 ? (
            <ul className="space-y-2">
              {news.map((n, i) => (
                <li key={i}>
                  <a href={n.url} target="_blank" rel="noreferrer" className="hover:underline">
                    {n.title}
                  </a>
                  <p className="text-sm">{n.source.name}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No news available for {city}</p>
          )}
        </div>
      </div>
    </div>
  );
}
