import React, { createContext, useContext, useState, ReactNode } from 'react';

interface YearContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: number | null; // null means "All Months"
  setSelectedMonth: (month: number | null) => void;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export const YearProvider = ({ children }: { children: ReactNode }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear, selectedMonth, setSelectedMonth }}>
      {children}
    </YearContext.Provider>
  );
};

export const useYear = () => {
  const context = useContext(YearContext);
  if (context === undefined) {
    throw new Error('useYear must be used within a YearProvider');
  }
  return context;
};
