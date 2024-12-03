import { auth } from "@clerk/nextjs/server";

const { sessionClaims } = await auth();
export const role = (sessionClaims?.metadata as { role?: string })?.role;

console.log("User role:", role);
