import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { evolveFingerprint } from "../utils/fingerprintEvolution";

export const updateUserFingerprint = async (uid) => {
  try {

    // 1️⃣ Get baseline fingerprint
    const baselineRef = doc(db, "users", uid, "fingerprint", "current");
    const baselineSnap = await getDoc(baselineRef);

    if (!baselineSnap.exists()) {
      throw new Error("Baseline fingerprint not found");
    }

    const baseline = baselineSnap.data();

    // 2️⃣ Get last 7 check-ins
    const checkinsRef = collection(db, "users", uid, "dailyCheckins");
    const checkinsSnap = await getDocs(checkinsRef);

    const weeklyCheckins = checkinsSnap.docs
      .map(doc => doc.data())
      .slice(-7);

    if (weeklyCheckins.length < 5) {
      console.log("Not enough data to evolve fingerprint");
      return;
    }

    // 3️⃣ Compute evolution
    const evolutionData = evolveFingerprint(baseline, weeklyCheckins);

    // 4️⃣ Save updated fingerprint
    await setDoc(baselineRef, {
      ...baseline,
      ...evolutionData,
      fingerprint_version: (baseline.fingerprint_version || 1) + 1,
      last_updated: new Date().toISOString()
    }, { merge: true });

    console.log("Fingerprint evolved successfully");

  } catch (error) {
    console.error("Fingerprint update failed:", error);
  }
};

