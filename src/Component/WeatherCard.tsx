import { useEffect, useRef, useState } from 'react'
import { weatherImages } from '../utils/weatherImages'
import { Ban, ChevronDown, ChevronUp, RefreshCcw, Search } from 'lucide-react'
import mobileBg from '../assets/images/bg-today-small.svg'
import desktopBg from '../assets/images/bg-today-large.svg'
import { motion, AnimatePresence } from 'framer-motion'
import type { UnitSelection } from './Header'

type WeatherDisplayProps = {
  unit: 'metric' | 'imperial'
  selectedUnits: UnitSelection
}

type WeatherData = {
  name: string
  main: {
    temp: number
    feels_like: number
    humidity: number
  }
  rain?: {
    '1h'?: number
    '3h'?: number
  }
  snow?: {
    '1h'?: number
    '3h'?: number
  }
  weather: { main: string; description: string }[]
  wind: { speed: number }
}

type ForecastDay = {
  day: string
  temp_max: number
  temp_min: number
  condition: string
  icon: string
}

type ForecastItem = {
  dt_txt: string
  main: {
    temp: number
  }
  weather: {
    main: string
  }[]
}

type HourlyForecast = {
  time: string
  hour: number
  temp: number
  icon: string
  day: string
}

export default function WeatherDisplay({
  unit,
  selectedUnits,
}: WeatherDisplayProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [dailyForecast, setDailyForecast] = useState<ForecastDay[]>([])
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([])
  const [filteredHourly, setFilteredHourly] = useState<HourlyForecast[]>([])
  const [selectedDay, setSelectedDay] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState<string>('')
  const [city, setCity] = useState<string>('Berlin, Germany')
  const [error, setError] = useState('')
  const [serverError, setServerError] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [bgImage, setBgImage] = useState<string>('')
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Detect screen size and set correct background
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setBgImage(mobileBg)
      else setBgImage(desktopBg)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Format current time
  function formatDateTime() {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      // hour: 'numeric',
      // minute: '2-digit',
      // hour12: true,
    }
    return now.toLocaleString('en-US', options)
  }

  useEffect(() => {
    setCurrentTime(formatDateTime())
    const interval = setInterval(() => setCurrentTime(formatDateTime()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Fetch Weather
  async function fetchWeather(cityName: string) {
    try {
      setLoading(true)
      setError('')
      setServerError(false)

      const apiKey = import.meta.env.VITE_WEATHER_API_KEY
      if (!navigator.onLine) throw new Error('Network unavailable')
      if (!apiKey) throw new Error('Missing API key')

      // Fetch current weather
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          cityName
        )}&units=${unit}&appid=${apiKey}`
      )
      if (!res.ok) throw new Error('No search result found!')
      const data = await res.json()

      setWeather(data)
      setCity(cityName)

      // Fetch forecast
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
          cityName
        )}&units=${unit}&appid=${apiKey}`
      )
      if (!forecastRes.ok) throw new Error('Forecast not available')
      const forecastData: { list: ForecastItem[] } = await forecastRes.json()

      // Group forecast by full weekday name
      const grouped: Record<string, ForecastItem[]> = {}
      forecastData.list.forEach((item) => {
        const dateKey = new Date(item.dt_txt).toISOString().split('T')[0] // YYYY-MM-DD

        if (!grouped[dateKey]) grouped[dateKey] = []
        grouped[dateKey].push(item)
      })

      // Daily summary
      const days = Object.keys(grouped)
        .sort() // ensures chronological order
        .map((dateStr) => {
          const entries = grouped[dateStr]
          const temps = entries.map((e) => e.main.temp)
          const cond = entries[0].weather?.[0]?.main?.toLowerCase() ?? 'clouds'
          const dayLabel = new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long',
          })

          return {
            day: dayLabel,
            temp_max: Math.max(...temps),
            temp_min: Math.min(...temps),
            condition: cond,
            icon: weatherImages[cond] || weatherImages['cloudy'],
          } as ForecastDay
        })

      setDailyForecast(days.slice(0, 7))

      // Create hourly forecast for 24 hours
      const hourlyRaw: HourlyForecast[] = forecastData.list.map((i) => {
        const date = new Date(i.dt_txt)
        return {
          time: date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true,
          }),
          hour: date.getHours(),
          temp: Math.round(i.main.temp),
          icon:
            weatherImages[i.weather[0].main.toLowerCase()] ||
            weatherImages['cloudy'],
          day: date.toLocaleDateString('en-US', { weekday: 'long' }),
        }
      })

      const groupedByDay = hourlyRaw.reduce<Record<string, HourlyForecast[]>>(
        (acc, entry) => {
          if (!acc[entry.day]) acc[entry.day] = []
          acc[entry.day].push(entry)
          return acc
        },
        {}
      )

      // Fill missing hours to make 24-hour data
      Object.keys(groupedByDay).forEach((day) => {
        const dayEntries = groupedByDay[day].sort((a, b) => a.hour - b.hour)
        const filled: HourlyForecast[] = []
        for (let hour = 0; hour < 24; hour++) {
          const existing = dayEntries.find((e) => e.hour === hour)
          if (existing) {
            filled.push(existing)
          } else {
            const before = dayEntries.filter((e) => e.hour < hour).pop()
            const after = dayEntries.find((e) => e.hour > hour)
            const temp =
              before && after
                ? Math.round((before.temp + after.temp) / 2)
                : before
                ? before.temp
                : after
                ? after.temp
                : 0
            filled.push({
              time: new Date(2024, 0, 1, hour).toLocaleTimeString('en-US', {
                hour: 'numeric',
                hour12: true,
              }),
              hour,
              temp,
              day,
              icon: before?.icon || after?.icon || weatherImages['cloudy'],
            })
          }
        }
        groupedByDay[day] = filled
      })

      const hourly = Object.values(groupedByDay).flat()
      setHourlyForecast(hourly)

      const firstDay = Object.keys(groupedByDay)[0]
      if (firstDay) {
        setSelectedDay(firstDay)
        setFilteredHourly(groupedByDay[firstDay])
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'Network unavailable') {
          setServerError(true)
          setError('Something went wrong')
        } else {
          setError(err.message)
        }
      }
      setWeather(null)
      setDailyForecast([])
      setHourlyForecast([])
      setFilteredHourly([])
    } finally {
      setLoading(false)
    }
  }

  // Filter hourly by selected day
  useEffect(() => {
    if (!selectedDay || hourlyForecast.length === 0) return
    const filtered = hourlyForecast.filter((h) => h.day === selectedDay)
    setFilteredHourly(filtered)
  }, [selectedDay, hourlyForecast])

  // Handle outside click for dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch initial weather & refetch on unit change
  useEffect(() => {
    fetchWeather(city)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit])

  const pre =
    weather?.rain?.['1h'] ??
    weather?.rain?.['3h'] ??
    weather?.snow?.['1h'] ??
    weather?.snow?.['3h'] ??
    0

  const tempCards = [
    { label: 'Feels Like', value: weather?.main.feels_like ?? '--' },
    { label: 'Humidity', value: weather?.main.humidity ?? '--' },
    { label: 'Wind Speed', value: weather?.wind.speed ?? '--' },
    { label: 'Precipitation', value: pre ?? '--' },
  ]

  const tempUnit =
    selectedUnits.Temperature.slice(12, 14) ||
    (selectedUnits.Temperature === 'metric' ? '°F' : '°C')
  const speedUnit =
    selectedUnits.Wind ||
    (selectedUnits.Temperature === 'metric' ? 'km/h' : 'mph')
  const preUnit =
    selectedUnits.Precipitation.slice(13, 15) ||
    (selectedUnits.Temperature === 'metric' ? 'mm' : 'in')

  return (
    <>
      {serverError ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Ban size={20} className="text-gray-400" />
          <p className="text-2xl text-white my-3 font-semibold">{error}</p>
          <p className="w-60 text-xs text-center text-gray-400">
            We couldn’t connect to the server. Please try again in a few
            moments.
          </p>
          <button
            className="flex gap-2 items-center p-2 my-3 bg-[#2f2f49] text-xs rounded-md font-medium cursor-pointer"
            onClick={() => fetchWeather(city)}
          >
            <RefreshCcw size={15} />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        <main className="text-white">
          {/* Search Section */}
          <section className="Search mx-6 flex flex-col items-center justify-center">
            <h1 className="font-bold text-2xl mb-2 how_work md:text-4xl">
              How's the sky looking today?
            </h1>
            <div className="relative w-full my-5 md:flex items-center justify-center md:gap-5 ">
              <div className="md:flex items-center gap-2 text-sm">
                <div className="flex items-center px-2 py-3 gap-2 bg-[#25253f] rounded-md w-full md:w-100">
                  <Search size={16} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for a place..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full placeholder:text-gray-400 focus:outline-none text-white bg-transparent"
                  />
                </div>
                <button
                  onClick={() => fetchWeather(inputValue)}
                  className="bg-[#2c1b9d] p-3 rounded-md mt-2 md:mt-0 md:w-fit w-full font-semibold hover:bg-[#3d2ae0] cursor-pointer"
                >
                  Search
                </button>
              </div>
            </div>
          </section>

          <div className=" md:flex justify-center md:mb-8">
            <div>
              {/* Weather Display */}
              <section className="mx-6">
                {loading ? (
                  <div className="relative rounded-2xl animate-pulse flex flex-col items-center justify-center h-[300px] md:h-[300px] md:w-[900px] bg-[#2f2f49]">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    </div>
                    <p className="text-gray-400 mt-4 font-medium">Loading...</p>
                  </div>
                ) : error ? (
                  <p className="text-center text-white mt-3 font-semibold">
                    {error}
                  </p>
                ) : (
                  weather && (
                    <div
                      className="relative bg-cover bg-center rounded-2xl transition-all duration-700 flex flex-col items-center justify-center"
                      style={{ backgroundImage: `url(${bgImage})` }}
                    >
                      <div className="z-10 w-full px-3 py-20 rounded-2xl text-center md:flex items-center justify-between px-15 md:px-20">
                        <div className="flex flex-col justify-center md:items-start items-center">
                          <h3 className="font-bold text-3xl pb-3 capitalize w-fit">
                            {city}
                          </h3>
                          <p className="text-gray-300 w-fit">{currentTime}</p>
                        </div>

                        <div className="flex justify-center gap-7 items-center sm:gap-70 md:gap-10 mt-6">
                          <img
                            src={
                              weatherImages[
                                weather.weather?.[0]?.main?.toLowerCase() ||
                                  'cloudy'
                              ]
                            }
                            alt={weather.weather[0].main}
                            className="w-25 h-25 object-contain mb-2"
                          />
                          <p className="text-7xl font-bold italic ">
                            {Math.round(weather.main.temp)}°
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </section>

              {/* Weather Conditions */}
              <section className="mt-6 mx-6">
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 animate-pulse">
                    {[
                      'Feels Like',
                      'Humidity',
                      'Wind Speed',
                      'Temperature',
                    ].map((value, i) => (
                      <div
                        key={i}
                        className="bg-[#2f2f49] rounded-xl h-[100px] p-4 space-y-5"
                      >
                        <p className="text-sm text-gray-400 font-semibold">
                          {value}
                        </p>
                        <p>____</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {tempCards.map((card, i) => (
                      <div
                        key={i}
                        className="bg-[#2f2f49] rounded-xl h-[100px] p-4 space-y-5"
                      >
                        <p className="text-sm text-gray-400 font-semibold">
                          {card.label}
                        </p>
                        <div className="flex items-center text-2xl font-semibold">
                          {card.label === 'Wind Speed' ? (
                            <p>{`${card.value} ${speedUnit}`}</p>
                          ) : card.label === 'Humidity' ? (
                            <p>{card.value}%</p>
                          ) : card.label === 'Precipitation' ? (
                            <p>{`${card.value} ${preUnit}`}</p>
                          ) : (
                            <p>
                              {Math.round(Number(card.value))}
                              {tempUnit}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Daily Forecast */}
              <section className="mt-6 mx-6">
                <h2 className="font-semibold text-lg mb-3">Daily forecast</h2>
                {loading ? (
                  <div className="grid grid-cols-3 md:grid-cols-7 gap-3 animate-pulse">
                    {Array(7)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="bg-[#2f2f49] rounded-xl h-[100px]"
                        ></div>
                      ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-7 gap-5">
                    {dailyForecast.map((day) => (
                      <div
                        key={day.day}
                        className="bg-[#2f2f49] rounded-xl p-4 flex flex-col items-center justify-center space-y-3"
                      >
                        <p className="font-semibold text-sm">{day.day}</p>
                        <img
                          src={day.icon}
                          alt={day.condition}
                          className="w-12 h-12"
                        />
                        <p className="text-xs flex items-center justify-between w-full">
                          <span> {Math.round(day.temp_max)}° </span>
                          <span> {Math.round(day.temp_min)}°</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/*Hourly Forecast Section */}
            <section className="md:mt-0 mt-6 md:mx-0 mx-6 md:mb-0 mb-10 bg-[#252540] rounded-xl px-3 py-4">
              <div className="flex items-center justify-between gap-4 mb-3">
                <h2 className="font-semibold text-xl">Hourly Forecast</h2>
                <div className="relative">
                  <button
                    onClick={() => setOpen(!open)}
                    className="flex items-center gap-3 rounded-lg md:p-2 py-3 px-5 bg-[#2f2f49] shadow-sm cursor-pointer text-sm font-semibold"
                  >
                    <p>{selectedDay || 'Select Day'}</p>
                    {open ? (
                      <motion.div
                        animate={{ rotate: 180 }}
                        transition={{ duration: 0.25 }}
                      >
                        <ChevronUp size={20} />
                      </motion.div>
                    ) : (
                      <motion.div
                        animate={{ rotate: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <ChevronDown size={20} />
                      </motion.div>
                    )}
                  </button>

                  <AnimatePresence>
                    {open && (
                      <motion.div
                        key="dropdown"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="absolute right-0 rounded-lg shadow-lg bg-[#25253f] mt-2 p-2 text-xs z-50"
                      >
                        {Array.from(
                          new Set(hourlyForecast.map((h) => h.day))
                        ).map((day) => (
                          <div
                            key={day}
                            onClick={() => {
                              setSelectedDay(day)
                              setOpen(false)
                            }}
                            className={`px-3 py-2 rounded-md cursor-pointer transition ${
                              selectedDay === day
                                ? 'bg-[#2c1b9d] text-white'
                                : 'hover:bg-[#3c3c63]'
                            }`}
                          >
                            {day}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Skeleton Loader */}
              {loading ? (
                <div className="flex flex-col gap-3 h-[400px] overflow-y-auto custom-scrollbar pr-3">
                  {Array(10)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="bg-gray-700/40 rounded-xl h-[70px] w-full animate-pulse"
                      ></div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[400px] md:max-h-[540px] overflow-y-auto custom-scrollbar pr-3">
                  {filteredHourly.map((hour, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="bg-[#2f2f49] rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={hour.icon}
                          alt={hour.day}
                          className="w-8 h-8 object-contain"
                        />
                        <p className="text-sm font-semibold">{hour.time}</p>
                      </div>
                      <p className="text-base font-bold">{hour.temp}°</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      )}
    </>
  )
}
