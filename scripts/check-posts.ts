import { getAllPosts } from "../src/lib/blog";

const posts = getAllPosts();
console.log("Total posts:", posts.length);
const cats: Record<string, number> = {};
posts.forEach((p) => {
  cats[p.category] = (cats[p.category] || 0) + 1;
});
console.log("Categories:", JSON.stringify(cats, null, 2));
