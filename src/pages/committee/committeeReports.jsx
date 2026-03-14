// src/components/committee/CommitteeReports.jsx
import React, { useState, useEffect } from 'react';
import "../../styles/council/reports.css";

// Importar servicios
import {
  downloadGlobalModalitiesPDF,
  downloadFilteredModalitiesPDF,
  downloadModalityComparisonPDF,
  downloadModalityHistoricalPDF,
  downloadCompletedModalitiesPDF,
  downloadDefenseCalendarPDF,
  downloadStudentListingPDF,
  downloadDirectorPerformancePDF,
  downloadModalityTraceabilityByModalityPDF,
  downloadModalityTraceabilityByStudentPDF,
  downloadIndividualDirectorPDF,
  getAvailableModalityTypes,
  getDirectors,
  getStudentsByAcademicProgram,
  testConnection,
  PROCESS_STATUSES,
  RESULT_TYPES,
  DISTINCTION_TYPES,
  TIMELINE_STATUSES,
  MODALITY_TYPE_FILTERS,
  SORT_OPTIONS,
  getCurrentPeriod
} from '../../services/reportsService';

const CommitteeReports = () => {
  // ========================================
  // ESTADOS
  // ========================================
  const [openFilterDialog, setOpenFilterDialog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeMessageCard, setActiveMessageCard] = useState(null);
  const [modalityTypes, setModalityTypes] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  // Estados de filtros para cada reporte
  const [filters, setFilters] = useState({
    filtered: {
      degreeModalityIds: [],
      processStatuses: [],
      startDate: '',
      endDate: '',
      includeWithoutDirector: false,
      onlyWithDirector: false
    },
    comparison: {
      year: getCurrentPeriod().year,
      semester: getCurrentPeriod().semester,
      includeHistoricalComparison: true,
      historicalPeriodsCount: 4,
      includeTrendsAnalysis: true,
      onlyActiveModalities: false
    },
    historical: {
      modalityTypeId: null,
      periods: 8
    },
    completed: {
      modalityTypes: [],
      results: [],
      year: null,
      semester: null,
      startDate: '',
      endDate: '',
      onlyWithDistinction: false,
      distinctionType: '',
      directorId: null,
      minGrade: null,
      maxGrade: null,
      modalityTypeFilter: '',
      sortBy: 'DATE',
      sortDirection: 'DESC'
    },
    calendar: {
      startDate: '',
      endDate: '',
      includeCompleted: false
    },
    studentListing: {
      statuses: [],
      modalityTypes: [],
      year: null,
      timelineStatus: '',
      modalityTypeFilter: '',
      hasDirector: null,
      sortBy: 'NAME',
      sortDirection: 'ASC',
      includeInactive: false
    },
    directors: {
      directorId: null,
      processStatuses: [],
      modalityTypes: [],
      onlyOverloaded: false,
      onlyAvailable: false,
      onlyActiveModalities: true,
      includeWorkloadAnalysis: true
    },
    individualDirector: {
      directorId: null,
      includeWorkloadAnalysis: true
    },
    studentTraceability: {
      studentName: '',
      selectedStudentId: null,
      selectedStudentModalityId: null,
      selectedStudentLabel: ''
    }
  });

  // ========================================
  // EFECTOS
  // ========================================

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setGlobalLoading(true);
        
        // Verificar conexión
        const connected = await testConnection();
        setConnectionStatus(connected ? 'connected' : 'error');

        // Cargar tipos de modalidad
        try {
          const types = await getAvailableModalityTypes();
          setModalityTypes(types);
        } catch (err) {
          console.error('Error cargando tipos de modalidad:', err);
        }

        // Cargar directores
        try {
          const directorsList = await getDirectors();
          setDirectors(directorsList);
        } catch (err) {
          console.error('Error cargando directores:', err);
        }
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
        setConnectionStatus('error');
      } finally {
        setGlobalLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // ========================================
  // HANDLERS DE DESCARGA
  // ========================================

  const handleDownloadGlobal = async () => {
    setActiveMessageCard('global');
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Simula un pequeño delay para mejor UX visual
      await new Promise(res => setTimeout(res, 350));
      const result = await downloadGlobalModalitiesPDF();
      setSuccess(
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 0',
          fontSize: '1em',
          color: '#205c2c',
          gap: 7,
          fontWeight: 400,
          margin: '4px 0 0 0',
          background: 'none',
          border: 'none',
          boxShadow: 'none',
          borderRadius: 0
        }}>
          <span style={{fontSize: '0.92em', color: '#388e3c', marginRight: 4, lineHeight: 1, flexShrink: 0}}>OK</span>
          <span style={{lineHeight: 1.2}}>
            Reporte global <span style={{color: '#7A1117'}}>{result.filename}</span> descargado exitosamente
          </span>
        </span>
      );
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 0',
          fontSize: '1em',
          color: '#7A1117',
          gap: 7,
          fontWeight: 400,
          margin: '4px 0 0 0',
          background: 'none',
          border: 'none',
          boxShadow: 'none',
          borderRadius: 0
        }}>
          <span style={{fontSize: '0.92em', color: '#b71c1c', marginRight: 4, lineHeight: 1, flexShrink: 0}}>X</span>
          <span style={{lineHeight: 1.2}}>
            No se pudo descargar el reporte global.
            <span style={{display: 'inline', color: '#b71c1c', fontWeight: 400, fontSize: '0.97em', marginLeft: 4}}>{err.message || 'Error desconocido.'}</span>
          </span>
        </span>
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFiltered = async () => {
    setActiveMessageCard('filtered');
    setLoading(true);
    setError(null);
    try {
      // Usar directamente los IDs seleccionados
      const payload = {
        ...filters.filtered,
        degreeModalityIds: Array.isArray(filters.filtered.degreeModalityIds) ? filters.filtered.degreeModalityIds : []
      };
      const result = await downloadFilteredModalitiesPDF(payload);
      setSuccess(`${result.filename} descargado exitosamente`);
      setTimeout(() => setSuccess(null), 5000);
      setOpenFilterDialog(null);
    } catch (err) {
      setError(err.message || 'Error al descargar el reporte filtrado');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadComparison = async () => {
    setActiveMessageCard('comparison');
    setLoading(true);
    setError(null);
    try {
      const result = await downloadModalityComparisonPDF(filters.comparison);
      setSuccess(`${result.filename} descargado exitosamente`);
      setTimeout(() => setSuccess(null), 5000);
      setOpenFilterDialog(null);
    } catch (err) {
      setError(err.message || 'Error al descargar el reporte comparativo');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadHistorical = async () => {
    setActiveMessageCard('historical');
    if (!filters.historical.modalityTypeId) {
      setError('Debe seleccionar un tipo de modalidad');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await downloadModalityHistoricalPDF(
        filters.historical.modalityTypeId,
        filters.historical.periods
      );
      setSuccess(`${result.filename} descargado exitosamente`);
      setTimeout(() => setSuccess(null), 5000);
      setOpenFilterDialog(null);
    } catch (err) {
      setError(err.message || 'Error al descargar el reporte histórico');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCompleted = async () => {
    setActiveMessageCard('completed');
    setLoading(true);
    setError(null);
    try {
      const result = await downloadCompletedModalitiesPDF(filters.completed);
      setSuccess(`${result.filename} descargado exitosamente`);
      setTimeout(() => setSuccess(null), 5000);
      setOpenFilterDialog(null);
    } catch (err) {
      setError(err.message || 'Error al descargar el reporte de completadas');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCalendar = async () => {
    setActiveMessageCard('calendar');
    setLoading(true);
    setError(null);
    try {
      const result = await downloadDefenseCalendarPDF(filters.calendar);
      setSuccess(`${result.filename} descargado exitosamente`);
      setTimeout(() => setSuccess(null), 5000);
      setOpenFilterDialog(null);
    } catch (err) {
      setError(err.message || 'Error al descargar el calendario');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStudentListing = async () => {
    setActiveMessageCard('studentListing');
    setLoading(true);
    setError(null);
    try {
      const result = await downloadStudentListingPDF(filters.studentListing);
      setSuccess(`${result.filename} descargado exitosamente`);
      setTimeout(() => setSuccess(null), 5000);
      setOpenFilterDialog(null);
    } catch (err) {
      setError(err.message || 'Error al descargar el listado de estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDirectors = async () => {
    setActiveMessageCard('directors');
    setLoading(true);
    setError(null);
    try {
      const result = await downloadDirectorPerformancePDF(filters.directors);
      setSuccess(`${result.filename} descargado exitosamente`);
      setTimeout(() => setSuccess(null), 5000);
      setOpenFilterDialog(null);
    } catch (err) {
      setError(err.message || 'Error al descargar el reporte de directores');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadIndividualDirector = async () => {
    setActiveMessageCard('individualDirector');
    if (!filters.individualDirector.directorId) {
      setError('Debe seleccionar un director');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Usar el método de directores, pasando el filtro con directorId
      const filtersToSend = {
        directorId: filters.individualDirector.directorId,
        // Puedes agregar más filtros si tu UI lo permite (estados, modalidades, etc.)
      };
      await downloadDirectorPerformancePDF(filtersToSend);
      setSuccess('Reporte descargado correctamente.');
      setTimeout(() => setSuccess(null), 5000);
      setOpenFilterDialog(null);
    } catch (err) {
      setError(err.message || 'Error al descargar el reporte del director');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchStudents = async () => {
    setActiveMessageCard('studentTraceability');
    const searchTerm = (filters.studentTraceability.studentName || '').trim();

    if (searchTerm.length < 2) {
      setError('Ingrese al menos 2 caracteres para buscar estudiante');
      return;
    }

    setSearchingStudents(true);
    setError(null);
    setSuccess(null);

    try {
      const students = await getStudentsByAcademicProgram(searchTerm);
      const normalizedTerm = searchTerm.toLowerCase();
      const filteredStudents = students.filter((student) =>
        student.fullName.toLowerCase().includes(normalizedTerm)
      );

      setStudentSearchResults(filteredStudents);

      if (filteredStudents.length === 0) {
        setError('No se encontraron estudiantes con ese nombre en el programa académico');
      }
    } catch (err) {
      setStudentSearchResults([]);
      setError(err.message || 'Error al buscar estudiantes por programa académico');
    } finally {
      setSearchingStudents(false);
    }
  };

  const handleSelectStudentForTraceability = (student) => {
    const label = `${student.fullName}${student.code ? ` (${student.code})` : ''}`;

    setFilters((prev) => ({
      ...prev,
      studentTraceability: {
        ...prev.studentTraceability,
        selectedStudentId: student.studentId,
        selectedStudentModalityId: student.studentModalityId || null,
        selectedStudentLabel: label
      }
    }));
  };

  const handleDownloadStudentTraceability = async () => {
    setActiveMessageCard('studentTraceability');
    const studentId = filters.studentTraceability.selectedStudentId;
    const studentModalityId = filters.studentTraceability.selectedStudentModalityId;

    if (!studentId && !studentModalityId) {
      setError('Debe seleccionar un estudiante para generar el reporte de trazabilidad');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = studentId
        ? await downloadModalityTraceabilityByStudentPDF(studentId)
        : await downloadModalityTraceabilityByModalityPDF(studentModalityId);
      setSuccess(`${result.filename} descargado exitosamente`);
      setTimeout(() => setSuccess(null), 5000);
      setOpenFilterDialog(null);
    } catch (err) {
      setError(err.message || 'Error al descargar el reporte de trazabilidad por estudiante');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // HANDLERS DE FILTROS
  // ========================================

  const handleFilterChange = (reportType, field, value) => {
    setFilters(prev => ({
      ...prev,
      [reportType]: {
        ...prev[reportType],
        [field]: value
      }
    }));
  };

  const handleCheckboxChange = (reportType, field, value) => {
  setFilters(prev => {
    let currentValues = prev[reportType][field];
    if (!Array.isArray(currentValues)) currentValues = [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    return {
      ...prev,
      [reportType]: {
        ...prev[reportType],
        [field]: newValues
      }
    };
  });
};



  const renderFilteredFilters = () => (
    <div className="filters-panel" style={{
      background: '#fff',
      border: '1px solid #e6d7da',
      borderRadius: 10,
      padding: '1.5rem 1.5rem 1.2rem 1.5rem',
      boxShadow: '0 2px 12px rgba(122,17,23,0.06)',
      marginBottom: 16,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      color: '#5d0d12',
      fontSize: '1.04rem',
      maxWidth: 520
      // No textTransform ni estilos de mayúsculas
    }}>
      <div className="filter-group" style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 700, color: '#7A1117', marginBottom: 6, display: 'block', letterSpacing: '0.2px', textTransform: 'none' }}>Tipos de Modalidad</label>
        <div className="checkbox-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem 1.2rem' }}>
          {modalityTypes.map((type) => (
            <label key={type.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 500, cursor: 'pointer', textTransform: 'none' }}>
              <input
                type="checkbox"
                checked={Array.isArray(filters.filtered.degreeModalityIds) && filters.filtered.degreeModalityIds.includes(type.id)}
onChange={() => handleCheckboxChange('filtered', 'degreeModalityIds', type.id)}
                style={{ accentColor: '#7A1117', width: 17, height: 17, marginRight: 5, borderRadius: 4, border: '1.5px solid #7A1117' }}
              />
              <span style={{ textTransform: 'none' }}>{type.name}</span>
              <span style={{ color: '#b71c1c', fontWeight: 600, fontSize: '0.97em', marginLeft: 2, opacity: 0.85 }}>({type.activeModalitiesCount || 0} activas)</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group" style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 700, color: '#7A1117', marginBottom: 6, display: 'block', letterSpacing: '0.2px', textTransform: 'none' }}>Estados de Proceso</label>
        <div className="checkbox-list" style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {PROCESS_STATUSES.map((status) => (
            <label key={status.value} style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 500, cursor: 'pointer', textTransform: 'none' }}>
              <input
                type="checkbox"
                checked={filters.filtered.processStatuses.includes(status.value)}
                onChange={() => handleCheckboxChange('filtered', 'processStatuses', status.value)}
                style={{ accentColor: '#7A1117', width: 17, height: 17, marginRight: 5, borderRadius: 4, border: '1.5px solid #7A1117' }}
              />
              <span style={{ textTransform: 'none' }}>{status.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group" style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 700, color: '#7A1117', marginBottom: 6, display: 'block', letterSpacing: '0.2px', textTransform: 'none' }}>Fecha Inicio <span style={{ color: '#b71c1c', fontWeight: 400, fontSize: '0.97em', textTransform: 'none' }}>(Opcional)</span></label>
        <input
          type="date"
          value={filters.filtered.startDate}
          onChange={(e) => handleFilterChange('filtered', 'startDate', e.target.value)}
          style={{
            border: '1.5px solid #e6d7da',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: '1em',
            color: '#5d0d12',
            outline: 'none',
            fontFamily: 'inherit',
            marginTop: 2,
            width: '100%',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
        />
      </div>

      <div className="filter-group" style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 700, color: '#7A1117', marginBottom: 6, display: 'block', letterSpacing: '0.2px', textTransform: 'none' }}>Fecha Fin <span style={{ color: '#b71c1c', fontWeight: 400, fontSize: '0.97em', textTransform: 'none' }}>(Opcional)</span></label>
        <input
          type="date"
          value={filters.filtered.endDate}
          onChange={(e) => handleFilterChange('filtered', 'endDate', e.target.value)}
          style={{
            border: '1.5px solid #e6d7da',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: '1em',
            color: '#5d0d12',
            outline: 'none',
            fontFamily: 'inherit',
            marginTop: 2,
            width: '100%',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
        />
      </div>

      <div className="filter-group checkbox-group" style={{ marginBottom: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 500, cursor: 'pointer', color: '#5d0d12', textTransform: 'none' }}>
          <input
            type="checkbox"
            checked={filters.filtered.onlyWithDirector}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                filtered: {
                  ...prev.filtered,
                  onlyWithDirector: e.target.checked,
                  includeWithoutDirector: false
                }
              }));
            }}
            style={{ accentColor: '#7A1117', width: 17, height: 17, borderRadius: 4, border: '1.5px solid #7A1117' }}
          />
          <span style={{ textTransform: 'none' }}>Solo modalidades con director</span>
        </label>
      </div>

      <div className="filter-group checkbox-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 500, cursor: 'pointer', color: '#5d0d12', textTransform: 'none' }}>
          <input
            type="checkbox"
            checked={filters.filtered.includeWithoutDirector}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                filtered: {
                  ...prev.filtered,
                  includeWithoutDirector: e.target.checked,
                  onlyWithDirector: false
                }
              }));
            }}
            style={{ accentColor: '#7A1117', width: 17, height: 17, borderRadius: 4, border: '1.5px solid #7A1117' }}
          />
          <span style={{ textTransform: 'none' }}>Solo modalidades sin director</span>
        </label>
      </div>
    </div>
  );

  const renderComparisonFilters = () => (
    <div className="filters-panel" style={{
      background: '#fff',
      border: '1px solid #e6d7da',
      borderRadius: 10,
      padding: '1.5rem 1.5rem 1.2rem 1.5rem',
      boxShadow: '0 2px 12px rgba(122,17,23,0.06)',
      marginBottom: 16,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      color: '#5d0d12',
      fontSize: '1.04rem',
      maxWidth: 520
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="filter-group">
          <label style={{ fontWeight: 700, color: '#7A1117', marginBottom: 6, display: 'block', letterSpacing: '0.2px', textTransform: 'none' }}>Año</label>
          <select
            value={filters.comparison.year}
            onChange={(e) => handleFilterChange('comparison', 'year', parseInt(e.target.value))}
            style={{
              border: '1.5px solid #e6d7da',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: '1em',
              color: '#5d0d12',
              outline: 'none',
              fontFamily: 'inherit',
              marginTop: 2,
              width: '100%',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          >
            {Array.from({ length: 11 }, (_, i) => 2026 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label style={{ fontWeight: 700, color: '#7A1117', marginBottom: 6, display: 'block', letterSpacing: '0.2px', textTransform: 'none' }}>Semestre</label>
          <select
            value={filters.comparison.semester}
            onChange={(e) => handleFilterChange('comparison', 'semester', parseInt(e.target.value))}
            style={{
              border: '1.5px solid #e6d7da',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: '1em',
              color: '#5d0d12',
              outline: 'none',
              fontFamily: 'inherit',
              marginTop: 2,
              width: '100%',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          >
            <option value={1}>Semestre 1</option>
            <option value={2}>Semestre 2</option>
          </select>
        </div>
      </div>

      <div className="filter-group checkbox-group" style={{ marginTop: 18 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 500, cursor: 'pointer', color: '#5d0d12', textTransform: 'none' }}>
          <input
            type="checkbox"
            checked={filters.comparison.includeHistoricalComparison}
            onChange={(e) => handleFilterChange('comparison', 'includeHistoricalComparison', e.target.checked)}
            style={{ accentColor: '#7A1117', width: 17, height: 17, borderRadius: 4, border: '1.5px solid #7A1117' }}
          />
          <span style={{ textTransform: 'none' }}>Incluir comparación histórica</span>
        </label>
      </div>

      {filters.comparison.includeHistoricalComparison && (
        <div className="filter-group">
          <label style={{ fontWeight: 700, color: '#7A1117', marginBottom: 6, display: 'block', letterSpacing: '0.2px', textTransform: 'none' }}>Número de periodos históricos (2-10)</label>
          <select
            value={filters.comparison.historicalPeriodsCount}
            onChange={(e) => handleFilterChange('comparison', 'historicalPeriodsCount', parseInt(e.target.value))}
            style={{
              border: '1.5px solid #e6d7da',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: '1em',
              color: '#5d0d12',
              outline: 'none',
              fontFamily: 'inherit',
              marginTop: 2,
              width: '100%',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          >
            {Array.from({ length: 9 }, (_, i) => 2 + i).map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>
          <small style={{ color: '#666', marginTop: '0.5rem', display: 'block', textTransform: 'none' }}>
            Comparará con los últimos {filters.comparison.historicalPeriodsCount} semestres ({filters.comparison.historicalPeriodsCount / 2} años)
          </small>
        </div>
      )}

      <div className="filter-group checkbox-group" style={{ marginTop: 18 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 500, cursor: 'pointer', color: '#5d0d12', textTransform: 'none' }}>
          <input
            type="checkbox"
            checked={filters.comparison.includeTrendsAnalysis}
            onChange={(e) => handleFilterChange('comparison', 'includeTrendsAnalysis', e.target.checked)}
            style={{ accentColor: '#7A1117', width: 17, height: 17, borderRadius: 4, border: '1.5px solid #7A1117' }}
          />
          <span style={{ textTransform: 'none' }}>Incluir análisis de tendencias</span>
        </label>
      </div>

      <div className="filter-group checkbox-group" style={{ marginTop: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 500, cursor: 'pointer', color: '#5d0d12', textTransform: 'none' }}>
          <input
            type="checkbox"
            checked={filters.comparison.onlyActiveModalities}
            onChange={(e) => handleFilterChange('comparison', 'onlyActiveModalities', e.target.checked)}
            style={{ accentColor: '#7A1117', width: 17, height: 17, borderRadius: 4, border: '1.5px solid #7A1117' }}
          />
          <span style={{ textTransform: 'none' }}>Solo modalidades activas</span>
        </label>
      </div>
    </div>
  );

  const renderHistoricalFilters = () => (
    <div className="filters-panel historical-filters-panel">
      <div className="alert-info historical-alert">
        <span className="historical-icon">INFO</span>
        <span>Selecciona un tipo de modalidad para ver su evolución histórica</span>
      </div>

      <div className="filter-group historical-filter-group">
        <label className="historical-label">Tipo de Modalidad <span className="historical-required">*</span></label>
        <select
          className="historical-select"
          value={filters.historical.modalityTypeId || ''}
          onChange={(e) => handleFilterChange('historical', 'modalityTypeId', e.target.value)}
          required
        >
          <option value="">Seleccionar...</option>
          {modalityTypes.map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
      </div>

      <div className="filter-group historical-filter-group">
        <label className="historical-label">Número de periodos a analizar <span className="historical-hint">(2-20)</span></label>
        <select
          className="historical-select"
          value={filters.historical.periods}
          onChange={(e) => handleFilterChange('historical', 'periods', parseInt(e.target.value))}
        >
          {Array.from({ length: 19 }, (_, i) => 2 + i).map(period => (
            <option key={period} value={period}>{period}</option>
          ))}
        </select>
        <small className="historical-small">
          Se analizarán los últimos {filters.historical.periods} periodos (≈ {(filters.historical.periods / 2).toFixed(1)} años)
        </small>
      </div>
    </div>
  );

  const renderCompletedFilters = () => (
    <div className="filters-panel">
      <div className="filter-group">
        <label>Tipos de Modalidad</label>
        <div className="checkbox-list">
          {modalityTypes.map((type) => (
            <label key={type.id}>
              <input
                type="checkbox"
                checked={filters.completed.modalityTypes.includes(type.name)}
                onChange={() => handleCheckboxChange('completed', 'modalityTypes', type.name)}
              />
              {type.name}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label>Resultados</label>
        <div className="checkbox-list">
          {RESULT_TYPES.map((result) => (
            <label key={result.value}>
              <input
                type="checkbox"
                checked={filters.completed.results.includes(result.value)}
                onChange={() => handleCheckboxChange('completed', 'results', result.value)}
              />
              {result.label}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="filter-group">
          <label>Año</label>
          <input
            type="number"
            value={filters.completed.year || ''}
            onChange={(e) => handleFilterChange('completed', 'year', e.target.value ? parseInt(e.target.value) : null)}
            min="2020"
            max="2030"
          />
        </div>

        <div className="filter-group">
          <label>Semestre</label>
          <select
            value={filters.completed.semester || ''}
            onChange={(e) => handleFilterChange('completed', 'semester', e.target.value || null)}
          >
            <option value="">Todos</option>
            <option value={1}>Semestre 1</option>
            <option value={2}>Semestre 2</option>
          </select>
        </div>
      </div>

      <div className="filter-group">
        <label>Fecha Inicio (Opcional)</label>
        <input
          type="date"
          value={filters.completed.startDate}
          onChange={(e) => handleFilterChange('completed', 'startDate', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>Fecha Fin (Opcional)</label>
        <input
          type="date"
          value={filters.completed.endDate}
          onChange={(e) => handleFilterChange('completed', 'endDate', e.target.value)}
        />
      </div>

      <div className="filter-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={filters.completed.onlyWithDistinction}
            onChange={(e) => handleFilterChange('completed', 'onlyWithDistinction', e.target.checked)}
          />
          Solo con distinción académica
        </label>
      </div>

      {filters.completed.onlyWithDistinction && (
        <div className="filter-group">
          <label>Tipo de Distinción</label>
          <select
            value={filters.completed.distinctionType}
            onChange={(e) => handleFilterChange('completed', 'distinctionType', e.target.value)}
          >
            <option value="">Todas</option>
            {DISTINCTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="filter-group">
        <label>Director (Opcional)</label>
        <select
          value={filters.completed.directorId || ''}
          onChange={(e) => handleFilterChange('completed', 'directorId', e.target.value || null)}
        >
          <option value="">Todos</option>
          {directors.map((director) => (
            <option key={director.id} value={director.id}>
              {director.name || director.fullName}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="filter-group">
          <label>Calificación Mínima (0.0 - 5.0)</label>
          <input
            type="number"
            value={filters.completed.minGrade || ''}
            onChange={(e) => handleFilterChange('completed', 'minGrade', e.target.value ? parseFloat(e.target.value) : null)}
            min="0"
            max="5"
            step="0.1"
          />
        </div>

        <div className="filter-group">
          <label>Calificación Máxima (0.0 - 5.0)</label>
          <input
            type="number"
            value={filters.completed.maxGrade || ''}
            onChange={(e) => handleFilterChange('completed', 'maxGrade', e.target.value ? parseFloat(e.target.value) : null)}
            min="0"
            max="5"
            step="0.1"
          />
        </div>
      </div>

      <div className="filter-group">
        <label>Tipo (Individual/Grupal)</label>
        <select
          value={filters.completed.modalityTypeFilter}
          onChange={(e) => handleFilterChange('completed', 'modalityTypeFilter', e.target.value)}
        >
          <option value="">Todos</option>
          {MODALITY_TYPE_FILTERS.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="filter-group">
          <label>Ordenar Por</label>
          <select
            value={filters.completed.sortBy}
            onChange={(e) => handleFilterChange('completed', 'sortBy', e.target.value)}
          >
            {SORT_OPTIONS.completed.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Dirección</label>
          <select
            value={filters.completed.sortDirection}
            onChange={(e) => handleFilterChange('completed', 'sortDirection', e.target.value)}
          >
            <option value="ASC">Ascendente</option>
            <option value="DESC">Descendente</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderCalendarFilters = () => (
    <div className="filters-panel calendar-filters-panel">
      <div className="calendar-alert-info">
        
        <span>Por defecto: últimos 30 días + próximos 60 días</span>
      </div>

      <div className="filter-group calendar-filter-group">
        <label className="calendar-label">Fecha Inicio <span className="calendar-hint">(Opcional)</span></label>
        <input
          type="datetime-local"
          className="calendar-input"
          value={filters.calendar.startDate}
          onChange={(e) => handleFilterChange('calendar', 'startDate', e.target.value)}
        />
      </div>

      <div className="filter-group calendar-filter-group">
        <label className="calendar-label">Fecha Fin <span className="calendar-hint">(Opcional)</span></label>
        <input
          type="datetime-local"
          className="calendar-input"
          value={filters.calendar.endDate}
          onChange={(e) => handleFilterChange('calendar', 'endDate', e.target.value)}
        />
      </div>

      <div className="filter-group checkbox-group calendar-checkbox-group">
        <label className="calendar-checkbox-label">
          <input
            type="checkbox"
            className="calendar-checkbox-input"
            checked={filters.calendar.includeCompleted}
            onChange={(e) => handleFilterChange('calendar', 'includeCompleted', e.target.checked)}
          />
          Incluir sustentaciones ya completadas
        </label>
      </div>
    </div>
  );

  const renderStudentListingFilters = () => (
    <div className="filters-panel student-listing-filters-panel">
      <div className="filter-group student-listing-filter-group">
        <label className="student-listing-label">Estados de la modalidad</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <input
            type="text"
            placeholder="Buscar estado..."
            value={filters.studentListing.statusSearch || ''}
            onChange={e => handleFilterChange('studentListing', 'statusSearch', e.target.value)}
            style={{
              border: '1.5px solid #e6d7da',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: '1em',
              color: '#5d0d12',
              outline: 'none',
              fontFamily: 'inherit',
              width: '100%',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
              maxWidth: 220
            }}
          />
          <button
            type="button"
            onClick={() => handleFilterChange('studentListing', 'statuses', []) || handleFilterChange('studentListing', 'statusSearch', '')}
            style={{
              background: '#f8e9eb',
              color: '#7A1117',
              border: '1px solid #e6d7da',
              borderRadius: 6,
              padding: '6px 14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1em',
              marginLeft: 4
            }}
          >
            Borrar filtros
          </button>
        </div>
        <div className="checkbox-list student-listing-checkbox-list">
          {PROCESS_STATUSES.filter(status =>
            !filters.studentListing.statusSearch || status.label.toLowerCase().includes(filters.studentListing.statusSearch.toLowerCase())
          ).map((status) => (
            <label key={status.value} className="student-listing-checkbox-label">
              <input
                type="checkbox"
                className="student-listing-checkbox-input"
                checked={filters.studentListing.statuses.includes(status.value)}
                onChange={() => handleCheckboxChange('studentListing', 'statuses', status.value)}
              />
              {status.label}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group student-listing-filter-group">
        <label className="student-listing-label">Tipos de Modalidad</label>
        <select
          className="individual-director-select-multimodal"
          multiple
          value={filters.studentListing.modalityTypes}
          onChange={e => {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            handleFilterChange('studentListing', 'modalityTypes', selected);
          }}
        >
          {modalityTypes.map((type) => (
            <option key={type.id} value={type.name}>{type.name}</option>
          ))}
        </select>
        <div className="individual-director-select-hint">
          Mantén presionada Ctrl o Shift para seleccionar varias modalidades
        </div>
      </div>

      <div className="filter-group student-listing-filter-group">
        <label className="student-listing-label">Año (Opcional)</label>
        <select
          className="student-listing-select"
          value={filters.studentListing.year || ''}
          onChange={e => handleFilterChange('studentListing', 'year', e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">Todos</option>
          {Array.from({ length: 11 }, (_, i) => 2026 + i).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

     

      <div className="filter-group student-listing-filter-group">
        <label className="student-listing-label">Tipo (Individual/Grupal)</label>
        <select
          className="student-listing-select"
          value={filters.studentListing.modalityTypeFilter}
          onChange={(e) => handleFilterChange('studentListing', 'modalityTypeFilter', e.target.value)}
        >
          <option value="">Todos</option>
          {MODALITY_TYPE_FILTERS.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group student-listing-filter-group">
        <label className="student-listing-label">Tiene Director</label>
        <select
          className="student-listing-select"
          value={filters.studentListing.hasDirector === null ? 'all' : filters.studentListing.hasDirector.toString()}
          onChange={(e) => {
            const value = e.target.value === 'all' ? null : e.target.value === 'true';
            handleFilterChange('studentListing', 'hasDirector', value);
          }}
        >
          <option value="all">Todos</option>
          <option value="true">Con director</option>
          <option value="false">Sin director</option>
        </select>
      </div>

      <div className="student-listing-filters-row">
        <div className="filter-group student-listing-filter-group">
          <label className="student-listing-label">Ordenar Por</label>
          <select
            className="student-listing-select"
            value={filters.studentListing.sortBy}
            onChange={(e) => handleFilterChange('studentListing', 'sortBy', e.target.value)}
          >
            {SORT_OPTIONS.student.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group student-listing-filter-group">
          <label className="student-listing-label">Dirección</label>
          <select
            className="student-listing-select"
            value={filters.studentListing.sortDirection}
            onChange={(e) => handleFilterChange('studentListing', 'sortDirection', e.target.value)}
          >
            <option value="ASC">Ascendente</option>
            <option value="DESC">Descendente</option>
          </select>
        </div>
      </div>

      <div className="filter-group checkbox-group student-listing-checkbox-group">
        <label className="student-listing-checkbox-label">
          <input
            type="checkbox"
            className="student-listing-checkbox-input"
            checked={filters.studentListing.includeInactive}
            onChange={(e) => handleFilterChange('studentListing', 'includeInactive', e.target.checked)}
          />
          Incluir estudiantes inactivos
        </label>
      </div>
    </div>
  );

  const renderDirectorsFilters = () => (
    <div className="filters-panel" style={{
      background: '#fff',
      border: '1px solid #e6d7da',
      borderRadius: 10,
      padding: '1.5rem 1.5rem 1.2rem 1.5rem',
      boxShadow: '0 2px 12px rgba(122,17,23,0.06)',
      marginBottom: 16,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      color: '#5d0d12',
      fontSize: '1.04rem',
      maxWidth: 520
    }}>
      <div className="filter-group">
        {/* Espacio para futuros filtros o info */}
      </div>

      <div className="filter-group">
        <label style={{ fontWeight: 700, color: '#7A1117', marginBottom: 6, display: 'block', letterSpacing: '0.2px' }}>Estados de Proceso</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <input
            type="text"
            placeholder="Buscar estado..."
            value={filters.directors.processStatusSearch || ''}
            onChange={e => handleFilterChange('directors', 'processStatusSearch', e.target.value)}
            style={{
              border: '1.5px solid #e6d7da',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: '1em',
              color: '#5d0d12',
              outline: 'none',
              fontFamily: 'inherit',
              width: '100%',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
              maxWidth: 220
            }}
          />
          <button
            type="button"
            onClick={() => setFilters(prev => ({
              ...prev,
              directors: {
                ...prev.directors,
                processStatuses: [],
                processStatusSearch: ''
              }
            }))}
            style={{
              background: '#f8e9eb',
              color: '#7A1117',
              border: '1px solid #e6d7da',
              borderRadius: 6,
              padding: '6px 14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1em',
              marginLeft: 4
            }}
          >
            Borrar filtros
          </button>
        </div>
        <div className="checkbox-list" style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {PROCESS_STATUSES.filter(status =>
            !filters.directors.processStatusSearch || status.label.toLowerCase().includes(filters.directors.processStatusSearch.toLowerCase())
          ).map((status) => (
            <label key={status.value} style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 500, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.directors.processStatuses.includes(status.value)}
                onChange={() => handleCheckboxChange('directors', 'processStatuses', status.value)}
                style={{ accentColor: '#7A1117', width: 17, height: 17, borderRadius: 4, border: '1.5px solid #7A1117' }}
              />
              {status.label}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group" style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 700, color: '#7A1117', marginBottom: 6, display: 'block', letterSpacing: '0.2px' }}>Tipos de modalidad</label>
        <select
          multiple
          value={filters.directors.modalityTypes}
          onChange={e => {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            handleFilterChange('directors', 'modalityTypes', selected);
          }}
          style={{
            border: '1.5px solid #e6d7da',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: '1em',
            color: '#5d0d12',
            outline: 'none',
            fontFamily: 'inherit',
            width: '100%',
            boxSizing: 'border-box',
            marginTop: 4,
            minHeight: 44,
            background: '#f9f6f7'
          }}
        >
          {modalityTypes.map((type) => (
            <option key={type.id} value={type.name}>{type.name}</option>
          ))}
        </select>
        <div style={{ fontSize: '0.92em', color: '#7A1117', marginTop: 6 }}>
          Mantén presionada Ctrl o Shift para seleccionar varias modalidades
        </div>
      </div>

      <div className="filter-group checkbox-group" style={{ marginBottom: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 500, cursor: 'pointer', color: '#5d0d12' }}>
          <input
            type="checkbox"
            checked={filters.directors.onlyOverloaded}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                directors: {
                  ...prev.directors,
                  onlyOverloaded: e.target.checked,
                  onlyAvailable: e.target.checked ? false : prev.directors.onlyAvailable
                }
              }));
            }}
            style={{ accentColor: '#7A1117', width: 17, height: 17, borderRadius: 4, border: '1.5px solid #7A1117' }}
          />
          Solo directores sobrecargados (≥5 modalidades)
        </label>
      </div>

      <div className="filter-group checkbox-group" style={{ marginBottom: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 500, cursor: 'pointer', color: '#5d0d12' }}>
          <input
            type="checkbox"
            checked={filters.directors.onlyAvailable}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                directors: {
                  ...prev.directors,
                  onlyAvailable: e.target.checked,
                  onlyOverloaded: e.target.checked ? false : prev.directors.onlyOverloaded
                }
              }));
            }}
            style={{ accentColor: '#7A1117', width: 17, height: 17, borderRadius: 4, border: '1.5px solid #7A1117' }}
          />
          Solo directores disponibles (&lt;3 modalidades)
        </label>
      </div>

      <div className="filter-group checkbox-group" style={{ marginBottom: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 500, cursor: 'pointer', color: '#5d0d12' }}>
          <input
            type="checkbox"
            checked={filters.directors.onlyActiveModalities}
            onChange={(e) => handleFilterChange('directors', 'onlyActiveModalities', e.target.checked)}
            style={{ accentColor: '#7A1117', width: 17, height: 17, borderRadius: 4, border: '1.5px solid #7A1117' }}
          />
          Solo modalidades activas
        </label>
      </div>

      <div className="filter-group checkbox-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 500, cursor: 'pointer', color: '#5d0d12' }}>
          <input
            type="checkbox"
            checked={filters.directors.includeWorkloadAnalysis}
            onChange={(e) => handleFilterChange('directors', 'includeWorkloadAnalysis', e.target.checked)}
            style={{ accentColor: '#7A1117', width: 17, height: 17, borderRadius: 4, border: '1.5px solid #7A1117' }}
          />
          Incluir análisis de carga de trabajo
        </label>
      </div>
    </div>
  );

  const renderIndividualDirectorFilters = () => (
    <div className="filters-panel individual-director-filters-panel">
      <div className="filter-group individual-director-filter-group">
        <label className="individual-director-label">
          Seleccionar director <span className="individual-director-required">*</span>
        </label>
        <select
          className="individual-director-select"
          value={filters.individualDirector.directorId || ''}
          onChange={e => {
            const value = e.target.value ? Number(e.target.value) : '';
            handleFilterChange('individualDirector', 'directorId', value);
          }}
          required
        >
          <option value="">Seleccionar...</option>
          {directors && directors.length > 0 ? (
            directors.map((director) => (
              <option key={director.id} value={director.id}>
                {director.name || director.fullName}
              </option>
            ))
          ) : (
            <option value="" disabled>No hay directores disponibles</option>
          )}
        </select>
      </div>

    <div className="filter-group individual-director-filter-group">
      <label className="individual-director-label">Estados de proceso</label>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Buscar estado..."
          value={filters.individualDirector.processStatusSearch || ''}
          onChange={e => handleFilterChange('individualDirector', 'processStatusSearch', e.target.value)}
          style={{
            border: '1.5px solid #e6d7da',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: '1em',
            color: '#5d0d12',
            outline: 'none',
            fontFamily: 'inherit',
            width: '100%',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
            maxWidth: 220
          }}
        />
        <button
          type="button"
          onClick={() => handleFilterChange('individualDirector', 'processStatuses', []) || handleFilterChange('individualDirector', 'processStatusSearch', '')}
          style={{
            background: '#f8e9eb',
            color: '#7A1117',
            border: '1px solid #e6d7da',
            borderRadius: 6,
            padding: '6px 14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1em',
            marginLeft: 4
          }}
        >
          Borrar filtros
        </button>
      </div>
      <div className="checkbox-list individual-director-checkbox-list">
        {PROCESS_STATUSES.filter(status =>
          !filters.individualDirector.processStatusSearch || status.label.toLowerCase().includes(filters.individualDirector.processStatusSearch.toLowerCase())
        ).map((status) => (
          <label key={status.value} className="individual-director-checkbox-label">
            <input
              type="checkbox"
              className="individual-director-checkbox-input"
              checked={Array.isArray(filters.individualDirector.processStatuses) && filters.individualDirector.processStatuses.includes(status.value)}
              onChange={() => {
                const prev = Array.isArray(filters.individualDirector.processStatuses) ? filters.individualDirector.processStatuses : [];
                const newStatuses = prev.includes(status.value)
                  ? prev.filter(v => v !== status.value)
                  : [...prev, status.value];
                handleFilterChange('individualDirector', 'processStatuses', newStatuses);
              }}
            />
            <span>{status.label}</span>
          </label>
        ))}
      </div>
    </div>

    <div className="filter-group individual-director-filter-group">
      <label className="individual-director-label">Tipos de modalidad</label>
      <select
        className="individual-director-select-multimodal"
        multiple
        value={filters.individualDirector.modalityTypes || []}
        onChange={e => {
          const selected = Array.from(e.target.selectedOptions, option => option.value);
          handleFilterChange('individualDirector', 'modalityTypes', selected.map(Number));
        }}
      >
        {modalityTypes.map((type) => (
          <option key={type.id} value={type.id}>{type.name}</option>
        ))}
      </select>
      <div className="individual-director-select-hint">Mantén presionada Ctrl o Shift para seleccionar varias modalidades</div>
    </div>

    <div className="filter-group checkbox-group individual-director-checkbox-group">
      <label className="individual-director-checkbox-label">
        <input
          type="checkbox"
          className="individual-director-checkbox-input"
          checked={!!filters.individualDirector.onlyActiveModalities}
          onChange={e => handleFilterChange('individualDirector', 'onlyActiveModalities', e.target.checked)}
        />
        Solo modalidades activas
      </label>
    </div>
    <div className="filter-group checkbox-group individual-director-checkbox-group">
      <label className="individual-director-checkbox-label">
        <input
          type="checkbox"
          className="individual-director-checkbox-input"
          checked={!!filters.individualDirector.includeWorkloadAnalysis}
          onChange={e => handleFilterChange('individualDirector', 'includeWorkloadAnalysis', e.target.checked)}
        />
        Incluir análisis de carga de trabajo
      </label>
    </div>
  </div>
);

  const renderStudentTraceabilityFilters = () => (
    <div className="filters-panel" style={{
      background: '#fff',
      border: '1px solid #e6d7da',
      borderRadius: 10,
      padding: '1.5rem 1.5rem 1.2rem 1.5rem',
      boxShadow: '0 2px 12px rgba(122,17,23,0.06)',
      marginBottom: 16,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      color: '#5d0d12',
      fontSize: '1.04rem',
      maxWidth: 640
    }}>
      <div className="filter-group" style={{ marginBottom: 14 }}>
        <label style={{ fontWeight: 700, color: '#7A1117', marginBottom: 6, display: 'block' }}>
          Buscar estudiante por nombre
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={filters.studentTraceability.studentName}
            placeholder="Ejemplo: Juan Pérez"
            onChange={(e) => handleFilterChange('studentTraceability', 'studentName', e.target.value)}
            style={{
              border: '1.5px solid #e6d7da',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: '1em',
              color: '#5d0d12',
              outline: 'none',
              fontFamily: 'inherit',
              width: '100%',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
              maxWidth: 360
            }}
          />
          <button
            type="button"
            className="btn-filters"
            onClick={handleSearchStudents}
            disabled={loading || searchingStudents}
          >
            {searchingStudents ? 'Buscando...' : 'Buscar'}
          </button>
          <button
            type="button"
            className="btn-filters"
            onClick={() => {
              setStudentSearchResults([]);
              setFilters((prev) => ({
                ...prev,
                studentTraceability: {
                  ...prev.studentTraceability,
                  studentName: '',
                  selectedStudentId: null,
                  selectedStudentModalityId: null,
                  selectedStudentLabel: ''
                }
              }));
            }}
            disabled={loading || searchingStudents}
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="filter-group" style={{ marginBottom: 14 }}>
        <label style={{ fontWeight: 700, color: '#7A1117', marginBottom: 6, display: 'block' }}>
          Resultados de búsqueda
        </label>

        {studentSearchResults.length === 0 ? (
          <div style={{
            border: '1px dashed #d6c1c4',
            borderRadius: 8,
            padding: '10px 12px',
            color: '#7A1117',
            background: '#fcf8f8',
            fontSize: '0.96rem'
          }}>
            Realiza una búsqueda para seleccionar un estudiante.
          </div>
        ) : (
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'grid', gap: 8 }}>
            {studentSearchResults.map((student) => {
              const isSelected = filters.studentTraceability.selectedStudentId === student.studentId;

              return (
                <button
                  key={student.studentId}
                  type="button"
                  onClick={() => handleSelectStudentForTraceability(student)}
                  style={{
                    textAlign: 'left',
                    border: isSelected ? '1.5px solid #7A1117' : '1px solid #e7d9dc',
                    borderRadius: 8,
                    background: isSelected ? '#f8e9eb' : '#fff',
                    color: '#5d0d12',
                    padding: '10px 12px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{student.fullName}</div>
                  <div style={{ fontSize: '0.92rem', marginTop: 2 }}>
                    ID estudiante: {student.studentId || 'N/A'}
                    {student.studentModalityId ? ` | ID modalidad: ${student.studentModalityId}` : ''}
                    {student.code ? ` | Código: ${student.code}` : ''}
                    {student.programName ? ` | Programa: ${student.programName}` : ''}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{
        borderTop: '1px solid #f0e3e5',
        paddingTop: 10,
        color: '#7A1117',
        fontSize: '0.97rem'
      }}>
        <strong>Estudiante seleccionado:</strong>{' '}
        {filters.studentTraceability.selectedStudentLabel || 'Ninguno'}
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          className="btn-primary"
          style={{ fontWeight: 700, width: '100%' }}
          onClick={handleDownloadStudentTraceability}
          disabled={loading}
        >
          {loading ? <span className="spinner-small"></span> : ''} Descargar PDF
        </button>
      </div>
    </div>
  );

  const renderCardMessage = (cardKey) => {
    if (activeMessageCard !== cardKey) return null;
    if (!error && !success) return null;

    const isError = Boolean(error);
    const message = error || success;

    return (
      <div
        className={`reports-alert ${isError ? 'alert-error' : 'alert-success'}`}
        style={{ marginTop: 10, marginBottom: 0 }}
      >
        <span>{isError ? 'ERROR' : 'OK'}</span>
        <div>
          <strong>{isError ? 'Error' : 'Éxito'}</strong>
          <p>{message}</p>
        </div>
        <button
          className="alert-close"
          onClick={() => {
            setError(null);
            setSuccess(null);
            setActiveMessageCard(null);
          }}
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    );
  };

  // ========================================
  // RENDER PRINCIPAL
  // ========================================

  if (globalLoading) {
    return (
      <div className="reports-page">
        <div className="reports-loading">
          <div className="spinner"></div>
          <p>Cargando sistema de reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      {/* Header Profesional y Minimalista */}
      <div className="reports-header" style={{
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '2.5rem 2rem 2rem 2rem',
        background: 'linear-gradient(135deg, #7A1117 0%, #5d0d12 100%)',
        boxShadow: '0 8px 20px rgba(122, 17, 23, 0.18)',
        borderRadius: '12px',
        marginBottom: '2.2rem',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.1rem',
          zIndex: 2,
          position: 'relative',
        }}>
          <h1 style={{
            fontFamily: 'Georgia, Times New Roman, serif',
            fontWeight: 800,
            fontSize: '2.5rem',
            margin: 0,
            letterSpacing: '1.5px',
            color: '#fff',
            textShadow: '0 2px 12px rgba(122,17,23,0.13)',
            lineHeight: 1.1,
            paddingBottom: '0.2rem',
            borderBottom: '2.5px solid #fff3',
            width: '100%',
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Reportes del Comité
          </h1>
          <p className="reports-subtitle" style={{
            margin: 0,
            marginTop: '0.7rem',
            maxWidth: 600,
            color: '#fff',
            fontSize: '1.13rem',
            opacity: 0.97,
            fontWeight: 400,
            lineHeight: 1.7,
            textShadow: '0 1px 8px rgba(122,17,23,0.10)'
          }}>
            Sistema completo de generación de reportes en PDF con análisis detallado.<br />
            Permite consolidar información sobre modalidades, estados, decisiones académicas, asignación de directores y estadísticas institucionales.
          </p>
        </div>
        <span style={{
          position: 'absolute',
          right: '-60px',
          top: '-60px',
          opacity: 0.10,
          pointerEvents: 'none',
          fontSize: '11rem',
          lineHeight: 1,
          zIndex: 1
        }}>
          <span aria-label="decorativo">DOC</span>
        </span>
      </div>

      {/* Estado de conexión */}
      {connectionStatus === 'error' && (
        <div className="reports-alert alert-error">
          <span>Error</span>
          <div>
            <strong>Error de Conexión</strong>
            <p>No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.</p>
          </div>
        </div>
      )}

      {/* Grid de reportes */}
      <div className="reports-grid">
        {/* Reporte Global */}
        <div className="report-card" style={{ borderTop: '4px solid #7A1117', boxShadow: '0 8px 32px rgba(122,17,23,0.10)' }}>
          <div className="report-card-header">
            <h3 style={{ color: '#7A1117', fontWeight: 800, fontSize: '1.35rem', letterSpacing: '0.5px', margin: 0 }}>Reporte Modalidades Activas</h3>
          </div>
          <p className="report-description" style={{ fontWeight: 500, color: '#5d0d12' }}>
            Vista completa de todas las modalidades activas del programa académico
          </p>
          <div className="report-stats">
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Sin filtros</span>
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Vista completa</span>
          </div>
          <div className="report-actions">
            <button
              className="btn-primary full-width"
              style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.5px' }}
              onClick={handleDownloadGlobal}
              disabled={loading}
            >
              {loading ? <span className="spinner-small"></span> : ''} Descargar PDF
            </button>
          </div>
          {renderCardMessage('global')}
        </div>

        {/* Reporte Filtrado (RF-46) */}
        <div className="report-card" style={{ borderTop: '4px solid #7A1117', boxShadow: '0 8px 32px rgba(122,17,23,0.10)' }}>
          <div className="report-card-header">
            <h3 style={{ color: '#7A1117', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Reporte Institucional de Modalidades de Grado</h3>
          </div>
          <p className="report-description" style={{ fontWeight: 500, color: '#5d0d12' }}>
            Genera un reporte institucional de modalidades de grado aplicando filtros avanzados por tipo, estado, rango de fechas y director asignado.
          </p>
          <div className="report-stats">
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Múltiples filtros</span>
          </div>
          <div className="report-actions">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-filters"
                style={{ fontWeight: 600, borderColor: '#7A1117', color: '#7A1117' }}
                onClick={() => setOpenFilterDialog(openFilterDialog === 'filtered' ? null : 'filtered')}
                disabled={loading}
              >
                 {openFilterDialog === 'filtered' ? 'Ocultar' : 'Configurar'} Filtros
              </button>
              <button
                className="btn-primary"
                style={{ fontWeight: 700 }}
                onClick={handleDownloadFiltered}
                disabled={loading}
              >
                {loading ? <span className="spinner-small"></span> : ''} Descargar PDF
              </button>
            </div>
          </div>
          {openFilterDialog === 'filtered' && renderFilteredFilters()}
          {renderCardMessage('filtered')}
        </div>

        {/* Comparación de Periodos (RF-48) */}
        <div className="report-card" style={{ borderTop: '4px solid #7A1117', boxShadow: '0 8px 32px rgba(122,17,23,0.10)' }}>
          <div className="report-card-header">
          
            <h3 style={{ color: '#7A1117', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Reporte Comparativo Institucional de Modalidades de Grado</h3>
          </div>
          <p className="report-description" style={{ fontWeight: 500, color: '#5d0d12' }}>
            Genera un reporte institucional que compara las modalidades de grado por tipo, incorporando análisis estadístico y tendencias para la toma de decisiones académicas.
          </p>
          <div className="report-stats">
            
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Tendencias</span>
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Proyecciones</span>
          </div>
          <div className="report-actions">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-filters"
                style={{ fontWeight: 600, borderColor: '#7A1117', color: '#7A1117' }}
                onClick={() => setOpenFilterDialog(openFilterDialog === 'comparison' ? null : 'comparison')}
                disabled={loading}
              >
                 {openFilterDialog === 'comparison' ? 'Ocultar' : 'Configurar'} Filtros
              </button>
              <button
                className="btn-primary"
                style={{ fontWeight: 700 }}
                onClick={handleDownloadComparison}
                disabled={loading}
              >
                {loading ? <span className="spinner-small"></span> : ''} Descargar PDF
              </button>
            </div>
          </div>
          {openFilterDialog === 'comparison' && renderComparisonFilters()}
          {renderCardMessage('comparison')}
        </div>

        {/* Análisis Histórico */}
        <div className="report-card" style={{ borderTop: '4px solid #7A1117', boxShadow: '0 8px 32px rgba(122,17,23,0.10)' }}>
          <div className="report-card-header">
            <h3 style={{ color: '#7A1117', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Reporte Histórico Institucional de Modalidades de Grado</h3>
          </div>
          <p className="report-description" style={{ fontWeight: 500, color: '#5d0d12' }}>
            Genera un reporte que analiza la evolución temporal de una modalidad de grado específica, incorporando estadísticas históricas, tendencias y comparativas entre periodos para apoyar la planificación académica.
          </p>
          <div className="report-stats">
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Evolución temporal</span>

          </div>
          <div className="report-actions">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-filters"
                style={{ fontWeight: 600, borderColor: '#7A1117', color: '#7A1117' }}
                onClick={() => setOpenFilterDialog(openFilterDialog === 'historical' ? null : 'historical')}
                disabled={loading}
              >
                 {openFilterDialog === 'historical' ? 'Ocultar' : 'Configurar'} Filtros
              </button>
              <button
                className="btn-primary"
                style={{ fontWeight: 700 }}
                onClick={handleDownloadHistorical}
                disabled={loading}
              >
                {loading ? <span className="spinner-small"></span> : ''} Descargar PDF
              </button>
            </div>
          </div>
          {openFilterDialog === 'historical' && renderHistoricalFilters()}
          {renderCardMessage('historical')}
        </div>

        {/* Carga de Directores (RF-49) */}
        <div className="report-card" style={{ borderTop: '4px solid #7A1117', boxShadow: '0 8px 32px rgba(122,17,23,0.10)' }}>
          <div className="report-card-header">
            <h3 style={{ color: '#7A1117', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Reporte Institucional de Directores y Modalidades Asignadas </h3>
          </div>
          <p className="report-description" style={{ fontWeight: 500, color: '#5d0d12' }}>
            Genera un reporte institucional que consolida las modalidades de grado asignadas a los directores, incluyendo análisis de carga académica, estado y seguimiento temporal.
          </p>
          <div className="report-stats">
          
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Directores</span>
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Sobrecarga</span>
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Disponibilidad</span>
          </div>
          <div className="report-actions">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-filters"
                style={{ fontWeight: 600, borderColor: '#7A1117', color: '#7A1117' }}
                onClick={() => setOpenFilterDialog(openFilterDialog === 'directors' ? null : 'directors')}
                disabled={loading}
              >
                 {openFilterDialog === 'directors' ? 'Ocultar' : 'Configurar'} Filtros
              </button>
              <button
                className="btn-primary"
                style={{ fontWeight: 700 }}
                onClick={handleDownloadDirectors}
                disabled={loading}
              >
                {loading ? <span className="spinner-small"></span> : ''} Descargar PDF
              </button>
            </div>
          </div>
          {openFilterDialog === 'directors' && renderDirectorsFilters()}
          {renderCardMessage('directors')}
        </div>


        {/* Director Individual */}
        <div className="report-card" style={{ borderTop: '4px solid #7A1117', boxShadow: '0 8px 32px rgba(122,17,23,0.10)' }}>
          <div className="report-card-header">
            <h3 style={{ color: '#7A1117', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Reporte Institucional Individual de Directores y Modalidades Asignadas</h3>
          </div>
          <p className="report-description" style={{ fontWeight: 500, color: '#5d0d12' }}>
            Genera un reporte institucional de un director específico, detallando sus modalidades de grado asignadas, estado actual, carga académica y seguimiento temporal.
          </p>
          <div className="report-stats">
          
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Director específico</span>
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Detallado</span>
          
          </div>
          <div className="report-actions">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-filters"
                style={{ fontWeight: 600, borderColor: '#7A1117', color: '#7A1117' }}
                onClick={() => setOpenFilterDialog(openFilterDialog === 'individualDirector' ? null : 'individualDirector')}
                disabled={loading}
              >
                 {openFilterDialog === 'individualDirector' ? 'Ocultar' : 'Configurar'} Filtros
              </button>
              <button
                className="btn-primary"
                style={{ fontWeight: 700 }}
                onClick={handleDownloadIndividualDirector}
                disabled={loading}
              >
                {loading ? <span className="spinner-small"></span> : ''} Descargar PDF
              </button>
            </div>
          </div>
          {openFilterDialog === 'individualDirector' && renderIndividualDirectorFilters()}
          {renderCardMessage('individualDirector')}
        </div>

         {/* Listado de Estudiantes */}
        <div className="report-card" style={{ borderTop: '4px solid #7A1117', boxShadow: '0 8px 32px rgba(122,17,23,0.10)' }}>
          <div className="report-card-header">
            <h3 style={{ color: '#7A1117', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Reporte Institucional de Estudiantes en Modalidades de Grado
</h3>
          </div>
          <p className="report-description" style={{ fontWeight: 500, color: '#5d0d12' }}>
            Genera un reporte institucional que lista a los estudiantes inscritos en modalidades de grado.
          </p>
          <div className="report-stats">
            
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Estudiantes</span>
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Ordenamiento</span>
            
          </div>
          <div className="report-actions">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-filters"
                style={{ fontWeight: 600, borderColor: '#7A1117', color: '#7A1117' }}
                onClick={() => setOpenFilterDialog(openFilterDialog === 'studentListing' ? null : 'studentListing')}
                disabled={loading}
              >
                {openFilterDialog === 'studentListing' ? 'Ocultar' : 'Configurar'} Filtros
              </button>
              <button
                className="btn-primary"
                style={{ fontWeight: 700 }}
                onClick={handleDownloadStudentListing}
                disabled={loading}
              >
                {loading ? <span className="spinner-small"></span> : ''} Descargar PDF
              </button>
            </div>
          </div>
          {openFilterDialog === 'studentListing' && renderStudentListingFilters()}
          {renderCardMessage('studentListing')}
        </div>

        {/* Trazabilidad por Estudiante/Modalidad */}
        <div className="report-card" style={{ borderTop: '4px solid #7A1117', boxShadow: '0 8px 32px rgba(122,17,23,0.10)' }}>
          <div className="report-card-header">
            <h3 style={{ color: '#7A1117', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>
              Reporte de Trazabilidad por Estudiante y Modalidad
            </h3>
          </div>
          <p className="report-description" style={{ fontWeight: 500, color: '#5d0d12' }}>
            Genera el reporte PDF de trazabilidad de modalidad buscando primero al estudiante por nombre y usando su studentId.
          </p>
          <div className="report-stats">
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Búsqueda por nombre</span>
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Selección por studentId</span>
          </div>
          <div className="report-actions">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-filters"
                style={{ fontWeight: 600, borderColor: '#7A1117', color: '#7A1117' }}
                onClick={() => setOpenFilterDialog(openFilterDialog === 'studentTraceability' ? null : 'studentTraceability')}
                disabled={loading}
              >
                {openFilterDialog === 'studentTraceability' ? 'Ocultar' : 'Configurar'} Filtros
              </button>
              {openFilterDialog !== 'studentTraceability' && (
                <button
                  className="btn-primary"
                  style={{ fontWeight: 700 }}
                  onClick={handleDownloadStudentTraceability}
                  disabled={loading}
                >
                  {loading ? <span className="spinner-small"></span> : ''} Descargar PDF
                </button>
              )}
            </div>
          </div>
          {openFilterDialog === 'studentTraceability' && renderStudentTraceabilityFilters()}
          {renderCardMessage('studentTraceability')}
        </div>


        

       

        {/* Calendario de Sustentaciones */}
        <div className="report-card" style={{ borderTop: '4px solid #7A1117', boxShadow: '0 8px 32px rgba(122,17,23,0.10)' }}>
          <div className="report-card-header">
          
            <h3 style={{ color: '#7A1117', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Reporte Institucional de Calendario de Sustentaciones y Evaluaciones
</h3>
          </div>
          <p className="report-description" style={{ fontWeight: 500, color: '#5d0d12' }}>
            Genera un reporte institucional completo del calendario de sustentaciones de modalidades de grado, mostrando fechas programadas, estado de cada defensa, jurado asignado y alertas importantes.
          </p>
          <div className="report-stats">
            
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Próximas defensas</span>
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Alertas</span>
            <span style={{ background: '#f8e9eb', color: '#7A1117', fontWeight: 700 }}>Calendario</span>
          </div>
          <div className="report-actions">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-filters"
                style={{ fontWeight: 600, borderColor: '#7A1117', color: '#7A1117' }}
                onClick={() => setOpenFilterDialog(openFilterDialog === 'calendar' ? null : 'calendar')}
                disabled={loading}
              >
                 {openFilterDialog === 'calendar' ? 'Ocultar' : 'Configurar'} Filtros
              </button>
              <button
                className="btn-primary"
                style={{ fontWeight: 700 }}
                onClick={handleDownloadCalendar}
                disabled={loading}
              >
                {loading ? <span className="spinner-small"></span> : ''} Descargar PDF
              </button>
            </div>
          </div>
          {openFilterDialog === 'calendar' && renderCalendarFilters()}
          {renderCardMessage('calendar')}
        </div>

       
        

        
      </div>

     
    </div>
  );
};

export default CommitteeReports;