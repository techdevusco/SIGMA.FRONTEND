import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentsPendingModalities } from "../../services/committeeService";
import "../../styles/council/studentpending.css";

const AVAILABLE_STATUSES = [
  { value: "READY_FOR_PROGRAM_CURRICULUM_COMMITTEE", label: "Listo para comité de currículo de programa" },
  { value: "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE", label: "En Revisión - Comité de currículo de programa" },
  { value: "CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE", label: "Correcciones Solicitadas - Comité de currículo de programa" },
  { value: "PROPOSAL_APPROVED", label: "Propuesta Aprobada" },
  { value: "DEFENSE_SCHEDULED", label: "Sustentación Programada" },
  { value: "DEFENSE_COMPLETED", label: "Sustentación Completada" },
  { value: "GRADED_APPROVED", label: "Calificado - Aprobado" },
  { value: "GRADED_FAILED", label: "Calificado - Reprobado" },
  { value: "CANCELLATION_REQUESTED", label: "Cancelación Solicitada" },
  { value: "CANCELLATION_REJECTED", label: "Cancelación Rechazada" },
  { value: "MODALITY_CANCELLED", label: "Modalidad Cancelada" },
  { value: "CANCELLED_WITHOUT_REPROVAL", label: "Cancelada Sin Reprobación" },
  { value: "MODALITY_CLOSED", label: "Modalidad Cerrada" },
];

export default function CommitteeDashboard() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [tempStatuses, setTempStatuses] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const navigate = useNavigate();

  // Cargar estudiantes cuando cambien los estados
  useEffect(() => {
    fetchStudents();
  }, [selectedStatuses]);

  // Filtro local por nombre y email
  useEffect(() => {
    applyLocalFilter();
  }, [students, searchName]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await getStudentsPendingModalities(selectedStatuses);
      console.log("✅ Estudiantes obtenidos:", res);
      setStudents(res);
      setMessage("");
    } catch (err) {
      console.error("❌ Error al obtener estudiantes:", err);
      setMessage(
        err.response?.data?.message ||
          "Error al cargar estudiantes pendientes"
      );
    } finally {
      setLoading(false);
    }
  };

  const applyLocalFilter = () => {
    let result = [...students];
    if (searchName.trim()) {
      const searchLower = searchName.toLowerCase();
      result = result.filter((s) => {
        const fullName = (s.studentName || "").toLowerCase();
        const email = (s.studentEmail || "").toLowerCase();
        return fullName.includes(searchLower) || email.includes(searchLower);
      });
    }
    setFilteredStudents(result);
  };

  // Ya no se usa handleStatusToggle, ahora se usa tempStatuses y botón aplicar

  // Manejar búsqueda por nombre
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchName(searchInput);
  };

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setSelectedStatuses([]);
    setSearchName("");
    setSearchInput("");
  };

  // Función helper para determinar la clase del badge según el estado
  const getStatusClass = (status) => {
    switch (status) {
      case "READY_FOR_PROGRAM_CURRICULUM_COMMITTEE":
        return "ready";
      
      case "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE":
        return "in-review";
      
      case "CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE":
        return "corrections";
      
      case "PROPOSAL_APPROVED":
        return "approved";
      
      case "DEFENSE_SCHEDULED":
      case "DEFENSE_COMPLETED":
        return "defense";
      
      case "GRADED_APPROVED":
        return "graded-approved";
      
      case "GRADED_FAILED":
        return "graded-failed";
      
      case "CANCELLATION_REQUESTED":
      case "CANCELLATION_REJECTED":
        return "pending";
      
      case "MODALITY_CANCELLED":
      case "CANCELLED_WITHOUT_REPROVAL":
      case "MODALITY_CLOSED":
        return "cancelled";
      
      default:
        return "pending";
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      "MODALITY_SELECTED": "Modalidad Seleccionada",
      "UNDER_REVIEW_PROGRAM_HEAD": "En Revisión por Jefe de Programa",
      "CORRECTIONS_REQUESTED_PROGRAM_HEAD": "Correcciones Solicitadas por Jefe",
      "CORRECTIONS_SUBMITTED": "Correcciones Enviadas",
      "CORRECTIONS_APPROVED": "Correcciones Aprobadas",
      "CORRECTIONS_REJECTED_FINAL": "Correcciones Rechazadas (Final)",
      "READY_FOR_PROGRAM_CURRICULUM_COMMITTEE": "Pendiente Comité de Currículo",
      "UNDER_REVIEW_PROGRAM_CURRICULUM_COMMITTEE": "En Revisión por Comité de Currículo",
      "CORRECTIONS_REQUESTED_PROGRAM_CURRICULUM_COMMITTEE": "Correcciones Solicitadas por Comité",
      "PROPOSAL_APPROVED": "Propuesta Aprobada",
      "DEFENSE_REQUESTED_BY_PROJECT_DIRECTOR": "Sustentación Propuesta por Director",
      "DEFENSE_SCHEDULED": "Sustentación Programada",
      "EXAMINERS_ASSIGNED": "Jueces Asignados",
      "READY_FOR_EXAMINERS": "Listo para Jueces",
      "CORRECTIONS_REQUESTED_EXAMINERS": "Correcciones Solicitadas por Jueces",
      "READY_FOR_DEFENSE": "Listo para Sustentación",
      "FINAL_REVIEW_COMPLETED": "Revisión Final Completada",
      "DEFENSE_COMPLETED": "Sustentación Completada",
      "UNDER_EVALUATION_PRIMARY_EXAMINERS": "En Evaluación por Jueces Principales",
      "DISAGREEMENT_REQUIRES_TIEBREAKER": "Desacuerdo - Requiere Tercer Juez",
      "UNDER_EVALUATION_TIEBREAKER": "En Evaluación por Tercer Juez",
      "EVALUATION_COMPLETED": "Evaluación Completada",
      "GRADED_APPROVED": "Aprobado",
      "GRADED_FAILED": "Reprobado",
      "MODALITY_CLOSED": "Modalidad Cerrada",
      "SEMINAR_CANCELED": "Seminario Cancelado",
      "MODALITY_CANCELLED": "Modalidad Cancelada",
      "CANCELLATION_REQUESTED": "Cancelación Solicitada",
      "CANCELLATION_APPROVED_BY_PROJECT_DIRECTOR": "Cancelación Aprobada por Director",
      "CANCELLATION_REJECTED_BY_PROJECT_DIRECTOR": "Cancelación Rechazada por Director",
      "CANCELLED_WITHOUT_REPROVAL": "Cancelada sin Calificación",
      "CANCELLATION_REJECTED": "Cancelación Rechazada",
      "CANCELLED_BY_CORRECTION_TIMEOUT": "Cancelada por Timeout de Correcciones",
    };
    return statusMap[status] || status;
  };

  if (loading && students.length === 0) {
      return (
        <div className="students-pending-loading" style={{
          background: 'linear-gradient(135deg, #f9f6e7 0%, #f7f7fa 60%, #e8ebf0 100%)',
          borderRadius: '18px',
          boxShadow: '0 8px 40px 0 rgba(122, 17, 23, 0.10)',
          margin: '2rem auto',
          maxWidth: '900px',
          padding: '3rem 2rem',
          fontFamily: 'Georgia, Times New Roman, serif',
          color: '#7A1117',
          fontWeight: 700,
          fontSize: '1.25rem',
          letterSpacing: '0.5px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            fontSize: '3.5rem',
            marginBottom: '1.2rem',
            color: '#D5CBA0',
            textShadow: '0 2px 8px #7A111733',
          }}>🎓</div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            color: '#7A1117',
            marginBottom: '0.5rem',
          }}>Cargando estudiantes...</div>
          <div style={{
            fontSize: '1rem',
            color: '#a01820',
            marginTop: '0.5rem',
          }}>Por favor espera, estamos consultando la información del sistema institucional.</div>
        </div>
      );
  }

    return (
      <div className="students-pending-container">
        {/* Header */}
        <div className="students-pending-header" style={{
          background: 'linear-gradient(90deg, #7A1117 0%, #D5CBA0 100%)',
          color: '#fff',
          borderRadius: '18px 18px 0 0',
          boxShadow: '0 8px 32px rgba(122, 17, 23, 0.10)',
          padding: '2.5rem 2rem 2rem 2rem',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          borderBottom: 'none',
        }}>
          <h2 className="students-pending-title" style={{
            fontSize: '2.5rem',
            color: '#fff',
            margin: 0,
            fontFamily: 'Georgia, Times New Roman, serif',
            fontWeight: 900,
            letterSpacing: '0.7px',
            textShadow: '0 2px 8px #7A111733',
          }}>
            Gestión de Modalidades <span style={{color:'#D5CBA0'}}>– Comité de Currículo</span>
          </h2>
          <p className="students-pending-subtitle" style={{
            color: '#f7f7fa',
            marginTop: '0.7rem',
            fontSize: '1.15rem',
            fontWeight: 600,
            letterSpacing: '0.2px',
            textShadow: '0 1px 4px #7A111733',
          }}>
            Revisa y valida la documentación presentada, asigna directores de proyecto y coordina la programación de sustentaciones conforme a los lineamientos académicos vigentes.
          </p>
          <div style={{
            marginTop: '1.2rem',
            background: 'rgba(213,203,160,0.13)',
            color: '#7A1117',
            borderRadius: '8px',
            padding: '0.7rem 1.2rem',
            fontWeight: 700,
            fontSize: '1rem',
            boxShadow: '0 2px 8px rgba(122,17,23,0.08)',
            display: 'inline-block',
          }}>
            <span style={{marginRight:'0.5rem'}}></span>
            Panel  para gestión institucional de modalidades
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="students-pending-message error" style={{
            backgroundColor: '#fde1e1',
            color: '#7A1117',
            borderLeft: '4px solid #7A1117',
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            animation: 'slideDown 0.3s ease-out',
          }}>{message}</div>
        )}

      {/* Filtros */}
      <div className="students-pending-filters premium-filters" style={{
        display: 'flex',
        gap: '2rem',
        marginBottom: '2.2rem',
        flexWrap: 'wrap',
        alignItems: 'stretch',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f9f6e7 0%, #f7f7fa 60%, #e8ebf0 100%)',
        borderRadius: '18px',
        boxShadow: '0 8px 40px 0 rgba(122, 17, 23, 0.10)',
        border: '1.5px solid #D5CBA0',
      }}>
        <div className="filter-section filter-card" style={{
          minWidth: '370px',
          maxWidth: '520px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          background: '#fff',
          borderRadius: '14px',
          boxShadow: '0 2px 8px rgba(122,17,23,0.08)',
          border: '1px solid #D5CBA0',
          padding: '1.3rem 1.5rem',
        }}>
          <div className="filter-header" style={{marginBottom:'0.7rem',display:'flex',alignItems:'center',gap:'0.7rem'}}>
            <span className="filter-icon" style={{fontSize:'1.7rem',color:'#7A1117',textShadow:'0 1px 4px #D5CBA0'}}>🔎</span>
            <label className="filter-label" style={{fontSize:'1.25rem',fontWeight:900,letterSpacing:'0.5px'}}>Buscar por nombre o email</label>
          </div>
          <form onSubmit={handleSearchSubmit} className="search-form" style={{marginTop:'0.5rem'}}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar estudiante..."
              className="search-input"
              style={{background:'#f8f6ef',border:'2px solid #D5CBA0',borderRadius:'8px',fontSize:'1.05rem',fontWeight:500,color:'#7A1117',boxShadow:'0 2px 8px rgba(122,17,23,0.08)'}}
            />
            <button type="submit" className="search-button" style={{background:'#7A1117',color:'#fff',fontWeight:700,fontSize:'1.05rem',borderRadius:'8px',boxShadow:'0 2px 8px rgba(122,17,23,0.08)'}}>Buscar</button>
          </form>
        </div>

        <div className="filter-section filter-card" style={{
          minWidth: '370px',
          maxWidth: '520px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          background: '#fff',
          borderRadius: '14px',
          boxShadow: '0 2px 8px rgba(122,17,23,0.08)',
          border: '1px solid #D5CBA0',
          padding: '1.3rem 1.5rem',
        }}>
          <div className="filter-header" style={{marginBottom:'0.7rem',display:'flex',alignItems:'center',gap:'0.7rem'}}>
            <span className="filter-icon" style={{fontSize:'1.7rem',color:'#7A1117',textShadow:'0 1px 4px #D5CBA0'}}>📋</span>
            <label className="filter-label" style={{fontSize:'1.25rem',fontWeight:900,letterSpacing:'0.5px'}}>Filtrar por estado</label>
          </div>
          <div style={{background:'#f8f6ef',border:'2px solid #D5CBA0',borderRadius:'8px',padding:'0.7rem 0.7rem',marginBottom:'0.7rem',boxShadow:'0 2px 8px rgba(122,17,23,0.08)'}}>
            <select
              className="status-dropdown"
              multiple
              value={tempStatuses}
              onChange={e => {
                const options = Array.from(e.target.selectedOptions);
                const values = options.map(opt => opt.value);
                setTempStatuses(values);
              }}
              style={{
                background:'transparent',
                color:'#7A1117',
                fontWeight:700,
                fontSize:'1.05rem',
                border:'none',
                minHeight:'120px',
                maxHeight:'180px',
                width:'100%',
                overflowY:'auto',
                boxShadow:'none',
              }}
            >
              <option value="">Todos los estados</option>
              {AVAILABLE_STATUSES.map((status) => (
                <option key={status.value} value={status.value} style={{color:'#7A1117',fontWeight:700}}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <small className="status-dropdown-hint" style={{marginBottom:'0.5rem',color:'#7A1117',fontWeight:500}}>Mantén Ctrl (Windows) o Cmd (Mac) para seleccionar varios</small>
          <button
            type="button"
            className="apply-statuses-button"
            style={{marginTop:'0.5rem',fontSize:'1.05rem',fontWeight:700,background:'#7A1117',color:'#fff',borderRadius:'8px',boxShadow:'0 2px 8px rgba(122,17,23,0.08)'}}
            onClick={() => setSelectedStatuses(tempStatuses)}
          >
            Aplicar estados
          </button>
        </div>

        {(selectedStatuses.length > 0 || searchName) && (
          <div className="filter-divider"></div>
        )}

        {(selectedStatuses.length > 0 || searchName) && (
          <button
            onClick={handleClearFilters}
            className="clear-filters-button"
            style={{fontSize:'1.05rem',fontWeight:700,background:'#fff',color:'#7A1117',border:'2px solid #D5CBA0',borderRadius:'8px',boxShadow:'0 2px 8px rgba(122,17,23,0.08)'}}
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {/* FILTROS ACTIVOS */}
      {(selectedStatuses.length > 0 || searchName) && (
        <div className="active-filters premium-active-filters">
          <strong className="active-filters-title">Filtros activos:</strong>
          {searchName && (
            <span className="filter-tag filter-tag-premium">
              <span className="filter-tag-icon">🔎</span> Nombre: "{searchName}"
            </span>
          )}
          {selectedStatuses.map((status) => (
            <span key={status} className="filter-tag filter-tag-premium">
              <span className="filter-tag-icon">📋</span> {getStatusLabel(status)}
            </span>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredStudents.length === 0 ? (
        <div className="students-pending-empty" style={{
          background: 'linear-gradient(135deg, #f9f6e7 0%, #D5CBA0 60%, #e8ebf0 100%)',
          borderRadius: '16px',
          padding: '4rem 2rem',
          textAlign: 'center',
          boxShadow: '0 15px 35px rgba(122,17,23,0.10)',
          border: '1.5px solid #D5CBA0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div className="students-pending-empty-icon" style={{
            fontSize: '4.5rem',
            marginBottom: '1.5rem',
            color: '#7A1117',
            textShadow: '0 2px 8px #D5CBA0',
          }}>
            {selectedStatuses.length > 0 || searchName ? "🔍" : "🎓"}
          </div>
          <p className="students-pending-empty-text" style={{
            fontSize: '1.35rem',
            color: '#7A1117',
            fontWeight: 700,
            margin: 0,
            fontFamily: 'Georgia, Times New Roman, serif',
          }}>
            {selectedStatuses.length > 0 || searchName
              ? "No se encontraron estudiantes con estos filtros"
              : "¡No hay estudiantes pendientes!"}
          </p>
          <p className="students-pending-empty-subtext" style={{
            fontSize: '1.05rem',
            color: '#D5CBA0',
            marginTop: '0.5rem',
            fontWeight: 600,
            fontFamily: 'Georgia, Times New Roman, serif',
          }}>
            {selectedStatuses.length > 0 || searchName
              ? "Intenta ajustar los criterios de búsqueda"
              : "Todas las solicitudes han sido procesadas"}
          </p>
        </div>
      ) : (
        <div className="students-pending-table-container" style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 15px 35px rgba(122,17,23,0.13)',
          overflow: 'hidden',
          animation: 'fadeIn 0.4s ease-out',
          border: '1.5px solid #D5CBA0',
        }}>
          <div className="results-count" style={{
            fontWeight: 700,
            color: '#7A1117',
            fontSize: '1.1rem',
            padding: '1rem 1.2rem 0.5rem 1.2rem',
            fontFamily: 'Georgia, Times New Roman, serif',
          }}>
            {filteredStudents.length === students.length
              ? `Total: ${students.length} estudiante${students.length !== 1 ? "s" : ""}`
              : `Mostrando ${filteredStudents.length} de ${students.length} estudiante${students.length !== 1 ? "s" : ""}`
            }
          </div>
          <table className="students-pending-table" style={{
            width: '100%',
            borderCollapse: 'collapse',
            boxShadow: '0 2px 8px rgba(122,17,23,0.10)',
            fontFamily: 'Georgia, Times New Roman, serif',
          }}>
            <thead style={{
              background: 'linear-gradient(135deg, #7A1117 0%, #D5CBA0 100%)',
              color: 'white',
            }}>
              <tr>
                <th style={{padding:'0.95rem 1rem',textAlign:'left',fontSize:'0.95rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.4px',borderBottom:'3px solid #D5CBA0',whiteSpace:'nowrap'}}>Estudiante</th>
                <th style={{padding:'0.95rem 1rem',textAlign:'left',fontSize:'0.95rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.4px',borderBottom:'3px solid #D5CBA0',whiteSpace:'nowrap'}}>Email</th>
                <th style={{padding:'0.95rem 1rem',textAlign:'left',fontSize:'0.95rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.4px',borderBottom:'3px solid #D5CBA0',whiteSpace:'nowrap'}}>Modalidad</th>
                <th style={{padding:'0.95rem 1rem',textAlign:'left',fontSize:'0.95rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.4px',borderBottom:'3px solid #D5CBA0',whiteSpace:'nowrap'}}>Estado</th>
                <th style={{padding:'0.95rem 1rem',textAlign:'left',fontSize:'0.95rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.4px',borderBottom:'3px solid #D5CBA0',whiteSpace:'nowrap'}}>Fecha</th>
                <th style={{padding:'0.95rem 1rem',textAlign:'left',fontSize:'0.95rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.4px',borderBottom:'3px solid #D5CBA0',whiteSpace:'nowrap'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.studentModalityId} style={{borderBottom:'1px solid #e0e0e0',transition:'all 0.3s ease',background:'#fff'}}>
                  <td data-label="Estudiante">
                    <span className="student-name" style={{fontWeight:600,color:'#7A1117',fontSize:'1.05rem'}}>{s.studentName}</span>
                  </td>
                  <td data-label="Email">
                    <span className="student-email" style={{color:'#555',fontWeight:500,fontSize:'0.98rem'}}>{s.studentEmail}</span>
                  </td>
                  <td data-label="Modalidad">
                    <span className="modality-name" style={{color:'#555',fontWeight:500,fontSize:'0.98rem',maxWidth:'250px',wordBreak:'break-word',overflowWrap:'break-word'}}>{s.modalityName}</span>
                  </td>
                  <td data-label="Estado">
                    <span
                      className={`status-badge ${getStatusClass(s.currentStatus)}`}
                      style={{display:'inline-block',padding:'0.4rem 1rem',borderRadius:'20px',fontSize:'0.92rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.3px',background:'#D5CBA0',color:'#7A1117',border:'1px solid #D5CBA0'}}
                    >
                      {getStatusLabel(s.currentStatus)}
                    </span>
                  </td>
                  <td data-label="Última Actualización">
                    <span className="last-updated" style={{color:'#7A1117',fontWeight:600,fontSize:'0.98rem'}}>
                      {new Date(s.lastUpdatedAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <button
                      onClick={() => navigate(`/comite/students/${s.studentModalityId}`)
                      }
                      className="view-profile-button"
                      style={{padding:'0.7rem 0.9rem',background:'#7A1117',color:'#fff',border:'none',borderRadius:'8px',fontSize:'0.92rem',fontWeight:600,cursor:'pointer',transition:'all 0.3s ease',boxShadow:'0 2px 6px rgba(122,17,23,0.3)',whiteSpace:'nowrap',marginLeft:'auto',marginRight:'1rem'}}
                    >
                      Ver perfil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}