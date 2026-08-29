import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useCGM } from '../../hooks/useCGM';
import html2pdf from 'html2pdf.js';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDarkMode, analysis, clinicProfile } = useCGM();

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const exportPDF = async () => {
    if (!analysis) { alert('Please calculate metrics first.'); return; }
    const r = analysis;
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    
    // We create a temporary div for PDF generation identical to the old index.html approach
    const pdfDiv = document.createElement('div');

    const { generatePDFTemplate } = await import('../../utils/pdfTemplate');
    pdfDiv.innerHTML = generatePDFTemplate(r, today, clinicProfile);
    
    document.body.appendChild(pdfDiv);
    
    html2pdf().set({
      margin: [8,8],
      filename: 'NayaGlyco_'+r.name.replace(/\s/g,'_')+'_'+new Date().toISOString().slice(0,10)+'.pdf',
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(pdfDiv).save().then(() => document.body.removeChild(pdfDiv));
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <Navbar toggleSidebar={toggleSidebar} exportPDF={exportPDF} />
      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
}
