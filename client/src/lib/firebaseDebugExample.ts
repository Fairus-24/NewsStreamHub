import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Cek apakah user sudah like artikel tertentu
export async function checkUserLikedArticle(articleId: string, userId: string) {
  const articleRef = doc(db, "articles", articleId);
  const snap = await getDoc(articleRef);
  if (snap.exists()) {
    const data = snap.data();
    console.log("Likes array:", data.likes);
    return Array.isArray(data.likes) && data.likes.includes(userId);
  }
  return false;
}

// Cek apakah artikel sudah di-bookmark user tertentu
export async function checkUserBookmarkedArticle(userId: string, articleId: string) {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data();
    console.log("Bookmarks array:", data.bookmarks);
    return Array.isArray(data.bookmarks) && data.bookmarks.includes(articleId);
  }
  return false;
}
