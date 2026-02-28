import { Routes, Route, Navigate } from "react-router-dom";

// Públicas
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";

// Protección
import ProtectedRoute from "./ProtectedRoute";

// Layouts
import StudentLayout from "../layouts/StudentLayout";
import SecretaryLayout from "../layouts/SecretaryLayout";
import ProgramHeadLayout from "../layouts/ProgramHeadLayout";
import CouncilLayout from "../layouts/CouncilLayout";
import AdminLayout from "../layouts/AdminLayout";
import DirectorLayout from "../layouts/DirectorLayout";
import ExaminerLayout from "../layouts/ExaminerLayout";

// STUDENT
import StudentDashboard from "../pages/student/Dashboard";
import StudentModalities from "../pages/student/Modalities";
import StudentDocuments from "../pages/student/Documents";
import StudentStatus from "../pages/student/Status";
import StudentCancellation from "../pages/student/Cancellation";
import StudentProfile from "../pages/student/StudentProfile";
import Notifications from "../pages/student/Notifications";
import SeminarSelection from "../pages/student/SeminarSelection";

// PROGRAM HEAD 
import StudentsPending from "../pages/programhead/StudentPending";
import StudentProfileSecretary from "../pages/programhead/StudentProfile";
import SeminarList from "../pages/programhead/SeminarList";
import SeminarDetail from "../pages/programhead/SeminarDetail";
import SeminarForm from "../pages/programhead/SeminarForm";

// COMMITTEE
import CouncilDashboard from "../pages/committee/councilDashboard";
import CouncilStudentProfile from "../pages/committee/councilStudentProfile";
import CancellationRequests from "../pages/committee/CancellationRequests";
import CommitteeDefenseProposals from "../pages/committee/defenseProposals";
import CommitteeReports from "../pages/committee/committeeReports";


// DIRECTOR
import DirectorDashboard from "../pages/director/DirectorDashboard";
import DirectorStudentProfile from "../pages/director/DirectorStudentProfile";
import DirectorCancellationRequests from "../pages/director/DirectorCancellationRequest";

// EXAMINER
import ExaminerDashboard from "../pages/examiner/examinerDashboard";
import ExaminerStudentProfile from "../pages/examiner/examinerStudentProfile";

// SHARED
import NotificationsPage from "../pages/shared/NotificationsPage";

// ADMIN
import Roles from "../pages/admin/Roles";
import Permissions from "../pages/admin/Permissions";
import Users from "../pages/admin/User";
import Faculties from "../pages/admin/Faculties";
import Programs from "../pages/admin/Programs";
import Modalities from "../pages/admin/Modalities";
import Requirements from "../pages/admin/Requirements";
import Documents from "../pages/admin/Documents";
import Assignments from "../pages/admin/Assignments";
import ProgramDegreeModalities from "../pages/admin/ProgramDegreeModalities";

function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* STUDENT */}
      <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="modalities" element={<StudentModalities />} />
          <Route path="documents" element={<StudentDocuments />} />
          <Route path="status" element={<StudentStatus />} />
          <Route path="cancellation" element={<StudentCancellation />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="seminars" element={<SeminarSelection />} /> 

        </Route>
      </Route>

    {/* SECRETARY / PROGRAM HEAD */}
      <Route element={<ProtectedRoute allowedRoles={["PROGRAM_HEAD"]} />}>
        <Route path="/jefeprograma" element={<ProgramHeadLayout />}>
          <Route index element={<StudentsPending />} />
          <Route
            path="students/:studentModalityId"
            element={<StudentProfileSecretary />}
          />
          {/* ✅ RUTAS DE DIPLOMADOS */}
          <Route path="seminars" element={<SeminarList />} />
          <Route path="seminars/create" element={<SeminarForm />} />
          <Route path="seminars/:seminarId" element={<SeminarDetail />} />
          <Route path="seminars/:seminarId/edit" element={<SeminarForm />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* COUNCIL / COMMITTEE */}
      <Route element={<ProtectedRoute allowedRoles={["PROGRAM_CURRICULUM_COMMITTEE"]} />}>
        <Route path="/comite" element={<CouncilLayout />}>
          <Route index element={<CouncilDashboard />} />
          <Route
            path="students/:studentModalityId"
            element={<CouncilStudentProfile />}
          />
          <Route path="cancellations" element={<CancellationRequests />} />
          <Route path="proposals" element={<CommitteeDefenseProposals />} />
          <Route path="reports" element={<CommitteeReports />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* DIRECTOR */}
      <Route element={<ProtectedRoute allowedRoles={["PROJECT_DIRECTOR"]} />}>
        <Route path="/project-director" element={<DirectorLayout />}>
          <Route index element={<DirectorDashboard />} />
          <Route 
            path="students/:studentModalityId" 
            element={<DirectorStudentProfile />} 
          />
          <Route 
            path="cancellations" 
            element={<DirectorCancellationRequests />} 
          />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* EXAMINER */}
      <Route element={<ProtectedRoute allowedRoles={["EXAMINER"]} />}>
        <Route path="/examiner" element={<ExaminerLayout />}>
          <Route index element={<ExaminerDashboard />} />
          <Route 
            path="student/:studentModalityId" 
            element={<ExaminerStudentProfile />} 
          />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* ADMIN */}
      <Route element={<ProtectedRoute allowedRoles={["SUPERADMIN"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/faculties" replace />} />
          <Route path="roles" element={<Roles />} />
          <Route path="permissions" element={<Permissions />} />
          <Route path="users" element={<Users />} />
          <Route path="faculties" element={<Faculties />} />
          <Route path="programs" element={<Programs />} />
          <Route path="modalities" element={<Modalities />} />
          <Route path="program-credits" element={<ProgramDegreeModalities />} />
          <Route path="requirements" element={<Requirements />} />
          <Route path="documents" element={<Documents />} />
          <Route path="assignments" element={<Assignments />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;