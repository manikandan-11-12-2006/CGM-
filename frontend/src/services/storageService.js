import { ref, set, push, get, child, update, remove } from "firebase/database";
import { db } from "../firebase";

const REPORTS_PATH = 'reports';

export async function getSavedReports() {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, REPORTS_PATH));
    if (snapshot.exists()) {
      const data = snapshot.val();
      // data is an object with push keys, convert to array
      const reports = Object.keys(data).map(key => ({ ...data[key], firebaseKey: key }));
      // The old system might have saved timestamp or id. Let's sort by timestamp descending, or reverse order.
      return reports.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error reading from Firebase', error);
    return [];
  }
}

export async function saveReportLocal(report) {
  try {
    const reportRef = push(ref(db, REPORTS_PATH));
    const newReport = { ...report, id: reportRef.key };
    await set(reportRef, newReport);
    return { ...newReport, firebaseKey: reportRef.key };
  } catch (error) {
    console.error('Error saving to Firebase', error);
    throw error;
  }
}

export async function updateReportStatusLocal(firebaseKey, status) {
  if (!firebaseKey) return;
  try {
    const reportRef = ref(db, `${REPORTS_PATH}/${firebaseKey}`);
    await update(reportRef, { status });
  } catch (error) {
    console.error('Error updating report status in Firebase', error);
  }
}

export async function clearAllReportsLocal() {
  try {
    const reportRef = ref(db, REPORTS_PATH);
    await remove(reportRef);
  } catch (error) {
    console.error('Error clearing Firebase', error);
  }
}
