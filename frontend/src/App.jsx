import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ItemDetails from "./pages/ItemDetails";
import ItemCreate from "./pages/ItemCreate";
import Profile from "./pages/Profile";
import Conversations from "./pages/Conversations";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/AdminDashboard";
import UserDetail from "./pages/UserDetail";
import UserDashboard from "./pages/UserDashboard";
import NotFound from "./pages/NotFound";
import VerifyOtp from "./pages/Auth/VerifyOtp"; // Import the VerifyOtp component
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<BrowserRouter>
					<ToastContainer
						position="top-right"
						autoClose={5000}
						hideProgressBar={false}
						newestOnTop={false}
						closeOnClick
						rtl={false}
						pauseOnFocusLoss
						draggable
						pauseOnHover
					/>
					<Routes>
						<Route path="/" element={<Landing />} />
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route path="/verify-otp" element={<VerifyOtp />} />
						<Route element={<Layout />}>
							<Route
								path="/home"
								element={
									<ProtectedRoute>
										<Home />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/items/:id"
								element={
									<ProtectedRoute>
										<ItemDetails />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/conversations"
								element={
									<ProtectedRoute>
										<Conversations />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/messages/:conversationId"
								element={
									<ProtectedRoute>
										<Messages />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/notifications"
								element={
									<ProtectedRoute>
										<Notifications />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/dashboard"
								element={
									<ProtectedRoute>
										<UserDashboard />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/profile"
								element={
									<ProtectedRoute>
										<Profile />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/items/create"
								element={
									<ProtectedRoute>
										<ItemCreate />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/admin"
								element={
									<AdminRoute>
										<AdminDashboard />
									</AdminRoute>
								}
							/>
							<Route
								path="/users/:id"
								element={
									<AdminRoute>
										<UserDetail />
									</AdminRoute>
								}
							/>
							<Route path="*" element={<NotFound />} />
						</Route>
					</Routes>
				</BrowserRouter>
			</AuthProvider>
		</ThemeProvider>
	);
}

export default App;
