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
  userData:{},
  jsid: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState: authInitialState,
  reducers: {
    login: (state, action) => {
      console.log("action.payload in login >>>", action.payload);
      state.isLoggedIn = true;
      state.userData = {
        ...action.payload.userData.data,
      }
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.userData = {};
      state.jsid = "";
    },
    setJsid: (state, action) => {
      state.jsid = action.payload;
      if (action.payload) {
        state.isLoggedIn = true;
      }
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

const workTypesInitialState = {
  workTypes: [
  { id: 1, name: "Development", value: "16701", isDefault: true },
  { id: 2, name: "Bug Fixing", value: "16708", isDefault: false },
  { id: 3, name: "Meetings", value: "16705", isDefault: false },
  { id: 4, name: "Documentation", value: "16704", isDefault: false },
  { id: 5, name: "Code Review", value: "16702", isDefault: false },
  { id: 6, name: "Automation Script Writing", value: "16865", isDefault: false },
  { id: 7, name: "Design review", value: "16703", isDefault: false },
  { id: 8, name: "Devops", value: "16713", isDefault: false },
  { id: 9, name: "Eng Internal Tech Support", value: "16907", isDefault: false },
  { id: 10, name: "Grooming", value: "16707", isDefault: false },
  { id: 11, name: "R&D", value: "16700", isDefault: false },
  { id: 12, name: "Re-Testing", value: "16710", isDefault: false },
  { id: 13, name: "Scrum Meeting", value: "16706", isDefault: false },
  { id: 14, name: "Test Case Writing", value: "16711", isDefault: false },
  { id: 15, name: "Testing", value: "16709", isDefault: false },
  { id: 16, name: "Time Sheet Update", value: "16906", isDefault: false },
  { id: 17, name: "Unit Testing", value: "16712", isDefault: false },
  { id: 18, name: "New Joinee Onboarding and Training ", value: "16910", isDefault: false }
]};


const workTypesSlice = createSlice({
  name: "workTypes",
  initialState: workTypesInitialState,
  reducers: {
    setDefaultWorkType: (state, action) => {
      state.workTypes = state.workTypes.map(wt => ({
        ...wt,
        isDefault: wt.id == action.payload,
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