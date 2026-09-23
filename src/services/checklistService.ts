import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { DailyChecklistReport, InspectionStatus } from '../types';

const COLLECTION_NAME = 'daily_checklists';
const LOCAL_STORAGE_KEY = 'sicheck_offline_reports';

// Helper to get local cache
function getLocalReports(): DailyChecklistReport[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Helper to save local cache
function setLocalReports(reports: DailyChecklistReport[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

// Subscribe to real-time updates from Firestore (with local fallback)
export function subscribeToChecklists(
  onData: (reports: DailyChecklistReport[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('submittedAt', 'desc'), limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reports: DailyChecklistReport[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          reports.push({
            id: d.id,
            date: data.date || '',
            time: data.time || '',
            shift: data.shift || 'Pagi',
            obName: data.obName || '',
            obNotes: data.obNotes || '',
            obSignature: data.obSignature || '',
            submittedAt: data.submittedAt || new Date().toISOString(),
            inspectionStatus: data.inspectionStatus || 'pending_review',
            spvName: data.spvName || '',
            spvRating: data.spvRating,
            spvNotes: data.spvNotes || '',
            spvSignature: data.spvSignature || '',
            reviewedAt: data.reviewedAt || '',
            areas: data.areas || [],
          });
        });

        setLocalReports(reports);
        onData(reports);
      },
      (error) => {
        console.warn('Firestore offline, pakai cache lokal:', error.message);
        onData(getLocalReports());
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    onData(getLocalReports());
    return () => {};
  }
}

// Add new checklist submitted by OB
export async function saveChecklistReport(report: Omit<DailyChecklistReport, 'id'>): Promise<string> {
  // Always update local cache first for instant UI response
  const newId = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const completeReport: DailyChecklistReport = {
    ...report,
    id: newId,
  };

  const locals = getLocalReports();
  setLocalReports([completeReport, ...locals]);

  try {
    const colRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(colRef, {
      ...report,
      createdAtServer: serverTimestamp(),
    });
    // Update local ID if firestore succeeded
    completeReport.id = docRef.id;
    setLocalReports([completeReport, ...locals]);
    return docRef.id;
  } catch (err) {
    console.warn('Saved report to local storage (Firestore write error):', err);
    return newId;
  }
}

// SPV Review / Approval update
export async function updateSPVReview(
  reportId: string,
  reviewData: {
    inspectionStatus: InspectionStatus;
    spvName: string;
    spvRating: number;
    spvNotes: string;
    spvSignature?: string;
    reviewedAt: string;
  }
): Promise<void> {
  // Update local storage
  const locals = getLocalReports();
  const updatedLocals = locals.map((r) =>
    r.id === reportId ? { ...r, ...reviewData } : r
  );
  setLocalReports(updatedLocals);

  try {
    const docRef = doc(db, COLLECTION_NAME, reportId);
    await updateDoc(docRef, {
      ...reviewData,
      updatedAtServer: serverTimestamp(),
    });
  } catch (err) {
    console.warn('SPV review updated in local cache (Firestore update error):', err);
  }
}

// Delete report
export async function deleteChecklistReport(reportId: string): Promise<void> {
  const locals = getLocalReports();
  setLocalReports(locals.filter((r) => r.id !== reportId));

  try {
    const docRef = doc(db, COLLECTION_NAME, reportId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Deleted from local storage (Firestore error):', err);
  }
}
