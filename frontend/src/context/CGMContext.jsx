import React, { createContext, useState, useEffect } from 'react';
import { getSavedReports, saveReportLocal, clearAllReportsLocal, updateReportStatusLocal } from '../services/storageService';

export const CGMContext = createContext();

export const CGMProvider = ({ children }) => {
  const [patient, setPatient] = useState({
    name: '', age: '', gender: '', type: '', hba1c: '', visitDate: ''
  });
  const [cgmData, setCgmData] = useState({
    vh: '', h: '', tir: '', low: '', vl: '', avg: '', gmi: ''
  });
  const [analysis, setAnalysis] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [clinicProfile, setClinicProfile] = useState({
    clinicName: 'NayaGlyco Diabetes Centre',
    physicianName: 'Dr. Ramesh Kumar',
    physicianRole: 'Endocrinologist · MBBS MD',
    regNumber: ''
  });

  useEffect(() => {
    getSavedReports().then(setSavedReports);
  }, []);

  const saveReport = async (report) => {
    const newReport = await saveReportLocal(report);
    setSavedReports(prev => [newReport, ...prev]);
    return newReport;
  };

  const clearReports = async () => {
    await clearAllReportsLocal();
    setSavedReports([]);
  };

  const approveReport = async (reportItem) => {
    // Need firebaseKey instead of id for updating in firebase
    await updateReportStatusLocal(reportItem.firebaseKey, 'Reviewed');
    setSavedReports(savedReports.map(r => r.firebaseKey === reportItem.firebaseKey ? { ...r, status: 'Reviewed' } : r));
    if (analysis) {
      setAnalysis({ ...analysis, status: 'Reviewed' });
    }
  };

  const resetForm = () => {
    setPatient({ name: '', age: '', gender: '', type: '', hba1c: '', visitDate: '' });
    setCgmData({ vh: '', h: '', tir: '', low: '', vl: '', avg: '', gmi: '' });
    setAnalysis(null);
  };

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  return (
    <CGMContext.Provider value={{
      patient, setPatient,
      cgmData, setCgmData,
      analysis, setAnalysis,
      savedReports, saveReport, clearReports, approveReport,
      resetForm,
      isDarkMode, toggleDarkMode,
      clinicProfile, setClinicProfile
    }}>
      {children}
    </CGMContext.Provider>
  );
};
