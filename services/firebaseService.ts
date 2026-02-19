
import { ref, get, set, remove, onValue, off } from "firebase/database";
import { database } from "./firebase";
import { Session, Participant } from "../types";

const SESSIONS_PATH = "sessions";
const MASTER_LIST_PATH = "master_list";

// --- Session Management ---

export const getSessions = async (): Promise<Session[]> => {
  const snapshot = await get(ref(database, SESSIONS_PATH));
  if (snapshot.exists()) {
    const sessions = snapshot.val();
    // Convert from object to array and sort by date
    return Object.values(sessions).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } else {
    return [];
  }
};

export const getSession = async (sessionId: string): Promise<Session | null> => {
    const snapshot = await get(ref(database, `${SESSIONS_PATH}/${sessionId}`));
    return snapshot.exists() ? snapshot.val() : null;
};

export const saveSession = (session: Session) => {
  return set(ref(database, `${SESSIONS_PATH}/${session.id}`), session);
};

export const deleteSession = (sessionId: string) => {
  return remove(ref(database, `${SESSIONS_PATH}/${sessionId}`));
};


// --- Master List Management ---

export const getMasterList = async (): Promise<string[]> => {
  const snapshot = await get(ref(database, MASTER_LIST_PATH));
  return snapshot.exists() ? snapshot.val() : [];
};

export const saveMasterList = (masterList: string[]) => {
  return set(ref(database, MASTER_LIST_PATH), masterList);
};


// --- Real-time listeners ---

export const onSessionsChange = (callback: (sessions: Session[]) => void) => {
  const sessionsRef = ref(database, SESSIONS_PATH);
  const listener = onValue(sessionsRef, (snapshot) => {
    if (snapshot.exists()) {
      const sessions = snapshot.val();
      const sessionsArray = Object.values(sessions).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(sessionsArray);
    } else {
      callback([]);
    }
  });

  // Return a function to detach the listener
  return () => off(sessionsRef, 'value', listener);
};

export const onMasterListChange = (callback: (masterList: string[]) => void) => {
  const masterListRef = ref(database, MASTER_LIST_PATH);
  const listener = onValue(masterListRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : []);
  });

  // Return a function to detach the listener
  return () => off(masterListRef, 'value', listener);
};
