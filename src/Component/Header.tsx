import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Settings, Check } from 'lucide-react'
import Logo from '../assets/images/logo.svg'

export type UnitSelection = {
  Temperature: string
  Precipitation: string
  Wind: string
}

type HeaderProps = {
  unitSystem: 'metric' | 'imperial'
  setUnitSystem: (value: 'metric' | 'imperial') => void
  selectedUnits: UnitSelection
  setSelectedUnits: (value: UnitSelection) => void
}

export default function Header({
  unitSystem,
  setUnitSystem,
  selectedUnits,
  setSelectedUnits,
}: HeaderProps) {
  const [open, setOpen] = useState(false)
  const [switchSelected, setSwitchSelected] = useState<'Metric' | 'Imperial'>(
    unitSystem === 'metric' ? 'Metric' : 'Imperial'
  )
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const options = [
    { heading: 'Temperature', values: ['Celcius (°C)', 'Fahrenheit (°F)'] },
    { heading: 'Wind', values: ['mph', 'km/h'] },
    { heading: 'Precipitation', values: ['Millimeters (mm)', 'Inches(in)'] },
  ]

  const handleSelect = (heading: keyof UnitSelection, value: string) => {
    setSelectedUnits({
      ...selectedUnits,
      [heading]: value,
    })
  }

  const handleSystemSwitch = () => {
    const newSystem = switchSelected === 'Metric' ? 'Imperial' : 'Metric'
    setSwitchSelected(newSystem)
    setUnitSystem(newSystem === 'Metric' ? 'metric' : 'imperial')
  }

  return (
    <header className="flex items-center justify-between my-8 px-6 md:px-35">
      <img src={Logo} alt="Weather logo" className="w-30 md:w-40" />

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-xl p-2 bg-[#25253f] shadow-sm cursor-pointer text-xs font-medium"
        >
          <Settings size={16} />
          <p>Units</p>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </motion.div>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute right-0 rounded-lg shadow-lg bg-[#25253f] mt-2 p-2 text-xs z-50 w-40"
            >
              <div>
                {/* System switch */}
                <div
                  onClick={handleSystemSwitch}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-[#2f2f49] font-medium ${
                    switchSelected === 'Imperial' ? 'bg-[#2f2f49]' : ''
                  }`}
                >
                  <span>
                    Switch to{' '}
                    {switchSelected === 'Metric' ? 'Imperial' : 'Metric'}
                  </span>
                  {switchSelected === 'Imperial' && <Check size={15} />}
                </div>

                {options.map((group, index) => (
                  <div key={index}>
                    <h3 className="text-xs text-gray-500 font-semibold my-1 px-1">
                      {group.heading}
                    </h3>
                    {group.values.map((item) => (
                      <div
                        key={item}
                        onClick={() =>
                          handleSelect(
                            group.heading as keyof UnitSelection,
                            item
                          )
                        }
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-[#2f2f49] font-medium ${
                          selectedUnits[
                            group.heading as keyof UnitSelection
                          ] === item
                            ? 'bg-[#2f2f49]'
                            : ''
                        }`}
                      >
                        <span>{item}</span>
                        {selectedUnits[group.heading as keyof UnitSelection] ===
                          item && <Check size={15} />}
                      </div>
                    ))}
                    {index < options.length - 1 && (
                      <hr className="my-1 border-[#2f2f49]" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
