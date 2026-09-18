import {
  Car,
  Fuel,
  Wrench,
  Wallet,
  Bell,
  History,
  LayoutDashboard,
  BarChart3,
  Settings,
  Plus,
  ArrowLeft,
  Gauge,
  CalendarDays,
  Eye,
  EyeOff,
  Trash2,
  X,
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
  UserRound,
  Ruler,
} from "lucide-react";
import { useEffect, useState } from "react";
import "./App.css";

const emptyVehicle = {
  name: "",
  brand: "",
  model: "",
  year: "",
  fuel: "Petrol",
  transmission: "Manual",
  odometer: "",
};

const today = new Date().toISOString().slice(0, 10);

const emptyFuelEntry = {
  vehicleId: "",
  date: today,
  odometer: "",
  quantity: "",
  pricePerLitre: "",
  fullTank: "Yes",
};

const emptyMaintenanceRecord = {
  vehicleId: "",
  serviceType: "",
  date: today,
  odometer: "",
  cost: "",
  notes: "",
};

const emptyExpense = {
  category: "Fuel",
  vehicleId: "",
  date: today,
  amount: "",
  notes: "",
};

const emptyReminder = {
  vehicleId: "",
  type: "Service",
  title: "",
  dueDate: today,
  dueOdometer: "",
  notes: "",
};

const AUTH_USERS_KEY = "autolog-users";
const AUTH_SESSION_KEY = "autolog-session";
const AUTH_USERS_COOKIE = "autolog_auth_users";
const AUTH_SESSION_COOKIE = "autolog_auth_session";
const SETTINGS_KEY = "autolog-settings";

const defaultSettings = {
  primaryVehicleId: "",
  units: "km",
  currency: "INR",
  remindersEnabled: true,
  appearance: "light",
};

function getStoredVehicles() {
  try {
    const storedVehicles = JSON.parse(localStorage.getItem("autolog-vehicles"));
    return Array.isArray(storedVehicles) ? storedVehicles : [];
  } catch {
    return [];
  }
}

function readStoredList(key) {
  try {
    const storedValue = JSON.parse(localStorage.getItem(key));
    return Array.isArray(storedValue) ? storedValue : [];
  } catch {
    return [];
  }
}

function writeStoredList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readCookie(name) {
  const cookie = document.cookie.split("; ").find((item) => item.startsWith(`${name}=`));
  if (!cookie) return null;
  try {
    return JSON.parse(decodeURIComponent(cookie.slice(name.length + 1)));
  } catch {
    return null;
  }
}

function writeCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; path=/; max-age=31536000; SameSite=Lax`;
}

function removeCookie(name) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function readSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    return { ...defaultSettings, ...(settings && typeof settings === "object" ? settings : {}) };
  } catch {
    return defaultSettings;
  }
}

function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY)) || readCookie(AUTH_SESSION_COOKIE) || null;
    } catch {
      return null;
    }
  });

  const login = (user) => {
    const sessionUser = { name: user.name, email: user.email };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
    writeCookie(AUTH_SESSION_COOKIE, sessionUser);
    setSession(sessionUser);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    removeCookie(AUTH_SESSION_COOKIE);
    setSession(null);
  };

  const updateProfile = (name) => {
    const normalizedName = name.trim();
    const nextSession = { ...session, name: normalizedName };
    const users = readUsers().map((user) => user.email === session.email ? { ...user, name: normalizedName } : user);
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
    writeCookie(AUTH_USERS_COOKIE, users);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession));
    writeCookie(AUTH_SESSION_COOKIE, nextSession);
    setSession(nextSession);
  };

  const changePassword = (currentPassword, newPassword) => {
    const users = readUsers();
    const user = users.find((candidate) => candidate.email === session.email);
    if (!user || user.password !== currentPassword) return { ok: false, message: "The current password is incorrect." };
    const nextUsers = users.map((candidate) => candidate.email === session.email ? { ...candidate, password: newPassword } : candidate);
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(nextUsers));
    writeCookie(AUTH_USERS_COOKIE, nextUsers);
    return { ok: true, message: "Password updated successfully." };
  };

  return (
    session ? <div className="app"><AppContent user={session} onLogout={logout} onProfileUpdate={updateProfile} onChangePassword={changePassword} /></div> : <AuthPage onLogin={login} />
  );
}

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState({ type: "", text: "" });

  return mode === "login" ? (
    <LoginForm onLogin={onLogin} onSignUp={() => { setMode("signup"); setMessage({ type: "", text: "" }); }} message={message} setMessage={setMessage} />
  ) : (
    <SignUpForm onLogin={onLogin} onBack={() => { setMode("login"); setMessage({ type: "", text: "" }); }} message={message} setMessage={setMessage} />
  );
}

function readUsers() {
  try {
    const localUsers = JSON.parse(localStorage.getItem(AUTH_USERS_KEY));
    const users = Array.isArray(localUsers) && localUsers.length ? localUsers : readCookie(AUTH_USERS_COOKIE);
    return Array.isArray(users) ? users.map(normalizeUser).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function normalizeUser(user) {
  if (!user || typeof user !== "object") return null;
  const source = user.user && typeof user.user === "object" ? user.user : user;
  const email = String(source.email ?? source.emailAddress ?? source.username ?? "").trim().toLowerCase();
  const passwordValue = source.password ?? source.passcode ?? source.pass;
  if (!email || passwordValue === undefined || passwordValue === null) return null;
  return {
    name: String(source.name ?? source.fullName ?? source.full_name ?? "AutoLog User").trim(),
    email,
    password: String(passwordValue),
  };
}

function LoginForm({ onLogin, onSignUp, message, setMessage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const user = readUsers().find((candidate) => candidate.email === normalizedEmail);
    if (!user) {
      setMessage({ type: "error", text: "No account was found for this email." });
      return;
    }
    if (user.password !== password) {
      setMessage({ type: "error", text: "The password is incorrect." });
      return;
    }
    onLogin(user);
  };

  return <AuthLayout eyebrow="WELCOME BACK" title="Sign in to AutoLog" subtitle="Keep every part of your vehicle life in one place.">
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
      <PasswordField label="Password" value={password} onChange={setPassword} showPassword={showPassword} onToggle={() => setShowPassword(!showPassword)} />
      {message.text && <p className={`auth-message ${message.type}`}>{message.text}</p>}
      <button className="auth-submit" type="submit">Login</button>
      <p className="auth-switch">New to AutoLog? <button type="button" onClick={onSignUp}>Create Account</button></p>
    </form>
  </AuthLayout>;
}

function SignUpForm({ onLogin, onBack, message, setMessage }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedEmail = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage({ type: "error", text: "Enter a valid email address." });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    const users = readUsers();
    if (users.some((user) => user.email === normalizedEmail)) {
      setMessage({ type: "error", text: "An account with this email already exists." });
      return;
    }
    const user = { name: form.name.trim(), email: normalizedEmail, password: form.password };
    const nextUsers = [...users, user];
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(nextUsers));
    writeCookie(AUTH_USERS_COOKIE, nextUsers);
    setMessage({ type: "success", text: "Account created. You are now signed in." });
    onLogin(user);
  };

  return <AuthLayout eyebrow="GET STARTED" title="Create your AutoLog account" subtitle="A clearer way to stay on top of every drive.">
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>Full name<input name="name" value={form.name} onChange={updateField} placeholder="Dinesh Kumar" required /></label>
      <label>Email<input name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" required /></label>
      <PasswordField label="Password" name="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} showPassword={showPassword} onToggle={() => setShowPassword(!showPassword)} />
      <PasswordField label="Confirm password" name="confirmPassword" value={form.confirmPassword} onChange={(value) => setForm({ ...form, confirmPassword: value })} showPassword={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
      {message.text && <p className={`auth-message ${message.type}`}>{message.text}</p>}
      <button className="auth-submit" type="submit">Create Account</button>
      <p className="auth-switch">Already have an account? <button type="button" onClick={onBack}>Login</button></p>
    </form>
  </AuthLayout>;
}

function PasswordField({ label, name = "password", value, onChange, showPassword, onToggle }) {
  return <label>{label}<span className="password-input"><input name={name} type={showPassword ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} required /><button type="button" title={showPassword ? "Hide password" : "Show password"} onClick={onToggle}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>;
}

function AuthLayout({ eyebrow, title, subtitle, children }) {
  return <main className="auth-shell"><section className="auth-panel"><div className="auth-brand"><div className="brand-icon"><Car size={22} /></div><span>AutoLog</span></div><div className="auth-copy"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{subtitle}</p></div>{children}</section><aside className="auth-aside"><Car size={70} strokeWidth={1.1} /><span>VEHICLE MANAGEMENT</span><strong>Your road, logged.</strong><p>Everything you need to understand and care for your vehicles.</p></aside></main>;
}

function AppContent({ user, onLogout, onProfileUpdate, onChangePassword }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [vehicles, setVehicles] = useState(() => {
    return getStoredVehicles();
  });
  const [fuelEntries, setFuelEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("autolog-fuel-entries")) || [];
    } catch {
      return [];
    }
  });
  const [maintenanceRecords, setMaintenanceRecords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("autolog-maintenance-records")) || [];
    } catch {
      return [];
    }
  });
  const [expenses, setExpenses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("autolog-expenses")) || [];
    } catch {
      return [];
    }
  });
  const [reminders, setReminders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("autolog-reminders")) || [];
    } catch {
      return [];
    }
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFuelFormOpen, setIsFuelFormOpen] = useState(false);
  const [isMaintenanceFormOpen, setIsMaintenanceFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isReminderFormOpen, setIsReminderFormOpen] = useState(false);
  const [vehicleToView, setVehicleToView] = useState(null);
  const [serviceHistoryVehicleId, setServiceHistoryVehicleId] = useState("all");
  const [settings, setSettings] = useState(readSettings);

  useEffect(() => {
    const syncStoredData = (event) => {
      if (event.key === "autolog-vehicles") setVehicles(getStoredVehicles());
      if (event.key === "autolog-fuel-entries") setFuelEntries(readStoredList("autolog-fuel-entries"));
      if (event.key === "autolog-maintenance-records") setMaintenanceRecords(readStoredList("autolog-maintenance-records"));
      if (event.key === "autolog-expenses") setExpenses(readStoredList("autolog-expenses"));
      if (event.key === "autolog-reminders") setReminders(readStoredList("autolog-reminders"));
    };
    window.addEventListener("storage", syncStoredData);
    return () => window.removeEventListener("storage", syncStoredData);
  }, []);

  const saveVehicle = (vehicle) => {
    const nextVehicles = [...vehicles, { ...vehicle, id: crypto.randomUUID() }];
    setVehicles(nextVehicles);
    writeStoredList("autolog-vehicles", nextVehicles);
    setIsFormOpen(false);
  };

  const deleteVehicle = (vehicleId) => {
    const nextVehicles = vehicles.filter((vehicle) => vehicle.id !== vehicleId);
    setVehicles(nextVehicles);
    writeStoredList("autolog-vehicles", nextVehicles);
    setVehicleToView(null);
    setActivePage("vehicles");
  };

  const saveFuelEntry = (entry) => {
    const nextEntries = [...fuelEntries, { ...entry, id: crypto.randomUUID(), amount: Number(entry.quantity) * Number(entry.pricePerLitre) }];
    setFuelEntries(nextEntries);
    writeStoredList("autolog-fuel-entries", nextEntries);
    setIsFuelFormOpen(false);
  };

  const deleteFuelEntry = (entryId) => {
    const nextEntries = fuelEntries.filter((entry) => entry.id !== entryId);
    setFuelEntries(nextEntries);
    writeStoredList("autolog-fuel-entries", nextEntries);
  };

  const saveMaintenanceRecord = (record) => {
    const nextRecords = [...maintenanceRecords, { ...record, id: crypto.randomUUID() }];
    setMaintenanceRecords(nextRecords);
    writeStoredList("autolog-maintenance-records", nextRecords);
    setIsMaintenanceFormOpen(false);
  };

  const deleteMaintenanceRecord = (recordId) => {
    const nextRecords = maintenanceRecords.filter((record) => record.id !== recordId);
    setMaintenanceRecords(nextRecords);
    writeStoredList("autolog-maintenance-records", nextRecords);
  };

  const saveExpense = (expense) => {
    const nextExpenses = [...expenses, { ...expense, id: crypto.randomUUID() }];
    setExpenses(nextExpenses);
    writeStoredList("autolog-expenses", nextExpenses);
    setIsExpenseFormOpen(false);
  };

  const deleteExpense = (expenseId) => {
    const nextExpenses = expenses.filter((expense) => expense.id !== expenseId);
    setExpenses(nextExpenses);
    writeStoredList("autolog-expenses", nextExpenses);
  };

  const saveReminder = (reminder) => {
    const nextReminders = [...reminders, { ...reminder, id: crypto.randomUUID() }];
    setReminders(nextReminders);
    writeStoredList("autolog-reminders", nextReminders);
    setIsReminderFormOpen(false);
  };

  const deleteReminder = (reminderId) => {
    const nextReminders = reminders.filter((reminder) => reminder.id !== reminderId);
    setReminders(nextReminders);
    writeStoredList("autolog-reminders", nextReminders);
  };

  const openReminderForm = () => {
    setVehicles(getStoredVehicles());
    setIsReminderFormOpen(true);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = settings.appearance;
  }, [settings.appearance]);

  const updateSettings = (changes) => {
    const nextSettings = { ...settings, ...changes };
    setSettings(nextSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
  };

  const showDashboard = activePage === "dashboard";
  const showVehicleDetails = activePage === "vehicle-details";
  const showVehicles = activePage === "vehicles" || showVehicleDetails;
  const showFuel = activePage === "fuel";
  const showMaintenance = activePage === "maintenance";
  const showExpenses = activePage === "expenses";
  const showAnalytics = activePage === "analytics";
  const showReminders = activePage === "reminders";
  const showServiceHistory = activePage === "service-history";
  const showSettings = activePage === "settings";

  return (
    <>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Car size={22} />
          </div>
          <span>AutoLog</span>
        </div>

        <nav className="navigation">
          <button
            className={`nav-item ${showDashboard ? "active" : ""}`}
            onClick={() => setActivePage("dashboard")}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button
            className={`nav-item ${showVehicles ? "active" : ""}`}
            onClick={() => {
              setActivePage("vehicles");
              setVehicleToView(null);
            }}
          >
            <Car size={19} />
            My Vehicles
          </button>

          <button
            className={`nav-item ${showFuel ? "active" : ""}`}
            onClick={() => setActivePage("fuel")}
          >
            <Fuel size={19} />
            Fuel
          </button>

          <button
            className={`nav-item ${showMaintenance ? "active" : ""}`}
            onClick={() => setActivePage("maintenance")}
          >
            <Wrench size={19} />
            Maintenance
          </button>

          <button
            className={`nav-item ${showServiceHistory ? "active" : ""}`}
            onClick={() => {
              setServiceHistoryVehicleId("all");
              setActivePage("service-history");
            }}
          >
            <History size={19} />
            Service History
          </button>

          <button
            className={`nav-item ${showExpenses ? "active" : ""}`}
            onClick={() => setActivePage("expenses")}
          >
            <Wallet size={19} />
            Expenses
          </button>

          <button
            className={`nav-item ${showAnalytics ? "active" : ""}`}
            onClick={() => setActivePage("analytics")}
          >
            <BarChart3 size={19} />
            Analytics
          </button>

          <button
            className={`nav-item reminders-nav-item ${showReminders ? "active" : ""}`}
            onClick={() => setActivePage("reminders")}
          >
            <Bell size={19} />
            Reminders
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${showSettings ? "active" : ""}`}
            onClick={() => setActivePage("settings")}
          >
            <Settings size={19} />
            Settings
          </button>

          <button className="nav-item logout-item" onClick={onLogout}>
            <LogOut size={19} />
            Logout
          </button>

          <div className="profile">
            <div className="avatar">D</div>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">VEHICLE MANAGEMENT</p>
            <h1>{showDashboard ? "Dashboard" : showVehicleDetails ? "Vehicle Details" : showVehicles ? "My Vehicles" : showFuel ? "Fuel Tracking" : showMaintenance ? "Maintenance" : showServiceHistory ? "Service History" : showExpenses ? "Expenses" : showAnalytics ? "Analytics" : showSettings ? "Settings" : "Reminders"}</h1>
          </div>

          {!showAnalytics && !showVehicleDetails && !showServiceHistory && !showSettings && (
            <button
              className="add-button"
              onClick={() => showFuel ? setIsFuelFormOpen(true) : showMaintenance ? setIsMaintenanceFormOpen(true) : showExpenses ? setIsExpenseFormOpen(true) : showReminders ? openReminderForm() : setIsFormOpen(true)}
            >
              <Plus size={18} />
              {showFuel ? "Add Fuel Entry" : showMaintenance ? "Add Maintenance" : showExpenses ? "Add Expense" : showReminders ? "Add Reminder" : "Add Vehicle"}
            </button>
          )}
        </header>

        {showDashboard ? (
          <Dashboard
            vehicles={vehicles}
            fuelEntries={fuelEntries}
            maintenanceRecords={maintenanceRecords}
            expenses={expenses}
            reminders={reminders}
            primaryVehicleId={settings.primaryVehicleId}
            onViewVehicle={(vehicle) => {
              setVehicleToView(vehicle);
              setActivePage("vehicle-details");
            }}
            onAddFuel={() => setIsFuelFormOpen(true)}
            onAddMaintenance={() => setIsMaintenanceFormOpen(true)}
            onAddExpense={() => setIsExpenseFormOpen(true)}
            onAddReminder={openReminderForm}
          />
        ) : showVehicleDetails ? (
          <VehicleDetailsPage
            vehicle={vehicleToView}
            fuelEntries={fuelEntries}
            maintenanceRecords={maintenanceRecords}
            expenses={expenses}
            onViewServiceHistory={(vehicleId) => {
              setServiceHistoryVehicleId(vehicleId);
              setActivePage("service-history");
            }}
            onBack={() => {
              setActivePage("vehicles");
              setVehicleToView(null);
            }}
          />
        ) : showVehicles ? (
          <VehiclesPage
            vehicles={vehicles}
            onAdd={() => setIsFormOpen(true)}
            onView={(vehicle) => {
              setVehicleToView(vehicle);
              setActivePage("vehicle-details");
            }}
            onDelete={deleteVehicle}
          />
        ) : showFuel ? (
          <FuelPage
            vehicles={vehicles}
            entries={fuelEntries}
            onAdd={() => setIsFuelFormOpen(true)}
            onDelete={deleteFuelEntry}
          />
        ) : showMaintenance ? (
          <MaintenancePage
            vehicles={vehicles}
            records={maintenanceRecords}
            onAdd={() => setIsMaintenanceFormOpen(true)}
            onDelete={deleteMaintenanceRecord}
          />
        ) : showServiceHistory ? (
          <ServiceHistoryPage
            vehicles={vehicles}
            records={maintenanceRecords}
            selectedVehicleId={serviceHistoryVehicleId}
            onFilterChange={setServiceHistoryVehicleId}
            onDelete={deleteMaintenanceRecord}
          />
        ) : showExpenses ? (
          <ExpensesPage
            vehicles={vehicles}
            expenses={expenses}
            onAdd={() => setIsExpenseFormOpen(true)}
            onDelete={deleteExpense}
          />
        ) : showAnalytics ? (
          <AnalyticsPage
            vehicles={vehicles}
            fuelEntries={fuelEntries}
            maintenanceRecords={maintenanceRecords}
            expenses={expenses}
          />
        ) : showSettings ? (
          <SettingsPage
            user={user}
            settings={settings}
            vehicles={vehicles}
            onUpdateSettings={updateSettings}
            onProfileUpdate={onProfileUpdate}
            onChangePassword={onChangePassword}
            onLogout={onLogout}
          />
        ) : (
          <RemindersPage
            vehicles={vehicles}
            reminders={reminders}
            onAdd={openReminderForm}
            onDelete={deleteReminder}
          />
        )}
      </main>

      {isFormOpen && (
        <VehicleForm onClose={() => setIsFormOpen(false)} onSave={saveVehicle} />
      )}

      {isFuelFormOpen && (
        <FuelForm
          vehicles={vehicles}
          onClose={() => setIsFuelFormOpen(false)}
          onSave={saveFuelEntry}
        />
      )}

      {isMaintenanceFormOpen && (
        <MaintenanceForm
          vehicles={vehicles}
          onClose={() => setIsMaintenanceFormOpen(false)}
          onSave={saveMaintenanceRecord}
        />
      )}

      {isExpenseFormOpen && (
        <ExpenseForm
          vehicles={vehicles}
          onClose={() => setIsExpenseFormOpen(false)}
          onSave={saveExpense}
        />
      )}

      {isReminderFormOpen && (
        <ReminderForm
          vehicles={vehicles}
          onClose={() => setIsReminderFormOpen(false)}
          onSave={saveReminder}
        />
      )}

    </>
  );
}

function buildRecentActivity(fuelEntries, maintenanceRecords, expenses, reminders, vehicles) {
  const activities = [
    ...fuelEntries.map((entry) => ({ id: `fuel-${entry.id}`, date: entry.date, title: "Fuel logged", subtitle: `${findVehicleName(vehicles, entry.vehicleId)} · ${Number(entry.quantity).toFixed(1)} L`, type: "Fuel", icon: <Fuel size={18} /> })),
    ...maintenanceRecords.map((record) => ({ id: `maintenance-${record.id}`, date: record.date, title: record.serviceType, subtitle: `${findVehicleName(vehicles, record.vehicleId)} · ${formatCurrency(Number(record.cost))}`, type: "Service", icon: <Wrench size={18} /> })),
    ...expenses.map((expense) => ({ id: `expense-${expense.id}`, date: expense.date, title: expense.category, subtitle: `${findVehicleName(vehicles, expense.vehicleId)} · ${formatCurrency(Number(expense.amount))}`, type: "Expense", icon: <Wallet size={18} /> })),
    ...reminders.map((reminder) => ({ id: `reminder-${reminder.id}`, date: reminder.dueDate, title: reminder.title, subtitle: `${findVehicleName(vehicles, reminder.vehicleId)} · Due ${formatDate(reminder.dueDate)}`, type: getReminderStatus(reminder.dueDate), icon: <Bell size={18} /> })),
  ];
  return activities.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
}

function findVehicleName(vehicles, vehicleId) {
  return vehicles.find((vehicle) => vehicle.id === vehicleId)?.name || "Vehicle";
}

function SettingsPage({ user, settings, vehicles, onUpdateSettings, onProfileUpdate, onChangePassword, onLogout }) {
  const [displayName, setDisplayName] = useState(user.name);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  const saveProfile = (event) => {
    event.preventDefault();
    if (!displayName.trim()) return;
    onProfileUpdate(displayName);
    setProfileMessage("Profile updated successfully.");
  };

  const savePassword = (event) => {
    event.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (passwordForm.next.length < 6) {
      setPasswordMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }
    const result = onChangePassword(passwordForm.current, passwordForm.next);
    setPasswordMessage({ type: result.ok ? "success" : "error", text: result.message });
    if (result.ok) setPasswordForm({ current: "", next: "", confirm: "" });
  };

  return <section className="settings-page">
    <div className="settings-intro"><p className="muted">PREFERENCES</p><h2>Make AutoLog work your way.</h2><p className="description">Manage your profile, display, tracking and account preferences.</p></div>
    <div className="settings-grid">
      <SettingsSection icon={<UserRound size={18} />} eyebrow="PROFILE" title="Your profile">
        <form className="settings-form" onSubmit={saveProfile}><label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></label><button className="secondary-add-button" type="submit">Save profile</button>{profileMessage && <p className="settings-message success">{profileMessage}</p>}</form>
      </SettingsSection>
      <SettingsSection icon={<Car size={18} />} eyebrow="VEHICLE PREFERENCES" title="Primary vehicle">
        <label className="settings-field">Primary vehicle<select value={settings.primaryVehicleId} onChange={(event) => onUpdateSettings({ primaryVehicleId: event.target.value })}><option value="">First vehicle in garage</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.brand} {vehicle.model}</option>)}</select></label><p className="settings-help">Used for the primary vehicle shown on your Dashboard.</p>
      </SettingsSection>
      <SettingsSection icon={<Ruler size={18} />} eyebrow="UNITS & CURRENCY" title="Regional preferences">
        <div className="settings-options"><label className="settings-field">Distance units<select value={settings.units} onChange={(event) => onUpdateSettings({ units: event.target.value })}><option value="km">Kilometres (km)</option><option value="miles">Miles (mi)</option></select></label><label className="settings-field">Currency<select value={settings.currency} onChange={(event) => onUpdateSettings({ currency: event.target.value })}><option value="INR">INR (₹)</option><option value="USD">USD ($)</option></select></label></div>
      </SettingsSection>
      <SettingsSection icon={<Bell size={18} />} eyebrow="REMINDER PREFERENCES" title="Stay on top of things">
        <label className="toggle-row"><span><strong>Enable reminders</strong><small>Show upcoming and overdue reminder information.</small></span><input type="checkbox" checked={settings.remindersEnabled} onChange={(event) => onUpdateSettings({ remindersEnabled: event.target.checked })} /><span className="toggle-control" /></label>
      </SettingsSection>
      <SettingsSection icon={settings.appearance === "dark" ? <Moon size={18} /> : <Sun size={18} />} eyebrow="APPEARANCE" title="Choose your look">
        <div className="appearance-options"><button type="button" className={settings.appearance === "light" ? "selected" : ""} onClick={() => onUpdateSettings({ appearance: "light" })}><Sun size={17} /> Light</button><button type="button" className={settings.appearance === "dark" ? "selected" : ""} onClick={() => onUpdateSettings({ appearance: "dark" })}><Moon size={17} /> Dark</button></div>
      </SettingsSection>
      <SettingsSection icon={<ShieldCheck size={18} />} eyebrow="SECURITY" title="Change password">
        <form className="settings-form" onSubmit={savePassword}><label>Current password<input type="password" value={passwordForm.current} onChange={(event) => setPasswordForm({ ...passwordForm, current: event.target.value })} required /></label><label>New password<input type="password" value={passwordForm.next} onChange={(event) => setPasswordForm({ ...passwordForm, next: event.target.value })} minLength="6" required /></label><label>Confirm new password<input type="password" value={passwordForm.confirm} onChange={(event) => setPasswordForm({ ...passwordForm, confirm: event.target.value })} required /></label><button className="secondary-add-button" type="submit">Update password</button>{passwordMessage.text && <p className={`settings-message ${passwordMessage.type}`}>{passwordMessage.text}</p>}</form>
      </SettingsSection>
      <SettingsSection icon={<LogOut size={18} />} eyebrow="ACCOUNT" title="Your account">
        <div className="account-details"><span>Signed in as</span><strong>{user.email}</strong></div><button className="logout-settings-button" onClick={onLogout}><LogOut size={16} /> Logout</button>
      </SettingsSection>
    </div>
  </section>;
}

function SettingsSection({ icon, eyebrow, title, children }) {
  return <section className="settings-section"><div className="settings-section-header"><div className="settings-section-icon">{icon}</div><div><span className="label">{eyebrow}</span><h3>{title}</h3></div></div>{children}</section>;
}

function Dashboard({ vehicles, fuelEntries, maintenanceRecords, expenses, reminders, primaryVehicleId, onViewVehicle, onAddFuel, onAddMaintenance, onAddExpense, onAddReminder }) {
  const totalFuelCost = fuelEntries.reduce((total, entry) => total + Number(entry.amount), 0);
  const totalMaintenanceCost = maintenanceRecords.reduce((total, record) => total + Number(record.cost), 0);
  const totalOtherExpenses = expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  const overallSpending = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;
  const upcomingReminders = reminders.filter((reminder) => getReminderStatus(reminder.dueDate) !== "Overdue").length;
  const overdueReminders = reminders.filter((reminder) => getReminderStatus(reminder.dueDate) === "Overdue").length;
  const odometerReadings = vehicles.flatMap((vehicle) => [Number(vehicle.odometer), ...fuelEntries.filter((entry) => entry.vehicleId === vehicle.id).map((entry) => Number(entry.odometer)), ...maintenanceRecords.filter((record) => record.vehicleId === vehicle.id).map((record) => Number(record.odometer))]).filter((reading) => Number.isFinite(reading));
  const latestOdometer = odometerReadings.length ? Math.max(...odometerReadings) : 0;
  const primaryVehicle = vehicles.find((vehicle) => vehicle.id === primaryVehicleId) || vehicles[0];
  const primaryFuel = primaryVehicle ? fuelEntries.filter((entry) => entry.vehicleId === primaryVehicle.id) : [];
  const primaryMileage = calculateMileage(primaryFuel);
  const recentActivity = buildRecentActivity(fuelEntries, maintenanceRecords, expenses, reminders, vehicles);

  return (
    <>
      <section className="welcome">
          <div>
            <p className="muted">Good morning, Dinesh 👋</p>
            <h2>Your vehicle at a glance.</h2>
            <p className="description">
              Track fuel, maintenance and expenses from one place.
            </p>
          </div>

          <div className="date">
            <CalendarDays size={18} />
            September 2026
          </div>
      </section>

        {/* Vehicle Card */}
        <section className="vehicle-card">
          <div className="vehicle-image">
            <Car size={70} strokeWidth={1.2} />
          </div>

          {primaryVehicle ? <div className="vehicle-info">
            <span className="label">PRIMARY VEHICLE</span>
            <h2>{primaryVehicle.name}</h2>
            <p>{primaryVehicle.brand} {primaryVehicle.model} • {primaryVehicle.fuel} • {primaryVehicle.year}</p>

            <div className="vehicle-stats">
              <div>
                <Gauge size={17} />
                <span>
                  <strong>{Number(primaryVehicle.odometer).toLocaleString()}</strong>
                  km driven
                </span>
              </div>

              <div>
                <Fuel size={17} />
                <span>
                  <strong>{primaryMileage ? primaryMileage.toFixed(1) : "—"}</strong>
                  km/l average
                </span>
              </div>
            </div>
          </div> : <div className="vehicle-info"><span className="label">PRIMARY VEHICLE</span><h2>No vehicles added</h2><p>Add a vehicle to start tracking your garage.</p></div>}

          {primaryVehicle && <button className="outline-button" onClick={() => onViewVehicle(primaryVehicle)}>View Details</button>}
        </section>

        {/* Stats */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon fuel-icon">
              <Fuel size={20} />
            </div>
            <span>Total vehicles</span>
            <h3>{vehicles.length}</h3>
            <small>In your garage</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon service-icon">
              <Wrench size={20} />
            </div>
            <span>Fuel cost</span>
            <h3>{formatCurrency(totalFuelCost)}</h3>
            <small>All time</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon expense-icon">
              <Wallet size={20} />
            </div>
            <span>Maintenance cost</span>
            <h3>{formatCurrency(totalMaintenanceCost)}</h3>
            <small>All time</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon reminder-icon">
              <Bell size={20} />
            </div>
            <span>Other expenses</span>
            <h3>{formatCurrency(totalOtherExpenses)}</h3>
            <small>All time</small>
          </div>
        </section>

        <section className="dashboard-secondary-stats">
          <div className="dashboard-secondary-stat"><span>Overall spending</span><strong>{formatCurrency(overallSpending)}</strong></div>
          <div className="dashboard-secondary-stat"><span>Latest odometer</span><strong>{latestOdometer ? `${latestOdometer.toLocaleString()} km` : "—"}</strong></div>
          <div className="dashboard-secondary-stat"><span>Upcoming reminders</span><strong>{upcomingReminders}</strong></div>
          <div className="dashboard-secondary-stat"><span>Overdue reminders</span><strong>{overdueReminders}</strong></div>
        </section>

        {/* Bottom Grid */}
        <section className="bottom-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="label">RECENT ACTIVITY</span>
                <h3>Latest vehicle updates</h3>
              </div>

              <History size={20} />
            </div>

            {recentActivity.length ? recentActivity.map((activity) => <div className="service-item" key={activity.id}><div className="service-icon-box">{activity.icon}</div><div><strong>{activity.title}</strong><p>{activity.subtitle}</p></div><span className="status">{activity.type}</span></div>) : <p className="activity-empty">No recent activity yet.</p>}
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="label">QUICK ACTIONS</span>
                <h3>What do you want to log?</h3>
              </div>
            </div>

            <div className="quick-actions">
              <button onClick={onAddFuel}>
                <Fuel size={19} />
                Add Fuel
              </button>

              <button onClick={onAddMaintenance}>
                <Wrench size={19} />
                Add Service
              </button>

              <button onClick={onAddExpense}>
                <Wallet size={19} />
                Add Expense
              </button>
              <button onClick={onAddReminder}>
                <Bell size={19} />
                Add Reminder
              </button>
            </div>
          </div>
        </section>
    </>
  );
}

function VehicleDetailsPage({ vehicle, fuelEntries, maintenanceRecords, expenses, onViewServiceHistory, onBack }) {
  if (!vehicle) return null;

  const vehicleFuel = fuelEntries.filter((entry) => entry.vehicleId === vehicle.id);
  const vehicleMaintenance = maintenanceRecords.filter((record) => record.vehicleId === vehicle.id);
  const vehicleExpenses = expenses.filter((expense) => expense.vehicleId === vehicle.id);
  const totalFuelCost = vehicleFuel.reduce((total, entry) => total + Number(entry.amount), 0);
  const totalMaintenanceCost = vehicleMaintenance.reduce((total, record) => total + Number(record.cost), 0);
  const totalExpenses = vehicleExpenses.reduce((total, expense) => total + Number(expense.amount), 0);
  const overallSpending = totalFuelCost + totalMaintenanceCost + totalExpenses;
  const odometerReadings = [Number(vehicle.odometer), ...vehicleFuel.map((entry) => Number(entry.odometer)), ...vehicleMaintenance.map((record) => Number(record.odometer))];
  const currentOdometer = Math.max(...odometerReadings.filter((reading) => Number.isFinite(reading)));
  const mileage = calculateMileage(vehicleFuel);

  return (
    <section className="vehicle-details-page">
      <button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Back to My Vehicles</button>
      <div className="vehicle-details-hero">
        <div className="vehicle-details-visual"><Car size={67} strokeWidth={1.2} /></div>
        <div className="vehicle-details-heading"><span className="label">VEHICLE PROFILE</span><h2>{vehicle.name}</h2><p>{vehicle.brand} {vehicle.model} <span>•</span> {vehicle.year}</p></div>
        <div className="vehicle-details-specs"><span>{vehicle.fuel} fuel</span><span>{vehicle.transmission}</span></div>
      </div>

      <div className="vehicle-detail-stats">
        <VehicleDetailStat label="Current odometer" value={`${currentOdometer.toLocaleString()} km`} icon={<Gauge size={19} />} />
        <VehicleDetailStat label="Average mileage" value={mileage ? `${mileage.toFixed(1)} km/l` : "—"} icon={<Fuel size={19} />} />
        <VehicleDetailStat label="Total fuel cost" value={formatCurrency(totalFuelCost)} icon={<Fuel size={19} />} />
        <VehicleDetailStat label="Maintenance cost" value={formatCurrency(totalMaintenanceCost)} icon={<Wrench size={19} />} />
        <VehicleDetailStat label="Total expenses" value={formatCurrency(totalExpenses)} icon={<Wallet size={19} />} />
        <VehicleDetailStat label="Overall spending" value={formatCurrency(overallSpending)} icon={<BarChart3 size={19} />} />
      </div>

      <div className="vehicle-activity-grid">
        <div className="panel"><div className="panel-header"><div><span className="label">VEHICLE INFO</span><h3>At a glance</h3></div><Car size={20} /></div><div className="vehicle-info-list"><div><span>Model</span><strong>{vehicle.brand} {vehicle.model}</strong></div><div><span>Year</span><strong>{vehicle.year}</strong></div><div><span>Fuel type</span><strong>{vehicle.fuel}</strong></div><div><span>Transmission</span><strong>{vehicle.transmission}</strong></div></div></div>
        <div className="panel"><div className="panel-header"><div><span className="label">ACTIVITY</span><h3>Records linked</h3></div><BarChart3 size={20} /></div><div className="vehicle-info-list"><div><span>Fuel entries</span><strong>{vehicleFuel.length}</strong></div><div><span>Maintenance records</span><strong>{vehicleMaintenance.length}</strong></div><div><span>Other expenses</span><strong>{vehicleExpenses.length}</strong></div><div><span>Total activity</span><strong>{vehicleFuel.length + vehicleMaintenance.length + vehicleExpenses.length} records</strong></div></div><button className="history-link-button" onClick={() => onViewServiceHistory(vehicle.id)}><History size={15} /> View Service History</button></div>
      </div>
    </section>
  );
}

function VehicleDetailStat({ label, value, icon }) {
  return <div className="vehicle-detail-stat"><div className="vehicle-detail-stat-icon">{icon}</div><span>{label}</span><strong>{value}</strong></div>;
}

function VehiclesPage({ vehicles, onAdd, onView, onDelete }) {
  return (
    <section className="vehicles-page">
      <div className="page-intro">
        <div>
          <p className="muted">YOUR GARAGE</p>
          <h2>Every vehicle, organized.</h2>
          <p className="description">Keep your vehicle details ready whenever you need them.</p>
        </div>
        <span className="vehicle-count">{vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"}</span>
      </div>

      {vehicles.length === 0 ? (
        <div className="empty-vehicles">
          <div className="empty-icon"><Car size={28} /></div>
          <h3>No vehicles added yet</h3>
          <p>Add your first vehicle to start keeping your garage organized.</p>
          <button className="add-button" onClick={onAdd}><Plus size={18} /> Add Vehicle</button>
        </div>
      ) : (
        <div className="vehicles-grid">
          {vehicles.map((vehicle) => (
            <article className="saved-vehicle-card" key={vehicle.id}>
              <div className="saved-vehicle-visual"><Car size={48} strokeWidth={1.3} /></div>
              <div className="saved-vehicle-content">
                <span className="label">{vehicle.brand || "VEHICLE"}</span>
                <h3>{vehicle.name}</h3>
                <p>{vehicle.model} {vehicle.year && `• ${vehicle.year}`}</p>
                <div className="vehicle-meta">
                  <span><Fuel size={15} /> {vehicle.fuel}</span>
                  <span><Gauge size={15} /> {Number(vehicle.odometer).toLocaleString()} km</span>
                </div>
              </div>
              <div className="card-actions">
                <button className="details-card-button" title="View details" onClick={() => onView(vehicle)}><Eye size={16} /> View Details</button>
                <button className="icon-button delete-button" title="Delete vehicle" onClick={() => onDelete(vehicle.id)}><Trash2 size={17} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ServiceHistoryPage({ vehicles, records, selectedVehicleId, onFilterChange, onDelete }) {
  const filteredRecords = selectedVehicleId === "all"
    ? records
    : records.filter((record) => record.vehicleId === selectedVehicleId);
  const totalCost = filteredRecords.reduce((total, record) => total + Number(record.cost), 0);
  const latestService = [...filteredRecords].sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <section className="service-history-page">
      <div className="page-intro">
        <div>
          <p className="muted">SERVICE ARCHIVE</p>
          <h2>Every service, easy to find.</h2>
          <p className="description">Review the maintenance work recorded across your vehicles.</p>
        </div>
        <label className="history-filter">Vehicle<select value={selectedVehicleId} onChange={(event) => onFilterChange(event.target.value)}><option value="all">All vehicles</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}</select></label>
      </div>

      <div className="service-history-summary">
        <div><span>Total services</span><strong>{filteredRecords.length}</strong></div>
        <div><span>Total maintenance cost</span><strong>₹{totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></div>
        <div><span>Latest service</span><strong>{latestService ? formatDate(latestService.date) : "—"}</strong></div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="empty-vehicles service-history-empty"><div className="empty-icon"><History size={28} /></div><h3>No service records found</h3><p>{records.length ? "Try selecting a different vehicle." : "Maintenance records will appear here once you log a service."}</p></div>
      ) : (
          <div className="service-history-list">
          <div className="service-history-list-header"><div><span className="label">SERVICE HISTORY</span><h3>Recorded maintenance</h3></div></div>
          <div className="service-history-table-wrap"><table className="service-history-table"><thead><tr><th>Vehicle</th><th>Service type</th><th>Date</th><th>Odometer</th><th>Cost</th><th>Notes</th><th aria-label="Actions" /></tr></thead><tbody>{[...filteredRecords].sort((a, b) => b.date.localeCompare(a.date)).map((record) => { const vehicle = vehicles.find((item) => item.id === record.vehicleId); return <tr key={record.id}><td><strong>{vehicle?.name || "Removed vehicle"}</strong><small>{vehicle ? `${vehicle.brand} ${vehicle.model}` : ""}</small></td><td><strong>{record.serviceType}</strong></td><td>{formatDate(record.date)}</td><td>{Number(record.odometer).toLocaleString()} km</td><td><strong>₹{Number(record.cost).toFixed(2)}</strong></td><td className="service-history-notes">{record.notes || "—"}</td><td><button className="icon-button delete-button" title="Delete service record" onClick={() => onDelete(record.id)}><Trash2 size={16} /></button></td></tr>; })}</tbody></table></div>
        </div>
      )}
    </section>
  );
}

function MaintenancePage({ vehicles, records, onAdd, onDelete }) {
  const totalCost = records.reduce((total, record) => total + Number(record.cost), 0);

  return (
    <section className="maintenance-page">
      <div className="page-intro">
        <div>
          <p className="muted">SERVICE LOG</p>
          <h2>Keep every service in check.</h2>
          <p className="description">A clear history of the work that keeps your vehicles moving.</p>
        </div>
        <span className="vehicle-count">{records.length} {records.length === 1 ? "record" : "records"}</span>
      </div>

      <div className="maintenance-summary">
        <div className="maintenance-total-icon"><Wrench size={21} /></div>
        <div><span>Total maintenance cost</span><strong>₹{totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></div>
        <div className="maintenance-summary-count"><span>Service records</span><strong>{records.length}</strong></div>
      </div>

      {vehicles.length === 0 ? (
        <div className="empty-vehicles maintenance-empty">
          <div className="empty-icon"><Car size={28} /></div>
          <h3>Add a vehicle before logging maintenance</h3>
          <p>Your service records will be connected to one of your saved vehicles.</p>
        </div>
      ) : records.length === 0 ? (
        <div className="empty-vehicles maintenance-empty">
          <div className="empty-icon"><Wrench size={28} /></div>
          <h3>No maintenance records yet</h3>
          <p>Log your next service to keep a complete history for your vehicle.</p>
          <button className="add-button" onClick={onAdd}><Plus size={18} /> Add Maintenance</button>
        </div>
      ) : (
        <div className="maintenance-record-list">
          <div className="maintenance-list-header">
            <div><span className="label">MAINTENANCE HISTORY</span><h3>Recent service records</h3></div>
            <button className="secondary-add-button" onClick={onAdd}><Plus size={16} /> Add record</button>
          </div>
          <div className="maintenance-table-wrap">
            <table className="maintenance-table">
              <thead><tr><th>Date</th><th>Vehicle</th><th>Service type</th><th>Odometer</th><th>Cost</th><th>Notes</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {[...records].sort((a, b) => b.date.localeCompare(a.date)).map((record) => {
                  const vehicle = vehicles.find((item) => item.id === record.vehicleId);
                  return <tr key={record.id}>
                    <td>{formatDate(record.date)}</td>
                    <td><strong>{vehicle?.name || "Removed vehicle"}</strong><small>{vehicle ? `${vehicle.brand} ${vehicle.model}` : ""}</small></td>
                    <td><strong>{record.serviceType}</strong></td>
                    <td>{Number(record.odometer).toLocaleString()} km</td>
                    <td><strong>₹{Number(record.cost).toFixed(2)}</strong></td>
                    <td className="maintenance-notes">{record.notes || "—"}</td>
                    <td><button className="icon-button delete-button" title="Delete maintenance record" onClick={() => onDelete(record.id)}><Trash2 size={16} /></button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function ExpensesPage({ vehicles, expenses, onAdd, onDelete }) {
  const totalExpenses = expenses.reduce((total, expense) => total + Number(expense.amount), 0);

  return (
    <section className="expenses-page">
      <div className="page-intro">
        <div>
          <p className="muted">EXPENSE LOG</p>
          <h2>See the full cost of ownership.</h2>
          <p className="description">Keep every vehicle expense in one clear, searchable history.</p>
        </div>
        <span className="vehicle-count">{expenses.length} {expenses.length === 1 ? "expense" : "expenses"}</span>
      </div>

      <div className="expense-summary">
        <div className="expense-total-icon"><Wallet size={21} /></div>
        <div><span>Total expenses</span><strong>₹{totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></div>
        <div className="expense-summary-count"><span>Expense records</span><strong>{expenses.length}</strong></div>
      </div>

      {vehicles.length === 0 ? (
        <div className="empty-vehicles expense-empty">
          <div className="empty-icon"><Car size={28} /></div>
          <h3>Add a vehicle before logging expenses</h3>
          <p>Your expenses will be connected to one of your saved vehicles.</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="empty-vehicles expense-empty">
          <div className="empty-icon"><Wallet size={28} /></div>
          <h3>No expenses recorded yet</h3>
          <p>Log insurance, accessories, parking and other vehicle costs here.</p>
          <button className="add-button" onClick={onAdd}><Plus size={18} /> Add Expense</button>
        </div>
      ) : (
        <div className="expense-record-list">
          <div className="expense-list-header">
            <div><span className="label">EXPENSE HISTORY</span><h3>Recent expenses</h3></div>
            <button className="secondary-add-button" onClick={onAdd}><Plus size={16} /> Add expense</button>
          </div>
          <div className="expense-table-wrap">
            <table className="expense-table">
              <thead><tr><th>Date</th><th>Category</th><th>Vehicle</th><th>Amount</th><th>Notes</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {[...expenses].sort((a, b) => b.date.localeCompare(a.date)).map((expense) => {
                  const vehicle = vehicles.find((item) => item.id === expense.vehicleId);
                  return <tr key={expense.id}>
                    <td>{formatDate(expense.date)}</td>
                    <td><strong>{expense.category}</strong></td>
                    <td><strong>{vehicle?.name || "Removed vehicle"}</strong><small>{vehicle ? `${vehicle.brand} ${vehicle.model}` : ""}</small></td>
                    <td><strong>₹{Number(expense.amount).toFixed(2)}</strong></td>
                    <td className="expense-notes">{expense.notes || "—"}</td>
                    <td><button className="icon-button delete-button" title="Delete expense" onClick={() => onDelete(expense.id)}><Trash2 size={16} /></button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function getReminderStatus(dueDate) {
  const daysUntilDue = Math.ceil((new Date(`${dueDate}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000);
  if (daysUntilDue < 0) return "Overdue";
  if (daysUntilDue <= 7) return "Due Soon";
  return "Upcoming";
}

function RemindersPage({ vehicles, reminders, onAdd, onDelete }) {
  const overdueCount = reminders.filter((reminder) => getReminderStatus(reminder.dueDate) === "Overdue").length;
  const dueSoonCount = reminders.filter((reminder) => getReminderStatus(reminder.dueDate) === "Due Soon").length;
  const upcomingCount = reminders.filter((reminder) => getReminderStatus(reminder.dueDate) === "Upcoming").length;

  return (
    <section className="reminders-page">
      <div className="page-intro">
        <div>
          <p className="muted">KEEP IT MOVING</p>
          <h2>Nothing important slips by.</h2>
          <p className="description">Stay ahead of service dates, renewals and vehicle upkeep.</p>
        </div>
        <span className="vehicle-count">{reminders.length} {reminders.length === 1 ? "reminder" : "reminders"}</span>
      </div>

      <div className="reminder-summary-grid">
        <ReminderSummary label="Total reminders" value={reminders.length} className="reminder-total" />
        <ReminderSummary label="Upcoming" value={upcomingCount} className="reminder-upcoming" />
        <ReminderSummary label="Due soon" value={dueSoonCount} className="reminder-soon" />
        <ReminderSummary label="Overdue" value={overdueCount} className="reminder-overdue" />
      </div>

      {vehicles.length === 0 ? (
        <div className="empty-vehicles reminder-empty"><div className="empty-icon"><Car size={28} /></div><h3>Add a vehicle before creating reminders</h3><p>Your reminders will be connected to one of your saved vehicles.</p></div>
      ) : reminders.length === 0 ? (
        <div className="empty-vehicles reminder-empty"><div className="empty-icon"><Bell size={28} /></div><h3>No reminders yet</h3><p>Create a reminder for your next service, renewal or inspection.</p><button className="add-button" onClick={onAdd}><Plus size={18} /> Add Reminder</button></div>
      ) : (
        <div className="reminder-record-list">
          <div className="reminder-list-header"><div><span className="label">REMINDER LIST</span><h3>Upcoming and overdue</h3></div><button className="secondary-add-button" onClick={onAdd}><Plus size={16} /> Add reminder</button></div>
          <div className="reminder-cards">
            {[...reminders].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((reminder) => {
              const vehicle = vehicles.find((item) => item.id === reminder.vehicleId);
              const status = getReminderStatus(reminder.dueDate);
              return <article className={`reminder-card ${status.toLowerCase().replace(" ", "-")}`} key={reminder.id}>
                <div className="reminder-type-icon"><Bell size={19} /></div>
                <div className="reminder-card-content"><div className="reminder-card-top"><span className="reminder-type">{reminder.type}</span><span className={`reminder-status ${status.toLowerCase().replace(" ", "-")}`}>{status}</span></div><h3>{reminder.title}</h3><p>{vehicle?.name || "Removed vehicle"} · {vehicle ? `${vehicle.brand} ${vehicle.model}` : ""}</p><div className="reminder-meta"><span><CalendarDays size={14} /> Due {formatDate(reminder.dueDate)}</span>{reminder.dueOdometer && <span><Gauge size={14} /> {Number(reminder.dueOdometer).toLocaleString()} km</span>}</div>{reminder.notes && <small className="reminder-notes">{reminder.notes}</small>}</div>
                <button className="icon-button delete-button" title="Delete reminder" onClick={() => onDelete(reminder.id)}><Trash2 size={16} /></button>
              </article>;
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function ReminderSummary({ label, value, className }) {
  return <div className={`reminder-summary ${className}`}><span>{label}</span><strong>{value}</strong></div>;
}

function ReminderForm({ vehicles, onClose, onSave }) {
  const [reminder, setReminder] = useState({ ...emptyReminder, vehicleId: vehicles[0]?.id || "" });
  const updateField = (event) => setReminder({ ...reminder, [event.target.name]: event.target.value });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (reminder.dueOdometer !== "" && Number(reminder.dueOdometer) < 0) return;
    onSave(reminder);
  };

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-reminder-title">
      <div className="modal-header"><div><p className="eyebrow">REMINDER LIST</p><h2 id="add-reminder-title">Add Reminder</h2></div><button className="close-button" title="Close" onClick={onClose}><X size={19} /></button></div>
      <form onSubmit={handleSubmit}><div className="form-grid">
        <label>Vehicle<select name="vehicleId" value={reminder.vehicleId} onChange={updateField} required>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.brand} {vehicle.model}</option>)}</select></label>
        <label>Reminder type<select name="type" value={reminder.type} onChange={updateField}><option>Service</option><option>Insurance</option><option>PUC</option><option>Tyres</option><option>Other</option></select></label>
        <label className="full-field">Reminder title<input name="title" value={reminder.title} onChange={updateField} placeholder="e.g. Renew insurance" required /></label>
        <label>Due date<input name="dueDate" type="date" value={reminder.dueDate} onChange={updateField} required /></label>
        <label>Due odometer <span className="optional-label">(optional)</span><input name="dueOdometer" type="number" min="0" step="1" value={reminder.dueOdometer} onChange={updateField} placeholder="15000" /></label>
        <label className="full-field">Notes <span className="optional-label">(optional)</span><textarea name="notes" value={reminder.notes} onChange={updateField} placeholder="Add details about this reminder..." rows="3" /></label>
      </div><div className="modal-footer"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button className="add-button" type="submit"><Plus size={17} /> Save Reminder</button></div></form>
    </div>
  </div>;
}

function AnalyticsPage({ vehicles, fuelEntries, maintenanceRecords, expenses }) {
  const totalFuelCost = fuelEntries.reduce((total, entry) => total + Number(entry.amount), 0);
  const totalMaintenanceCost = maintenanceRecords.reduce((total, record) => total + Number(record.cost), 0);
  const totalExpenseCost = expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  const totalSpending = totalFuelCost + totalMaintenanceCost + totalExpenseCost;
  const mileage = calculateMileage(fuelEntries);

  return (
    <section className="analytics-page">
      <div className="page-intro">
        <div>
          <p className="muted">PERFORMANCE OVERVIEW</p>
          <h2>Make every kilometre count.</h2>
          <p className="description">A simple view of your vehicles, spending and running efficiency.</p>
        </div>
        <span className="vehicle-count">{vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"}</span>
      </div>

      <div className="analytics-stats-grid">
        <AnalyticsStat label="Total fuel cost" value={formatCurrency(totalFuelCost)} icon={<Fuel size={19} />} className="fuel-analytics-icon" />
        <AnalyticsStat label="Maintenance cost" value={formatCurrency(totalMaintenanceCost)} icon={<Wrench size={19} />} className="maintenance-analytics-icon" />
        <AnalyticsStat label="Other expenses" value={formatCurrency(totalExpenseCost)} icon={<Wallet size={19} />} className="expense-analytics-icon" />
        <AnalyticsStat label="Total spending" value={formatCurrency(totalSpending)} icon={<BarChart3 size={19} />} className="total-analytics-icon" />
      </div>

      <div className="analytics-insight">
        <div className="analytics-insight-icon"><Gauge size={21} /></div>
        <div><span>Estimated average mileage</span><strong>{mileage ? `${mileage.toFixed(1)} km/l` : "Need at least two fuel entries"}</strong></div>
        <small>Calculated from your odometer and fuel history.</small>
      </div>

      {vehicles.length === 0 ? (
        <div className="empty-vehicles analytics-empty">
          <div className="empty-icon"><BarChart3 size={28} /></div>
          <h3>No vehicle data yet</h3>
          <p>Add a vehicle and start logging activity to see its performance here.</p>
        </div>
      ) : (
        <div className="analytics-vehicles">
          <div className="analytics-section-header"><div><span className="label">VEHICLE BREAKDOWN</span><h3>Performance by vehicle</h3></div></div>
          <div className="analytics-vehicle-grid">
            {vehicles.map((vehicle) => {
              const vehicleFuel = fuelEntries.filter((entry) => entry.vehicleId === vehicle.id);
              const vehicleMaintenance = maintenanceRecords.filter((record) => record.vehicleId === vehicle.id);
              const vehicleExpenses = expenses.filter((expense) => expense.vehicleId === vehicle.id);
              const vehicleMileage = calculateMileage(vehicleFuel);
              return <article className="analytics-vehicle-card" key={vehicle.id}>
                <div className="analytics-vehicle-heading"><div className="analytics-car-icon"><Car size={20} /></div><div><strong>{vehicle.name}</strong><span>{vehicle.brand} {vehicle.model}</span></div></div>
                <div className="analytics-vehicle-metrics"><div><span>Fuel</span><strong>{formatCurrency(vehicleFuel.reduce((total, entry) => total + Number(entry.amount), 0))}</strong></div><div><span>Maintenance</span><strong>{formatCurrency(vehicleMaintenance.reduce((total, record) => total + Number(record.cost), 0))}</strong></div><div><span>Expenses</span><strong>{formatCurrency(vehicleExpenses.reduce((total, expense) => total + Number(expense.amount), 0))}</strong></div><div><span>Mileage</span><strong>{vehicleMileage ? `${vehicleMileage.toFixed(1)} km/l` : "—"}</strong></div></div>
              </article>;
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function AnalyticsStat({ label, value, icon, className }) {
  return <div className="analytics-stat"><div className={`analytics-stat-icon ${className}`}>{icon}</div><span>{label}</span><strong>{value}</strong></div>;
}

function formatCurrency(value) {
  return `₹${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function ExpenseForm({ vehicles, onClose, onSave }) {
  const [expense, setExpense] = useState({ ...emptyExpense, vehicleId: vehicles[0]?.id || "" });
  const updateField = (event) => setExpense({ ...expense, [event.target.name]: event.target.value });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (Number(expense.amount) < 0) return;
    onSave(expense);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-expense-title">
        <div className="modal-header"><div><p className="eyebrow">EXPENSE LOG</p><h2 id="add-expense-title">Add Expense</h2></div><button className="close-button" title="Close" onClick={onClose}><X size={19} /></button></div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>Category<select name="category" value={expense.category} onChange={updateField}><option>Fuel</option><option>Maintenance</option><option>Insurance</option><option>Parking</option><option>Accessories</option><option>Other</option></select></label>
            <label>Vehicle<select name="vehicleId" value={expense.vehicleId} onChange={updateField} required>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.brand} {vehicle.model}</option>)}</select></label>
            <label>Date<input name="date" type="date" value={expense.date} onChange={updateField} required /></label>
            <label>Amount<input name="amount" type="number" min="0" step="0.01" value={expense.amount} onChange={updateField} placeholder="2500" required /></label>
            <label className="full-field">Notes<textarea name="notes" value={expense.notes} onChange={updateField} placeholder="Add details about this expense..." rows="3" /></label>
          </div>
          <div className="modal-footer"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button className="add-button" type="submit"><Plus size={17} /> Save Expense</button></div>
        </form>
      </div>
    </div>
  );
}

function MaintenanceForm({ vehicles, onClose, onSave }) {
  const [record, setRecord] = useState({ ...emptyMaintenanceRecord, vehicleId: vehicles[0]?.id || "" });
  const updateField = (event) => setRecord({ ...record, [event.target.name]: event.target.value });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (Number(record.odometer) < 0 || Number(record.cost) < 0) return;
    onSave(record);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-maintenance-title">
        <div className="modal-header"><div><p className="eyebrow">SERVICE LOG</p><h2 id="add-maintenance-title">Add Maintenance</h2></div><button className="close-button" title="Close" onClick={onClose}><X size={19} /></button></div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="full-field">Vehicle<select name="vehicleId" value={record.vehicleId} onChange={updateField} required>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.brand} {vehicle.model}</option>)}</select></label>
            <label>Service type<input name="serviceType" value={record.serviceType} onChange={updateField} placeholder="e.g. Engine oil change" required /></label>
            <label>Date<input name="date" type="date" value={record.date} onChange={updateField} required /></label>
            <label>Odometer<input name="odometer" type="number" min="0" step="1" value={record.odometer} onChange={updateField} placeholder="12450" required /></label>
            <label>Cost<input name="cost" type="number" min="0" step="0.01" value={record.cost} onChange={updateField} placeholder="2800" required /></label>
            <label className="full-field">Notes<textarea name="notes" value={record.notes} onChange={updateField} placeholder="Add details about the service..." rows="3" /></label>
          </div>
          <div className="modal-footer"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button className="add-button" type="submit"><Plus size={17} /> Save Maintenance</button></div>
        </form>
      </div>
    </div>
  );
}

function FuelPage({ vehicles, entries, onAdd, onDelete }) {
  const totalCost = entries.reduce((total, entry) => total + Number(entry.amount), 0);
  const totalLitres = entries.reduce((total, entry) => total + Number(entry.quantity), 0);
  const averagePrice = totalLitres ? totalCost / totalLitres : 0;
  const latestOdometer = entries.length
    ? Math.max(...entries.map((entry) => Number(entry.odometer)))
    : 0;
  const mileage = calculateMileage(entries);
  const costPerKm = calculateCostPerKm(entries);

  return (
    <section className="fuel-page">
      <div className="page-intro">
        <div>
          <p className="muted">FUEL LOG</p>
          <h2>Know where every litre goes.</h2>
          <p className="description">Track fill-ups, running costs and real-world mileage across your vehicles.</p>
        </div>
        <span className="vehicle-count">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
      </div>

      <div className="fuel-stats-grid">
        <FuelStat label="Total fuel cost" value={`₹${totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <FuelStat label="Total litres" value={`${totalLitres.toLocaleString(undefined, { maximumFractionDigits: 2 })} L`} />
        <FuelStat label="Average fuel price" value={averagePrice ? `₹${averagePrice.toFixed(2)} / L` : "—"} />
        <FuelStat label="Latest odometer" value={latestOdometer ? `${latestOdometer.toLocaleString()} km` : "—"} />
      </div>

      {entries.length > 1 && (
        <div className="fuel-insights">
          <div><Gauge size={18} /><span>Estimated mileage<strong>{mileage ? `${mileage.toFixed(1)} km/l` : "Need more data"}</strong></span></div>
          <div><Wallet size={18} /><span>Cost per km<strong>{costPerKm ? `₹${costPerKm.toFixed(2)}` : "Need more data"}</strong></span></div>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="empty-vehicles fuel-empty">
          <div className="empty-icon"><Car size={28} /></div>
          <h3>Add a vehicle before logging fuel</h3>
          <p>Your fuel entries will be connected to one of your saved vehicles.</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="empty-vehicles fuel-empty">
          <div className="empty-icon"><Fuel size={28} /></div>
          <h3>No fuel entries yet</h3>
          <p>Start tracking your running costs with your next fill-up.</p>
          <button className="add-button" onClick={onAdd}><Plus size={18} /> Add Fuel Entry</button>
        </div>
      ) : (
        <div className="fuel-entry-list">
          <div className="fuel-list-header"><div><span className="label">FUEL HISTORY</span><h3>Recent fill-ups</h3></div><button className="secondary-add-button" onClick={onAdd}><Plus size={16} /> Add entry</button></div>
          <div className="fuel-table-wrap">
            <table className="fuel-table">
              <thead><tr><th>Date</th><th>Vehicle</th><th>Odometer</th><th>Quantity</th><th>Price / L</th><th>Total</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {[...entries].sort((a, b) => b.date.localeCompare(a.date)).map((entry) => {
                  const vehicle = vehicles.find((item) => item.id === entry.vehicleId);
                  return <tr key={entry.id}>
                    <td>{formatDate(entry.date)}</td>
                    <td><strong>{vehicle?.name || "Removed vehicle"}</strong><small>{vehicle ? `${vehicle.brand} ${vehicle.model}` : ""}</small></td>
                    <td>{Number(entry.odometer).toLocaleString()} km</td>
                    <td>{Number(entry.quantity).toFixed(2)} L</td>
                    <td>₹{Number(entry.pricePerLitre).toFixed(2)}</td>
                    <td><strong>₹{Number(entry.amount).toFixed(2)}</strong></td>
                    <td><button className="icon-button delete-button" title="Delete fuel entry" onClick={() => onDelete(entry.id)}><Trash2 size={16} /></button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function FuelStat({ label, value }) {
  return <div className="fuel-stat"><span>{label}</span><strong>{value}</strong></div>;
}

function calculateMileage(entries) {
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const mileageSamples = [];

  sortedEntries.forEach((entry, index) => {
    const previousEntry = sortedEntries
      .slice(0, index)
      .filter((candidate) => candidate.vehicleId === entry.vehicleId && Number(candidate.odometer) < Number(entry.odometer))
      .at(-1);
    if (previousEntry && Number(entry.quantity) > 0) {
      mileageSamples.push((Number(entry.odometer) - Number(previousEntry.odometer)) / Number(entry.quantity));
    }
  });

  return mileageSamples.length
    ? mileageSamples.reduce((total, sample) => total + sample, 0) / mileageSamples.length
    : 0;
}

function calculateCostPerKm(entries) {
  const distances = entries.reduce((total, entry) => {
    const vehicleEntries = entries.filter((candidate) => candidate.vehicleId === entry.vehicleId);
    if (entry.id !== vehicleEntries.reduce((latest, candidate) => Number(candidate.odometer) > Number(latest.odometer) ? candidate : latest, vehicleEntries[0]).id) {
      return total;
    }
    const firstOdometer = Math.min(...vehicleEntries.map((candidate) => Number(candidate.odometer)));
    return total + Number(entry.odometer) - firstOdometer;
  }, 0);
  const totalCost = entries.reduce((total, entry) => total + Number(entry.amount), 0);
  return distances > 0 ? totalCost / distances : 0;
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function FuelForm({ vehicles, onClose, onSave }) {
  const [entry, setEntry] = useState({ ...emptyFuelEntry, vehicleId: vehicles[0]?.id || "" });
  const amount = Number(entry.quantity || 0) * Number(entry.pricePerLitre || 0);
  const updateField = (event) => setEntry({ ...entry, [event.target.name]: event.target.value });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (Number(entry.odometer) < 0 || Number(entry.quantity) < 0 || Number(entry.pricePerLitre) < 0) return;
    onSave(entry);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-fuel-title">
        <div className="modal-header"><div><p className="eyebrow">FUEL LOG</p><h2 id="add-fuel-title">Add Fuel Entry</h2></div><button className="close-button" title="Close" onClick={onClose}><X size={19} /></button></div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="full-field">Vehicle<select name="vehicleId" value={entry.vehicleId} onChange={updateField} required>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.brand} {vehicle.model}</option>)}</select></label>
            <label>Date<input name="date" type="date" value={entry.date} onChange={updateField} required /></label>
            <label>Odometer reading<input name="odometer" type="number" min="0" step="1" value={entry.odometer} onChange={updateField} placeholder="12450" required /></label>
            <label>Fuel quantity (litres)<input name="quantity" type="number" min="0" step="0.01" value={entry.quantity} onChange={updateField} placeholder="35.5" required /></label>
            <label>Price per litre<input name="pricePerLitre" type="number" min="0" step="0.01" value={entry.pricePerLitre} onChange={updateField} placeholder="102.50" required /></label>
            <label>Full tank?<select name="fullTank" value={entry.fullTank} onChange={updateField}><option>Yes</option><option>No</option></select></label>
            <label>Total amount<input className="calculated-input" value={amount ? `₹${amount.toFixed(2)}` : "₹0.00"} readOnly /></label>
          </div>
          <div className="modal-footer"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button className="add-button" type="submit"><Plus size={17} /> Save Entry</button></div>
        </form>
      </div>
    </div>
  );
}

function VehicleForm({ onClose, onSave }) {
  const [vehicle, setVehicle] = useState(emptyVehicle);
  const updateField = (event) => setVehicle({ ...vehicle, [event.target.name]: event.target.value });

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(vehicle);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-vehicle-title">
        <div className="modal-header">
          <div><p className="eyebrow">YOUR GARAGE</p><h2 id="add-vehicle-title">Add Vehicle</h2></div>
          <button className="close-button" title="Close" onClick={onClose}><X size={19} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="full-field">Vehicle Name<input name="name" value={vehicle.name} onChange={updateField} placeholder="e.g. City Commuter" required /></label>
            <label>Brand<input name="brand" value={vehicle.brand} onChange={updateField} placeholder="e.g. Honda" required /></label>
            <label>Model<input name="model" value={vehicle.model} onChange={updateField} placeholder="e.g. City" required /></label>
            <label>Year<input name="year" type="number" min="1900" max="2100" value={vehicle.year} onChange={updateField} placeholder="2024" required /></label>
            <label>Fuel Type<select name="fuel" value={vehicle.fuel} onChange={updateField}><option>Petrol</option><option>Diesel</option><option>CNG</option><option>EV</option></select></label>
            <label>Transmission<select name="transmission" value={vehicle.transmission} onChange={updateField}><option>Manual</option><option>Automatic</option></select></label>
            <label>Current Odometer<input name="odometer" type="number" min="0" value={vehicle.odometer} onChange={updateField} placeholder="12450" required /></label>
          </div>
          <div className="modal-footer"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button className="add-button" type="submit"><Plus size={17} /> Save Vehicle</button></div>
        </form>
      </div>
    </div>
  );
}

export default App;