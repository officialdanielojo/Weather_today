import { useState, useEffect, useRef } from 'react'
import Header from './Component/Header'
import type { UnitSelection } from './Component/Header'
import WeatherCard from './Component/WeatherCard'

function App() {
  // const [query, setQuery] = useState('')
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric')
  const [selectedUnits, setSelectedUnits] = useState<UnitSelection>({
    Temperature: '°C',
    Precipitation: 'mm',
    Wind: 'mph',
  })
  const [history, setHistory] = useState<string[]>([])
  // const [showHistory, setShowHistory] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('searchHistory')
    if (stored) setHistory(JSON.parse(stored))
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(history))
  }, [history])
  // const handleSelectHistory = (item: string) => {
  //   setQuery(item)
  //   setShowHistory(false)
  // }

  // const handleClearHistory = () => {
  //   setHistory([])
  //   localStorage.removeItem('searchHistory')
  // }

  return (
    <>
      <Header
        unitSystem={unitSystem}
        setUnitSystem={setUnitSystem}
        selectedUnits={selectedUnits}
        setSelectedUnits={setSelectedUnits}
      />

      <div ref={searchRef} className="relative w-fit my-5">
        {/* <form
            onSubmit={handleSearch}
            className="md:flex items-center gap-2 text-xs"
          >
            <div className="flex items-center p-2 gap-2 cursor-pointer bg-[#25253f] rounded-md w-60">
              <Search size={15} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search for a city, e.g. New York"
                value={query}
                // onFocus={() => setShowHistory(true)}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            <input
              type="Submit"
              value="Search"
              className="bg-[#2c1b9d] cursor-pointer py-2 px-3 rounded-md mt-2 md:mt-0 md:w-fit w-full"
            />
          </form> */}

        {/* Search History Dropdown */}
        {/* {showHistory && history.length > 0 && (
            <div className="absolutebg-[#25253f] mt-2 p-2 rounded-md w-60">
              <div className="flex justify-between items-center pb-1 mb-1 border-b text-xs text-gray-500">
                <span>Recent Searches</span>
                <button
                  onClick={handleClearHistory}
                  className="text-[11px] text-red-500 hover:text-red-600 flex items-center"
                >
                  <X className="w-3 h-3 mr-1" /> Clear
                </button>
              </div>
              {history.map((item, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectHistory(item)}
                  className="p-1 hover:bg-[#2f2f49] cursor-pointer text-xs rounded-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          )} */}
      </div>

      <WeatherCard unit={unitSystem} selectedUnits={selectedUnits} />
    </>
  )
}

export default App
