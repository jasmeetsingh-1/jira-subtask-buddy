import { createSlice, configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistConfig = {
  key: "jira-task-manager",
  storage,
};

// Auth slice
const authInitialState = {
  isLoggedIn: false,
  username: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState: authInitialState,
  reducers: {
    login: (state, action) => {
      state.isLoggedIn = true;
      state.username = action.payload.username;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.username = "";
    },
  },
});

// Timesheet slice
const timesheetInitialState = {
  timesheets: [] as Array<{
    id: string;
    title: string;
    entries: Array<{
      id: string;
      label: string;
      path: string;
    }>;
  }>,
};

const timesheetSlice = createSlice({
  name: "timesheet",
  initialState: timesheetInitialState,
  reducers: {
    addTimesheet: (state, action) => {
      state.timesheets.push(action.payload);
    },
    deleteTimesheet: (state, action) => {
      state.timesheets = state.timesheets.filter(t => t.id !== action.payload);
    },
    setTimesheets: (state, action) => {
      state.timesheets = action.payload;
    },
  },
});

// Work types slice
const workTypesInitialState = {
  workTypes: [
    { id: "1", name: "Development", isDefault: true },
    { id: "2", name: "Testing", isDefault: false },
    { id: "3", name: "Analysis", isDefault: false },
    { id: "4", name: "Documentation", isDefault: false },
    { id: "5", name: "Meeting", isDefault: false },
  ],
};

const workTypesSlice = createSlice({
  name: "workTypes",
  initialState: workTypesInitialState,
  reducers: {
    setDefaultWorkType: (state, action) => {
      state.workTypes = state.workTypes.map(wt => ({
        ...wt,
        isDefault: wt.id === action.payload,
      }));
    },
    setWorkTypes: (state, action) => {
      state.workTypes = action.payload;
    },
  },
});

// Theme slice
const themeInitialState = {
  isDarkMode: false,
};

const themeSlice = createSlice({
  name: "theme",
  initialState: themeInitialState,
  reducers: {
    toggleTheme: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    setTheme: (state, action) => {
      state.isDarkMode = action.payload;
    },
  },
});

const rootReducer = combineReducers({
  auth: authSlice.reducer,
  timesheet: timesheetSlice.reducer,
  workTypes: workTypesSlice.reducer,
  theme: themeSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const authActions = authSlice.actions;
export const timesheetActions = timesheetSlice.actions;
export const workTypesActions = workTypesSlice.actions;
export const themeActions = themeSlice.actions;

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
export { persistor };