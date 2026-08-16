export function getModalityRoute(role, studentModalityId) {
  if (!studentModalityId) return null;
  switch (role) {
    case "PROGRAM_HEAD":
      return `/jefeprograma/students/${studentModalityId}`;
    case "PROGRAM_CURRICULUM_COMMITTEE":
      return `/comite/students/${studentModalityId}`;
    case "PROJECT_DIRECTOR":
      return `/project-director/students/${studentModalityId}`;
    case "EXAMINER":
      return `/examiner/student/${studentModalityId}`;
    default:
      return null;
  }
}