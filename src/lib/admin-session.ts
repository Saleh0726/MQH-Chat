import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const cookieName = "mqh_admin_session";
function secret(){const value=process.env.SESSION_SECRET;if(!value||value.length<32)throw new Error("SESSION_SECRET must be configured.");return new TextEncoder().encode(value);}
export async function createAdminSession(){const token=await new SignJWT({role:"admin",email:process.env.ADMIN_EMAIL}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("8h").sign(secret());(await cookies()).set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*8});}
export async function isAdminSession(){try{const token=(await cookies()).get(cookieName)?.value;if(!token)return false;const {payload}=await jwtVerify(token,secret());return payload.role==="admin"&&typeof payload.email==="string"&&payload.email.toLowerCase()===process.env.ADMIN_EMAIL?.toLowerCase();}catch{return false;}}
export async function clearAdminSession(){(await cookies()).delete(cookieName);}
