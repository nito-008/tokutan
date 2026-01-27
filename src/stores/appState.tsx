import {
  type Accessor,
  type Component,
  createContext,
  type JSXElement,
  type Setter,
  useContext,
} from "solid-js";
import type { AppState } from "~/lib/init";
import type { EnrollmentData, GraduationRequirements, UserProfile } from "~/lib/types";

const AppStateContext = createContext<Accessor<AppState | null>>();
const AppStateSetterContext = createContext<Setter<AppState | null>>();

interface AppStateProviderProps {
  state: Accessor<AppState | null>;
  setState: Setter<AppState | null>;
  children: JSXElement;
}

export const AppStateProvider: Component<AppStateProviderProps> = (props) => (
  <AppStateContext.Provider value={props.state}>
    <AppStateSetterContext.Provider value={props.setState}>
      {props.children}
    </AppStateSetterContext.Provider>
  </AppStateContext.Provider>
);

const ensureContext = <T,>(value: T | undefined, name: string): T => {
  if (!value) {
    throw new Error(`${name} must be used within AppStateProvider`);
  }
  return value;
};

export const useAppState = () => ensureContext(useContext(AppStateContext), "AppState");
export const useAppStateSetter = () =>
  ensureContext(useContext(AppStateSetterContext), "AppStateSetter");

export const useAppStateActions = () => {
  const appState = useAppState();
  const setAppState = useAppStateSetter();

  const updateEnrollment = (enrollment: EnrollmentData) => {
    setAppState((prev) => (prev ? { ...prev, enrollment } : prev));
  };

  const updateRequirements = (requirements: GraduationRequirements) => {
    setAppState((prev) => (prev ? { ...prev, requirements } : prev));
  };

  const updateProfile = (updater: (profile: UserProfile) => UserProfile) => {
    setAppState((prev) =>
      prev
        ? {
            ...prev,
            profile: updater(prev.profile),
          }
        : prev,
    );
  };

  const replaceAppState = (state: AppState) => {
    setAppState(state);
  };

  return {
    appState,
    setAppState,
    replaceAppState,
    updateEnrollment,
    updateRequirements,
    updateProfile,
  };
};
