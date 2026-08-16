import { useEffect, useState } from "react";
import {
  getPendingDistinctionProposals,
  acceptDistinctionProposal,
  rejectDistinctionProposal,
} from "../../services/committeeService";
import { getErrorMessage } from "../../utils/errorUtils";
import "../../styles/council/distinctionproposals.css";

// ─── helpers ────────────────────────────────────────────────────────────────

function getDistinctionClass(proposedDistinction) {
  if (!proposedDistinction) return "";
  const d = proposedDistinction.toLowerCase();
  if (d.includes("laureate") || d.includes("laureada")) return "laureada";
  if (d.includes("meritori")) return "meritoria";
  return "";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function translateMention(mention) {
  if (!mention) return "—";
  const map = {
    MERITORIOUS: "Meritoria",
    LAUREATE: "Laureada",
    NONE: "Sin distinción",
  };
  return map[mention] ?? mention;
}

function translateExaminerType(type) {
  if (!type) return "";
  const map = {
    INTERNAL: "Interno",
    EXTERNAL: "Externo",
    TIEBREAKER: "Dirimente",
  };
  return map[type] ?? type;
}

// ─── Accept Modal ─────────────────────────────────────────────────────────────

function AcceptModal({ proposal, onConfirm, onCancel, loading }) {
  const [notes, setNotes] = useState("");

  return (
    <div className="distinction-modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="distinction-modal">
        <div className="distinction-modal-header accept">
          <h2>Aceptar Distincion Honorifica</h2>
          <button className="distinction-modal-close" onClick={onCancel} disabled={loading}>
            x
          </button>
        </div>
        <div className="distinction-modal-body">
          <div className="distinction-modal-info">
            <strong>Estudiante:</strong> {proposal.studentName}
            <br />
            <strong>Distincion propuesta:</strong> {proposal.proposedDistinctionLabel}
            <br />
            <strong>Nota final:</strong> {proposal.finalGrade ?? "—"}
          </div>
          <label htmlFor="accept-notes">
            Observaciones del comite (opcional)
          </label>
          <textarea
            id="accept-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Puede agregar observaciones o comentarios adicionales..."
            disabled={loading}
          />
        </div>
        <div className="distinction-modal-footer">
          <button className="btn-modal-cancel" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button
            className="btn-modal-confirm-accept"
            onClick={() => onConfirm(notes.trim() || null)}
            disabled={loading}
          >
            {loading ? "Procesando..." : "Aceptar distincion"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

function RejectModal({ proposal, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");

  return (
    <div className="distinction-modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="distinction-modal">
        <div className="distinction-modal-header reject">
          <h2>Rechazar Distincion Honorifica</h2>
          <button className="distinction-modal-close" onClick={onCancel} disabled={loading}>
            x
          </button>
        </div>
        <div className="distinction-modal-body">
          <div className="distinction-modal-info">
            <strong>Estudiante:</strong> {proposal.studentName}
            <br />
            <strong>Distincion propuesta:</strong> {proposal.proposedDistinctionLabel}
            <br />
            <strong>Nota final:</strong> {proposal.finalGrade ?? "—"}
          </div>
          <label htmlFor="reject-reason">
            Razon del rechazo <span style={{ color: "#c0392b" }}>*</span>
          </label>
          <textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ingrese la razon por la cual se rechaza la distincion propuesta..."
            disabled={loading}
          />
        </div>
        <div className="distinction-modal-footer">
          <button className="btn-modal-cancel" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button
            className="btn-modal-confirm-reject"
            onClick={() => onConfirm(reason.trim())}
            disabled={loading || !reason.trim()}
          >
            {loading ? "Procesando..." : "Rechazar distincion"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Proposal Card ────────────────────────────────────────────────────────────

function ProposalCard({ proposal, onAccept, onReject }) {
  const [showEvaluations, setShowEvaluations] = useState(false);
  const dClass = getDistinctionClass(proposal.proposedDistinction);

  return (
    <div className={`distinction-card ${dClass}`}>
      {/* Header */}
      <div className="distinction-card-header">
        <div className="distinction-card-student">
          <h3>{proposal.studentName}</h3>
          <p>
            {proposal.studentCode && <>Codigo: {proposal.studentCode} &nbsp;|&nbsp;</>}
            {proposal.studentEmail}
          </p>
        </div>
        <span className={`distinction-badge ${dClass}`}>
          {proposal.proposedDistinctionLabel ?? proposal.proposedDistinction}
        </span>
      </div>

      {/* Body */}
      <div className="distinction-card-body">
        <div className="distinction-info-grid">
          <div className="distinction-info-item">
            <span className="distinction-info-label">Programa academico</span>
            <span className="distinction-info-value">{proposal.academicProgram}</span>
          </div>
          <div className="distinction-info-item">
            <span className="distinction-info-label">Modalidad</span>
            <span className="distinction-info-value">{proposal.modalityName}</span>
          </div>
          <div className="distinction-info-item">
            <span className="distinction-info-label">Director de proyecto</span>
            <span className="distinction-info-value">{proposal.projectDirector ?? "—"}</span>
          </div>
          <div className="distinction-info-item">
            <span className="distinction-info-label">Nota final</span>
            <span className="distinction-info-value distinction-grade-value">
              {proposal.finalGrade ?? "—"}
            </span>
          </div>
          <div className="distinction-info-item">
            <span className="distinction-info-label">Ultima actualizacion</span>
            <span className="distinction-info-value">{formatDate(proposal.lastUpdatedAt)}</span>
          </div>
        </div>

        {/* Evaluations toggle */}
        {proposal.examinerEvaluations && proposal.examinerEvaluations.length > 0 && (
          <>
            <button
              className="distinction-evaluations-toggle"
              onClick={() => setShowEvaluations((prev) => !prev)}
            >
              <span>Evaluaciones de los jurados ({proposal.examinerEvaluations.length})</span>
              <span className={`toggle-arrow ${showEvaluations ? "open" : ""}`}>&#9660;</span>
            </button>

            {showEvaluations && (
              <div className="distinction-evaluations-panel">
                {proposal.examinerEvaluations.map((ev, idx) => (
                  <div key={idx} className="distinction-examiner-item">
                    <div className="distinction-examiner-name">{ev.examinerName}</div>
                    <div className="distinction-examiner-type">
                      {translateExaminerType(ev.examinerType)}
                    </div>
                    <div className="distinction-examiner-row">
                      <span>
                        <strong>Distincion propuesta:</strong>{" "}
                        {translateMention(ev.proposedMention)}
                      </span>
                      {ev.grade != null && (
                        <span>
                          <strong>Nota:</strong> {ev.grade}
                        </span>
                      )}
                    </div>
                    {ev.observations && (
                      <div className="distinction-observations">{ev.observations}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="distinction-card-actions">
        <button
          className="btn-reject-distinction"
          onClick={() => onReject(proposal)}
        >
          Rechazar distincion
        </button>
        <button
          className="btn-accept-distinction"
          onClick={() => onAccept(proposal)}
        >
          Aceptar distincion
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DistinctionProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [acceptModal, setAcceptModal] = useState(null); // proposal object
  const [rejectModal, setRejectModal] = useState(null); // proposal object

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPendingDistinctionProposals();
      setProposals(data.pendingDistinctionProposals ?? []);
    } catch (err) {
      console.error("Error al obtener propuestas de distincion:", err);
      setError(
        getErrorMessage(err, "Error al cargar las propuestas de distincion honorifica")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptConfirm = async (notes) => {
    if (!acceptModal) return;
    setActionLoading(true);
    try {
      await acceptDistinctionProposal(acceptModal.studentModalityId, notes);
      setSuccess(
        `Distincion honorifica aceptada para ${acceptModal.studentName}. La modalidad queda APROBADA.`
      );
      setAcceptModal(null);
      await fetchProposals();
      setTimeout(() => setSuccess(""), 6000);
    } catch (err) {
      console.error("Error al aceptar distincion:", err);
      setError(getErrorMessage(err, "Error al aceptar la distincion"));
      setAcceptModal(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectModal) return;
    if (!reason) {
      setError("Debe proporcionar una razon para rechazar la distincion");
      return;
    }
    setActionLoading(true);
    try {
      await rejectDistinctionProposal(rejectModal.studentModalityId, reason);
      setSuccess(
        `Distincion rechazada para ${rejectModal.studentName}. La modalidad queda APROBADA sin distincion especial.`
      );
      setRejectModal(null);
      await fetchProposals();
      setTimeout(() => setSuccess(""), 6000);
    } catch (err) {
      console.error("Error al rechazar distincion:", err);
      setError(getErrorMessage(err, "Error al rechazar la distincion"));
      setRejectModal(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="distinction-container">
        <div className="distinction-loading">Cargando propuestas de distincion...</div>
      </div>
    );
  }

  return (
    <div className="distinction-container">
      {/* Header */}
      <div className="distinction-header">
        <div className="distinction-header-text">
          <h1>Propuestas de Distincion Honorifica</h1>
          <p>
            Los jurados han propuesto unanimemente una distincion para estas modalidades.
            Revisa las evaluaciones y decide si se aprueba o rechaza.
          </p>
        </div>
        {proposals.length > 0 && (
          <div className="distinction-counter-badge">
            {proposals.length} pendiente{proposals.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="distinction-message error">
          <span>{error}</span>
          <button onClick={() => setError("")}>x</button>
        </div>
      )}
      {success && (
        <div className="distinction-message success">
          <span>{success}</span>
          <button onClick={() => setSuccess("")}>x</button>
        </div>
      )}

      {/* Empty state */}
      {proposals.length === 0 ? (
        <div className="distinction-empty">
          <div className="distinction-empty-icon">—</div>
          <h3>Sin propuestas pendientes</h3>
          <p>
            No hay modalidades con propuestas de distincion honorifica pendientes de
            revision en este momento.
          </p>
        </div>
      ) : (
        <div className="distinction-grid">
          {proposals.map((p) => (
            <ProposalCard
              key={p.studentModalityId}
              proposal={p}
              onAccept={(prop) => setAcceptModal(prop)}
              onReject={(prop) => setRejectModal(prop)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {acceptModal && (
        <AcceptModal
          proposal={acceptModal}
          onConfirm={handleAcceptConfirm}
          onCancel={() => setAcceptModal(null)}
          loading={actionLoading}
        />
      )}
      {rejectModal && (
        <RejectModal
          proposal={rejectModal}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectModal(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
