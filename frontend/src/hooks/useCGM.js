import { useContext } from 'react';
import { CGMContext } from '../context/CGMContext';

export function useCGM() {
  const context = useContext(CGMContext);
  if (!context) {
    throw new Error('useCGM must be used within a CGMProvider');
  }
  return context;
}
