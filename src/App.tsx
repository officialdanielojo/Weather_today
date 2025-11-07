import { useState } from 'react'
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

  return (
    <>
      <Header
        unitSystem={unitSystem}
        setUnitSystem={setUnitSystem}
        selectedUnits={selectedUnits}
        setSelectedUnits={setSelectedUnits}
      />

      <WeatherCard unit={unitSystem} selectedUnits={selectedUnits} />
    </>
  )
}

export default App
